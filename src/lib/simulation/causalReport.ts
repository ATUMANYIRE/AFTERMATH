import {
  CausalIncidentReport,
  InterventionAction,
  InterventionEvaluation,
  InterventionType,
  ScenarioId,
  SimulationTrajectory,
} from "./types";
import { INTERVENTION_CATALOG, SCENARIOS } from "./scenarios";
import { createCounterfactualBranch } from "./engine";
import { roundTo } from "./prng";

const CANDIDATE_INTERVENTIONS: InterventionType[] = [
  "ROLLBACK_DEPLOYMENT",
  "ADD_REPLICAS",
  "THROTTLE_TRAFFIC",
  "ADJUST_CONNECTION_POOL",
  "ENABLE_CIRCUIT_BREAKER",
];

/**
 * Evaluates all candidate interventions deterministically at `evaluationTime`
 * against the baseline trajectory so the causal report compares real simulated deltas.
 */
export function evaluateAlternativeInterventions(
  baselineTrajectory: SimulationTrajectory,
  evaluationTime: number
): InterventionEvaluation[] {
  const scenario = SCENARIOS[baselineTrajectory.scenarioId];

  return CANDIDATE_INTERVENTIONS.map((type) => {
    const catalog = INTERVENTION_CATALOG[type];
    const action: InterventionAction = {
      id: `eval-${type}-${evaluationTime}`,
      type,
      appliedAtTime: evaluationTime,
      label: catalog.label,
      parameterValue: catalog.defaultParameterValue,
      rationale: "Counterfactual sensitivity evaluation",
    };

    const simulatedBranch = createCounterfactualBranch({
      sourceTrajectory: baselineTrajectory,
      branchTime: evaluationTime,
      newInterventions: [action],
    });

    const baseSum = baselineTrajectory.summary;
    const branchSum = simulatedBranch.summary;

    const peakErrorRateDeltaPct = roundTo(
      (branchSum.peakErrorRate - baseSum.peakErrorRate) * 100,
      1
    );
    const peakLatencyDeltaMs = Math.round(
      branchSum.peakLatencyMs - baseSum.peakLatencyMs
    );
    const availabilityDeltaPct = roundTo(
      branchSum.availabilityPct - baseSum.availabilityPct,
      2
    );

    let expectedOutcome: InterventionEvaluation["expectedOutcome"] = "tradeoff";
    if (type === scenario.rootCauseGroundTruth.recommendedIntervention) {
      expectedOutcome = "effective";
    } else if (
      type === scenario.rootCauseGroundTruth.failingIntervention ||
      availabilityDeltaPct <= 1.5
    ) {
      expectedOutcome = "counterproductive";
    }

    let causalMechanism = catalog.engineeringMechanism;
    if (
      baselineTrajectory.scenarioId === "checkout-db-exhaustion" &&
      type === "ADJUST_CONNECTION_POOL"
    ) {
      causalMechanism =
        "Counterproductive under N+1 query regression: increasing max connections from 120 to 200 admits 67% more concurrent 6.8x query fanout into the database, intensifying lock contention and keeping DB saturation near 100%.";
    } else if (
      baselineTrajectory.scenarioId === "checkout-db-exhaustion" &&
      type === "ROLLBACK_DEPLOYMENT"
    ) {
      causalMechanism =
        "Directly eliminates the root cause by reverting v2.5.0-canary-n+1 -> v2.4.0-stable, restoring query fanout to 1.2 queries/req and draining leaked connection handles.";
    } else if (
      baselineTrajectory.scenarioId === "traffic-spike-replicas" &&
      type === "ADD_REPLICAS"
    ) {
      causalMechanism =
        "Directly resolves compute starvation: after the 3s container readiness warmup, horizontal scale-out raises aggregate service capacity above the 1,520 req/s flash-sale arrival rate and drains the queue.";
    } else if (
      baselineTrajectory.scenarioId === "traffic-spike-replicas" &&
      type === "ROLLBACK_DEPLOYMENT"
    ) {
      causalMechanism =
        "Counterproductive during a pure traffic surge: v2.4.0-stable has no code regression, so triggering a rollback causes a rolling pod restart that temporarily reduces capacity by 28%.";
    } else if (
      baselineTrajectory.scenarioId === "dependency-timeout-cascade" &&
      type === "ENABLE_CIRCUIT_BREAKER"
    ) {
      causalMechanism =
        "Directly breaks the Little's Law starvation loop: trips open when Fraud API latency (2,400ms) > 350ms, routing to a 14ms local heuristic fallback (~3.5% conservative reject tradeoff) and immediately freeing blocked worker threads.";
    } else if (type === "THROTTLE_TRAFFIC") {
      causalMechanism =
        "Operational tradeoff: shedding 40% of ingress at the API Gateway relieves downstream queues and DB saturation, but intentionally fails 40% of customer requests with HTTP 429.";
    }

    return {
      type,
      name: catalog.label,
      shortDescription: catalog.description,
      expectedOutcome,
      causalMechanism,
      simulatedDeltaSummary: {
        peakErrorRateDeltaPct,
        peakLatencyDeltaMs,
        availabilityDeltaPct,
        recoveryTimeSeconds: branchSum.recoveryTimeSeconds,
      },
    };
  });
}

/**
 * Generates a complete, deterministic, evidence-backed CausalIncidentReport
 * from the baseline trajectory and optional counterfactual branch trajectory.
 */
export function generateCausalIncidentReport(
  scenarioId: ScenarioId,
  baselineTrajectory: SimulationTrajectory,
  branchTrajectory: SimulationTrajectory | null
): CausalIncidentReport {
  const scenario = SCENARIOS[scenarioId];
  const baseSum = baselineTrajectory.summary;
  const branchSum = branchTrajectory?.summary ?? null;

  const evalTime =
    branchTrajectory?.branchedFromTime ?? scenario.incidentTriggerTime + 6;
  const evaluations = evaluateAlternativeInterventions(
    baselineTrajectory,
    evalTime
  );

  // Build causal chain grounded in actual state transitions
  const causalChain: string[] = [];
  if (scenarioId === "checkout-db-exhaustion") {
    causalChain.push(
      `t = ${scenario.incidentTriggerTime}s: Canary release v2.5.0-canary-n+1 deployed to Checkout Service; DB query fanout jumped from 1.2 to 6.8 queries/request.`
    );
    causalChain.push(
      `t = ${scenario.incidentTriggerTime + 1}s..${scenario.incidentTriggerTime + 8}s: Unclosed transaction handles leaked at +5.2 conns/s once DB saturation crossed 40%, driving activeConnections to the ${baselineTrajectory.snapshots[0].state.connectionPoolLimit}-connection ceiling.`
    );
    causalChain.push(
      `Pool exhaustion collapsed effective serviceCapacity from ${baselineTrajectory.snapshots[0].state.serviceCapacity} req/s down to ${Math.round(baseSum.finalState.serviceCapacity)} req/s, driving queueDepth to ${baseSum.peakQueueDepth} and p95 latency to ${baseSum.peakLatencyMs}ms.`
    );
  } else if (scenarioId === "traffic-spike-replicas") {
    causalChain.push(
      `t = ${scenario.incidentTriggerTime}s: Flash-sale traffic surged from ~440 req/s to ~1,520 req/s (+245%), exceeding the 600 req/s aggregate capacity of 4 healthy replicas.`
    );
    causalChain.push(
      `Net arrival surplus (lambda - mu > 900 req/s) caused rapid queue accumulation up to ${baseSum.peakQueueDepth} queued requests.`
    );
    causalChain.push(
      `Severe queue backlog triggered CPU context-switch thrashing and caused a replica liveness probe failure (healthyReplicaCount dropped to ${baseSum.minHealthyReplicas}), pushing errorRate to ${(baseSum.peakErrorRate * 100).toFixed(1)}%.`
    );
  } else {
    causalChain.push(
      `t = ${scenario.incidentTriggerTime}s: Synchronous upstream Fraud Scoring API degraded from 20ms to 2,400ms response latency.`
    );
    causalChain.push(
      `By Little's Law (L = lambda * W), 40x longer holding time pinned worker threads and held DB connections open (${ baselineTrajectory.snapshots[0].state.connectionPoolLimit } pool limit saturated).`
    );
    causalChain.push(
      `Effective serviceCapacity collapsed from 780 req/s to ${Math.round(baseSum.finalState.serviceCapacity)} req/s, causing queue overflow (${baseSum.peakQueueDepth}) and ${(baseSum.peakErrorRate * 100).toFixed(1)}% cascading timeouts.`
    );
  }

  const mathematicalEvidence = [
    `Governing Relation: ${scenario.rootCauseGroundTruth.governingEquation}`,
    `Baseline Unmitigated Peak Error Rate: ${(baseSum.peakErrorRate * 100).toFixed(1)}% (${baseSum.totalFailedRequests.toLocaleString()} failed requests over ${scenario.durationSeconds}s window).`,
    `Baseline Peak p95 Latency: ${baseSum.peakLatencyMs.toLocaleString()} ms | Peak Queue Depth: ${baseSum.peakQueueDepth.toLocaleString()} requests | Peak DB Saturation: ${(baseSum.peakDbSaturation * 100).toFixed(1)}%.`,
  ];

  if (branchTrajectory && branchSum) {
    const savedRequests = Math.max(
      0,
      baseSum.totalFailedRequests - branchSum.totalFailedRequests
    );
    mathematicalEvidence.push(
      `Counterfactual Branch (from t = ${branchTrajectory.branchedFromTime}s): Applied [${branchTrajectory.interventions.map((i) => i.label).join(", ")}], shifting overall availability from ${baseSum.availabilityPct.toFixed(2)}% to ${branchSum.availabilityPct.toFixed(2)}% (${savedRequests.toLocaleString()} fewer failed requests).`
    );
  }

  const keyEvidence = [
    {
      metric: "Aggregate Availability",
      baselinePeak: `${baseSum.availabilityPct.toFixed(2)}%`,
      counterfactualPeak: branchSum
        ? `${branchSum.availabilityPct.toFixed(2)}%`
        : "— (No branch)",
      delta: branchSum
        ? `${branchSum.availabilityPct - baseSum.availabilityPct >= 0 ? "+" : ""}${(branchSum.availabilityPct - baseSum.availabilityPct).toFixed(2)}%`
        : "0.00%",
      interpretation:
        branchSum && branchSum.availabilityPct > baseSum.availabilityPct + 5
          ? "Intervention significantly increased successful request completion."
          : "Availability remained constrained by unmitigated bottleneck or load shedding.",
    },
    {
      metric: "Peak Error Rate",
      baselinePeak: `${(baseSum.peakErrorRate * 100).toFixed(1)}%`,
      counterfactualPeak: branchSum
        ? `${(branchSum.peakErrorRate * 100).toFixed(1)}%`
        : "—",
      delta: branchSum
        ? `${((branchSum.peakErrorRate - baseSum.peakErrorRate) * 100).toFixed(1)}%`
        : "0.0%",
      interpretation: "Maximum fraction of requests failing or shed during the simulation window.",
    },
    {
      metric: "Peak p95 Latency",
      baselinePeak: `${baseSum.peakLatencyMs.toLocaleString()} ms`,
      counterfactualPeak: branchSum
        ? `${branchSum.peakLatencyMs.toLocaleString()} ms`
        : "—",
      delta: branchSum
        ? `${branchSum.peakLatencyMs - baseSum.peakLatencyMs} ms`
        : "0 ms",
      interpretation: "End-to-end p95 latency including queueing delay and connection pool wait.",
    },
    {
      metric: "Final Error Rate (t = 60s)",
      baselinePeak: `${(baseSum.finalState.errorRate * 100).toFixed(1)}%`,
      counterfactualPeak: branchSum
        ? `${(branchSum.finalState.errorRate * 100).toFixed(1)}%`
        : "—",
      delta: branchSum
        ? `${((branchSum.finalState.errorRate - baseSum.finalState.errorRate) * 100).toFixed(1)}%`
        : "0.0%",
      interpretation: "Steady-state error rate at the end of the 60s rehearsal window.",
    },
    {
      metric: "Cumulative Failed Requests",
      baselinePeak: baseSum.totalFailedRequests.toLocaleString(),
      counterfactualPeak: branchSum
        ? branchSum.totalFailedRequests.toLocaleString()
        : "—",
      delta: branchSum
        ? `${branchSum.totalFailedRequests - baseSum.totalFailedRequests}`
        : "0",
      interpretation: "Integrated failed request volume across all 60 discrete 1s simulation steps.",
    },
  ];

  let recoveryOutcome: CausalIncidentReport["recoveryOutcome"];
  if (!branchTrajectory || !branchSum) {
    recoveryOutcome = {
      status: "NO_INTERVENTION",
      headline: "No Counterfactual Branch Applied Yet",
      explanation:
        "Rewind the timeline to a snapshot near incident onset (t = 8s..18s) and apply an intervention to evaluate a counterfactual recovery branch against the baseline outage.",
    };
  } else if (
    branchSum.recoveredByEnd &&
    branchSum.availabilityPct > baseSum.availabilityPct + 10
  ) {
    recoveryOutcome = {
      status: "RECOVERED",
      headline: `System Stabilized — Availability Improved by +${(branchSum.availabilityPct - baseSum.availabilityPct).toFixed(1)}%`,
      explanation: `Applying [${branchTrajectory.interventions.map((i) => i.label).join(", ")}] at t = ${branchTrajectory.branchedFromTime}s addressed the primary bottleneck, draining queue depth to ${branchSum.finalState.queueDepth} and restoring final p95 latency to ${branchSum.finalState.latencyEstimate}ms (error rate ${(branchSum.finalState.errorRate * 100).toFixed(1)}%).`,
    };
  } else if (branchSum.availabilityPct > baseSum.availabilityPct + 2) {
    recoveryOutcome = {
      status: "PARTIAL_MITIGATION",
      headline: "Partial Mitigation with Explicit Operational Tradeoffs",
      explanation: `The counterfactual branch reduced downstream stress or queue depth (final latency ${branchSum.finalState.latencyEstimate}ms vs ${baseSum.finalState.latencyEstimate}ms), but retained elevated error/shed rate (${(branchSum.finalState.errorRate * 100).toFixed(1)}%) due to traffic throttling or incomplete root-cause removal.`,
    };
  } else {
    recoveryOutcome = {
      status: "UNRECOVERED",
      headline: "Counterfactual Intervention Failed to Resolve Root Bottleneck",
      explanation: `Applying [${branchTrajectory.interventions.map((i) => i.label).join(", ")}] at t = ${branchTrajectory.branchedFromTime}s did not resolve the governing constraint (${scenario.rootCauseGroundTruth.whyNaiveFixesFail}). Final error rate remained ${(branchSum.finalState.errorRate * 100).toFixed(1)}% with p95 latency ${branchSum.finalState.latencyEstimate}ms.`,
    };
  }

  return {
    scenario,
    seed: baselineTrajectory.seed,
    generatedAtIso: new Date().toISOString(),
    baselineTrajectory,
    branchTrajectory,
    rootCauseHypothesis: {
      headline: scenario.rootCauseGroundTruth.primaryMechanism,
      causalChain,
      mathematicalEvidence,
    },
    keyEvidence,
    interventionEvaluations: evaluations,
    recoveryOutcome,
    modelAssumptions: scenario.assumptions,
    modelLimitations: scenario.limitations,
  };
}

/**
 * Formats a CausalIncidentReport as an evidence-backed Markdown document for download/export.
 */
export function formatReportAsMarkdown(report: CausalIncidentReport): string {
  const lines: string[] = [
    `# AFTERMATH — Counterfactual Incident Recovery Report`,
    ``,
    `- **Scenario**: ${report.scenario.title} (\`${report.scenario.id}\`)`,
    `- **Deterministic Seed**: \`${report.seed}\``,
    `- **Simulation Window**: \`0s .. ${report.scenario.durationSeconds}s\` (\`dt = 1s\`)`,
    `- **Counterfactual Branch Point**: ${
      report.branchTrajectory
        ? `\`t = ${report.branchTrajectory.branchedFromTime}s\` (${report.branchTrajectory.interventions
            .map((i) => i.label)
            .join(", ")})`
        : "None (Baseline Only)"
    }`,
    ``,
    `> **Epistemic Notice**: This report is generated by AFTERMATH's deterministic discrete-time state-space simulation model. All trajectories and deltas represent modeled mathematical behavior under explicit queueing and contention equations, **not** validated empirical predictions of live production infrastructure.`,
    ``,
    `## 1. Root-Cause Hypothesis & Causal Chain`,
    `**Primary Mechanism**: ${report.rootCauseHypothesis.headline}`,
    ``,
    ...report.rootCauseHypothesis.causalChain.map((step, i) => `${i + 1}. ${step}`),
    ``,
    `### Governing Mathematical Evidence`,
    ...report.rootCauseHypothesis.mathematicalEvidence.map((ev) => `- ${ev}`),
    ``,
    `## 2. Recovery Outcome`,
    `**Status**: \`${report.recoveryOutcome.status}\` — **${report.recoveryOutcome.headline}**`,
    ``,
    `${report.recoveryOutcome.explanation}`,
    ``,
    `## 3. Baseline vs. Counterfactual Evidence Table`,
    `| Metric | Baseline Trajectory | Counterfactual Branch | Delta | Causal Interpretation |`,
    `| :--- | :--- | :--- | :--- | :--- |`,
    ...report.keyEvidence.map(
      (row) =>
        `| **${row.metric}** | ${row.baselinePeak} | ${row.counterfactualPeak} | \`${row.delta}\` | ${row.interpretation} |`
    ),
    ``,
    `## 4. Counterfactual Intervention Matrix`,
    `| Intervention | Classification | Availability Delta | Peak Latency Delta | Causal Mechanism |`,
    `| :--- | :--- | :--- | :--- | :--- |`,
    ...report.interventionEvaluations.map(
      (ev) =>
        `| **${ev.name}** | \`${ev.expectedOutcome.toUpperCase()}\` | \`${
          ev.simulatedDeltaSummary
            ? `${ev.simulatedDeltaSummary.availabilityDeltaPct >= 0 ? "+" : ""}${ev.simulatedDeltaSummary.availabilityDeltaPct}%`
            : "N/A"
        }\` | \`${
          ev.simulatedDeltaSummary
            ? `${ev.simulatedDeltaSummary.peakLatencyDeltaMs} ms`
            : "N/A"
        }\` | ${ev.causalMechanism} |`
    ),
    ``,
    `## 5. Model Assumptions & Limitations`,
    `### Explicit Assumptions`,
    ...report.modelAssumptions.map((a) => `- ${a}`),
    ``,
    `### Explicit Limitations`,
    ...report.modelLimitations.map((l) => `- ${l}`),
    ``,
  ];

  return lines.join("\n");
}
