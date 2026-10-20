import {
  ArchitectureNodeHealth,
  InterventionAction,
  InterventionType,
  ScenarioDefinition,
  ScenarioId,
  SimulationEvent,
  SimulationSnapshot,
  SimulationTrajectory,
  SystemHealthStatus,
  SystemState,
  TrajectoryMetricsSummary,
} from "./types";
import { INTERVENTION_CATALOG, SCENARIOS } from "./scenarios";
import { clamp, nextBoundedNoise, roundTo } from "./prng";

export const MAX_QUEUE_DEPTH = 2500;
export const MAX_LATENCY_MS = 10000;
export const MIN_LATENCY_MS = 12;

/**
 * Deep-clones a SystemState object to guarantee immutability across snapshots and branches.
 */
export function cloneState(state: SystemState): SystemState {
  return {
    ...state,
    nodeHealth: { ...state.nodeHealth },
  };
}

/**
 * Deep-clones a SimulationSnapshot.
 */
export function cloneSnapshot(snapshot: SimulationSnapshot): SimulationSnapshot {
  return {
    time: snapshot.time,
    state: cloneState(snapshot.state),
    eventsAtStep: snapshot.eventsAtStep.map((e) => ({ ...e })),
    activeInterventions: snapshot.activeInterventions.map((i) => ({ ...i })),
  };
}

/**
 * Computes component-level health and overall system status from explicit state metrics.
 */
export function evaluateHealthStatus(
  state: Omit<SystemState, "status" | "nodeHealth">,
  previousErrorRate = 0
): { status: SystemHealthStatus; nodeHealth: ArchitectureNodeHealth } {
  const edge: ArchitectureNodeHealth["edge"] =
    state.requestRate > 1200 ? "degraded" : "healthy";

  const gateway: ArchitectureNodeHealth["gateway"] =
    state.trafficThrottleRatio < 0.99
      ? "degraded"
      : state.errorRate > 0.25
        ? "critical"
        : state.errorRate > 0.06
          ? "degraded"
          : "healthy";

  const service: ArchitectureNodeHealth["service"] =
    state.queueDepth > 600 || state.errorRate > 0.25 || state.healthyReplicaCount < 4
      ? "critical"
      : state.queueDepth > 150 ||
          state.errorRate > 0.05 ||
          state.replicaWarmupRemaining > 0
        ? "degraded"
        : "healthy";

  const dependency: ArchitectureNodeHealth["dependency"] =
    state.dependencyLatencyMs > 500
      ? state.circuitBreakerOpen
        ? "degraded"
        : "critical"
      : state.dependencyLatencyMs > 120
        ? "degraded"
        : "healthy";

  const connRatio = state.activeConnections / Math.max(1, state.connectionPoolLimit);
  const database: ArchitectureNodeHealth["database"] =
    state.databaseSaturation > 0.8 || connRatio > 0.92
      ? "critical"
      : state.databaseSaturation > 0.5 || connRatio > 0.75
        ? "degraded"
        : "healthy";

  let status: SystemHealthStatus = "NOMINAL";
  if (
    state.errorRate >= 0.18 ||
    state.latencyEstimate >= 1200 ||
    state.databaseSaturation >= 0.85 ||
    state.queueDepth >= 700
  ) {
    status = "INCIDENT";
  } else if (
    state.errorRate >= 0.045 ||
    state.latencyEstimate >= 220 ||
    state.databaseSaturation >= 0.55 ||
    state.queueDepth >= 120 ||
    state.trafficThrottleRatio < 0.99 ||
    state.circuitBreakerOpen
  ) {
    status = previousErrorRate > 0.18 && state.errorRate < previousErrorRate
      ? "RECOVERING"
      : "DEGRADED";
  } else if (previousErrorRate > 0.08) {
    status = "RECOVERING";
  }

  return {
    status,
    nodeHealth: { edge, gateway, service, dependency, database },
  };
}

/**
 * Creates the initial t = 0 snapshot for a given scenario and seed.
 */
export function createInitialSnapshot(
  scenarioId: ScenarioId,
  seed?: number
): SimulationSnapshot {
  const scenario: ScenarioDefinition = SCENARIOS[scenarioId];
  const effectiveSeed = seed ?? scenario.defaultSeed;
  const baseState = {
    ...scenario.initialState,
    prngState: effectiveSeed | 0,
  };
  const { status, nodeHealth } = evaluateHealthStatus(baseState, 0);

  const initialState: SystemState = {
    ...baseState,
    status,
    nodeHealth,
  };

  return {
    time: 0,
    state: initialState,
    eventsAtStep: [
      {
        id: `evt-${scenarioId}-0-init`,
        time: 0,
        severity: "info",
        component: "service",
        title: "Simulation Initialized",
        detail: `Baseline steady state established (seed=${effectiveSeed}, version=${initialState.deploymentVersion}, replicas=${initialState.healthyReplicaCount}).`,
      },
    ],
    activeInterventions: [],
  };
}

/**
 * Applies an operator intervention immediately to the mutable state transition copy
 * and returns a structured SimulationEvent describing the causal modification.
 */
export function applyInterventionToState(
  state: SystemState,
  intervention: InterventionAction,
  scenarioId: ScenarioId
): { updatedState: SystemState; event: SimulationEvent } {
  const next = cloneState(state);
  const scenario = SCENARIOS[scenarioId];

  switch (intervention.type) {
    case "ROLLBACK_DEPLOYMENT": {
      const wasCanary = next.deploymentVersion.includes("canary");
      next.deploymentVersion = wasCanary
        ? "v2.4.0-rollback"
        : "v2.4.0-restarted";
      next.queriesPerRequest = scenario.initialState.queriesPerRequest;
      return {
        updatedState: next,
        event: {
          id: `evt-int-${intervention.id}`,
          time: next.simulatedTime,
          severity: "intervention",
          component: "operator",
          title: `Intervention: ${INTERVENTION_CATALOG.ROLLBACK_DEPLOYMENT.label}`,
          detail: wasCanary
            ? "Reverted v2.5.0-canary-n+1 to v2.4.0-rollback. Query fanout restored from 6.8 to 1.2 queries/req; draining leaked DB connections."
            : "Triggered rolling restart of v2.4.0-stable pods. Note: No faulty release was active; rolling restart temporarily reduces available replica capacity.",
          equationRef: "q_req(t) <- 1.2, dC_leaked/dt < 0",
        },
      };
    }

    case "ADD_REPLICAS": {
      const delta = clamp(intervention.parameterValue ?? 6, 1, 12);
      const prevTarget = next.targetReplicaCount;
      next.targetReplicaCount = clamp(prevTarget + delta, 1, 18);
      next.replicaWarmupRemaining = 3;
      return {
        updatedState: next,
        event: {
          id: `evt-int-${intervention.id}`,
          time: next.simulatedTime,
          severity: "intervention",
          component: "operator",
          title: `Intervention: Provision +${delta} Service Replicas`,
          detail: `Target replica count increased from ${prevTarget} to ${next.targetReplicaCount}. Container readiness warmup takes 3s before new capacity serves traffic.`,
          equationRef: "R_target <- R_target + delta, t_warmup = 3s",
        },
      };
    }

    case "THROTTLE_TRAFFIC": {
      const ratio = clamp(intervention.parameterValue ?? 0.6, 0.2, 1.0);
      next.trafficThrottleRatio = ratio;
      const shedPct = Math.round((1 - ratio) * 100);
      return {
        updatedState: next,
        event: {
          id: `evt-int-${intervention.id}`,
          time: next.simulatedTime,
          severity: "intervention",
          component: "gateway",
          title: `Intervention: Gateway Traffic Throttle (${Math.round(ratio * 100)}% Admitted)`,
          detail: `API Gateway rate limiter active: admitting ${Math.round(ratio * 100)}% of ingress and shedding ${shedPct}% via fast HTTP 429 responses to relieve downstream queues.`,
          equationRef: "lambda_admitted(t) = alpha_throttle * lambda_in(t)",
        },
      };
    }

    case "ADJUST_CONNECTION_POOL": {
      const deltaPool = clamp(intervention.parameterValue ?? 80, -60, 180);
      const prevLimit = next.connectionPoolLimit;
      next.connectionPoolLimit = clamp(prevLimit + deltaPool, 40, 320);
      return {
        updatedState: next,
        event: {
          id: `evt-int-${intervention.id}`,
          time: next.simulatedTime,
          severity: "intervention",
          component: "database",
          title: `Intervention: Adjust DB Connection Pool (${prevLimit} -> ${next.connectionPoolLimit})`,
          detail: `Database max connection pool updated to ${next.connectionPoolLimit}. Warning: higher concurrency under N+1 query load or slow dependencies can amplify DB lock contention.`,
          equationRef: "C_max <- clamp(C_max + delta, 40, 320)",
        },
      };
    }

    case "ENABLE_CIRCUIT_BREAKER": {
      next.circuitBreakerEnabled = true;
      if (next.dependencyLatencyMs > 350) {
        next.circuitBreakerOpen = true;
      }
      return {
        updatedState: next,
        event: {
          id: `evt-int-${intervention.id}`,
          time: next.simulatedTime,
          severity: "intervention",
          component: "dependency",
          title: `Intervention: ${INTERVENTION_CATALOG.ENABLE_CIRCUIT_BREAKER.label}`,
          detail:
            next.dependencyLatencyMs > 350
              ? `Circuit breaker armed and immediately TRIPPED OPEN (dependency latency ${Math.round(next.dependencyLatencyMs)}ms > 350ms threshold). Routing to 14ms local fallback.`
              : "Circuit breaker armed with 350ms latency trip threshold. Currently closed because downstream dependency latency is nominal.",
          equationRef: "T_dep_eff = 14ms if (CB_enabled && T_dep > 350ms)",
        },
      };
    }

    case "RESTORE_BASELINE": {
      next.trafficThrottleRatio = 1.0;
      next.connectionPoolLimit = scenario.initialState.connectionPoolLimit;
      next.circuitBreakerEnabled = false;
      next.circuitBreakerOpen = false;
      return {
        updatedState: next,
        event: {
          id: `evt-int-${intervention.id}`,
          time: next.simulatedTime,
          severity: "intervention",
          component: "operator",
          title: "Intervention: Restore Baseline Configuration",
          detail: `Cleared gateway throttling (100% admitted), disarmed circuit breaker, and reset DB pool limit to ${next.connectionPoolLimit}.`,
          equationRef: "alpha_throttle <- 1.0, C_max <- C_max_0",
        },
      };
    }
  }
}

/**
 * Advances the deterministic discrete-time simulation by 1 second (t -> t + 1).
 * Pure function of the current snapshot, scenarioId, and any interventions scheduled at t + 1.
 */
export function stepSimulation(
  currentSnapshot: SimulationSnapshot,
  scenarioId: ScenarioId,
  scheduledInterventionsAtNextTime: InterventionAction[] = []
): SimulationSnapshot {
  const scenario = SCENARIOS[scenarioId];
  const prev = currentSnapshot.state;
  const nextTime = prev.simulatedTime + 1;

  let working = cloneState(prev);
  working.simulatedTime = nextTime;

  const events: SimulationEvent[] = [];
  const activeInterventions = [
    ...currentSnapshot.activeInterventions.map((i) => ({ ...i })),
  ];

  // 1. Deterministic PRNG step for small bounded telemetry noise
  const noise1 = nextBoundedNoise(working.prngState, 12);
  const noise2 = nextBoundedNoise(noise1.nextState, 0.015);
  working.prngState = noise2.nextState;

  // 2. Apply scenario-specific environmental forcing & incident triggers
  if (scenarioId === "checkout-db-exhaustion") {
    working.requestRate = roundTo(clamp(520 + noise1.delta, 480, 560), 1);

    // Trigger canary deployment at t = 8s unless already rolled back
    if (
      nextTime === scenario.incidentTriggerTime &&
      working.deploymentVersion === "v2.4.0-stable"
    ) {
      working.deploymentVersion = "v2.5.0-canary-n+1";
      working.queriesPerRequest = 6.8;
      events.push({
        id: `evt-${scenarioId}-${nextTime}-canary`,
        time: nextTime,
        severity: "critical",
        component: "service",
        title: "Canary Deployment v2.5.0-canary-n+1 Rolled Out",
        detail:
          "Checkout Service updated to v2.5.0-canary-n+1. ORM eager-loading regression increased DB queries/request from 1.2 to 6.8 and introduced connection handle leaks under lock contention.",
        equationRef: "q_req(8) = 6.8, dC_leaked/dt > 0",
      });
    }
  } else if (scenarioId === "traffic-spike-replicas") {
    if (nextTime < scenario.incidentTriggerTime) {
      working.requestRate = roundTo(clamp(440 + noise1.delta, 400, 480), 1);
    } else if (nextTime === scenario.incidentTriggerTime) {
      working.requestRate = roundTo(1480 + noise1.delta, 1);
      events.push({
        id: `evt-${scenarioId}-${nextTime}-surge`,
        time: nextTime,
        severity: "critical",
        component: "edge",
        title: "Flash-Sale Traffic Surge (+245% Ingress)",
        detail: `Incoming request rate spiked from ${Math.round(prev.requestRate)} req/s to ${Math.round(working.requestRate)} req/s against ${working.healthyReplicaCount} active replicas (${Math.round(working.serviceCapacity)} req/s capacity).`,
        equationRef: "lambda_in(t) = 1520 req/s > mu(t) = 600 req/s",
      });
    } else if (nextTime <= 52) {
      const wave = Math.sin((nextTime - 6) * 0.25) * 35;
      working.requestRate = roundTo(clamp(1520 + wave + noise1.delta, 1440, 1590), 1);
    } else {
      working.requestRate = roundTo(clamp(680 + noise1.delta, 620, 740), 1);
    }
  } else if (scenarioId === "dependency-timeout-cascade") {
    working.requestRate = roundTo(clamp(490 + noise1.delta, 460, 525), 1);
    if (nextTime < scenario.incidentTriggerTime) {
      working.dependencyLatencyMs = roundTo(clamp(20 + noise2.delta * 100, 16, 25), 1);
    } else if (nextTime === scenario.incidentTriggerTime) {
      working.dependencyLatencyMs = 2400;
      events.push({
        id: `evt-${scenarioId}-${nextTime}-dep-stall`,
        time: nextTime,
        severity: "critical",
        component: "dependency",
        title: "Upstream Fraud Scoring API Latency Spike (20ms -> 2,400ms)",
        detail:
          "Synchronous third-party Fraud API degraded to 2,400ms response time. Checkout workers block on HTTP responses while holding database connections.",
        equationRef: "T_dep(7) = 2400ms => mu_eff collapses via Little's Law",
      });
    } else if (nextTime <= 55) {
      working.dependencyLatencyMs = roundTo(
        clamp(2400 + noise1.delta * 8, 2280, 2520),
        1
      );
    } else {
      working.dependencyLatencyMs = 45;
    }
  }

  // 3. Apply any operator interventions scheduled at this exact tick
  let unnecessaryRestartPenalty = 0;
  for (const intervention of scheduledInterventionsAtNextTime) {
    if (
      intervention.type === "ROLLBACK_DEPLOYMENT" &&
      !working.deploymentVersion.includes("canary")
    ) {
      unnecessaryRestartPenalty = 0.28; // Rolling restart of healthy pods loses 28% capacity briefly
    }
    const applied = applyInterventionToState(working, intervention, scenarioId);
    working = applied.updatedState;
    events.push(applied.event);
    activeInterventions.push(intervention);
  }

  // 4. Replica warmup and health-check dynamics
  if (working.replicaWarmupRemaining > 0) {
    working.replicaWarmupRemaining -= 1;
    if (working.replicaWarmupRemaining === 0) {
      const prevHealthy = working.healthyReplicaCount;
      working.healthyReplicaCount = working.targetReplicaCount;
      events.push({
        id: `evt-${scenarioId}-${nextTime}-replicas-ready`,
        time: nextTime,
        severity: "recovery",
        component: "service",
        title: `New Replicas Healthy (${prevHealthy} -> ${working.healthyReplicaCount} Active)`,
        detail: `Provisioned replicas passed readiness probes. Active replica pool expanded to ${working.healthyReplicaCount}.`,
        equationRef: "R_healthy(t) <- R_target",
      });
    }
  } else if (working.targetReplicaCount < working.healthyReplicaCount) {
    working.healthyReplicaCount = working.targetReplicaCount;
  }

  // Replica crash under extreme unmitigated CPU/queue overload in traffic spike scenario
  if (
    scenarioId === "traffic-spike-replicas" &&
    prev.queueDepth > 1350 &&
    working.healthyReplicaCount === 4 &&
    working.targetReplicaCount <= 4 &&
    working.trafficThrottleRatio > 0.85
  ) {
    working.healthyReplicaCount = 3;
    events.push({
      id: `evt-${scenarioId}-${nextTime}-replica-flap`,
      time: nextTime,
      severity: "critical",
      component: "service",
      title: "Replica Health-Check Failure (4 -> 3 Healthy Replicas)",
      detail:
        "Extreme queue backlog (>1,350 requests) caused thread starvation and liveness probe timeout on 1 replica, reducing active capacity by 25%.",
      equationRef: "R_healthy <- R_healthy - 1 under severe queue thrashing",
    });
  }

  // 5. Circuit breaker state machine
  if (working.circuitBreakerEnabled) {
    const shouldOpen = working.dependencyLatencyMs > 350;
    if (shouldOpen && !working.circuitBreakerOpen) {
      working.circuitBreakerOpen = true;
      events.push({
        id: `evt-${scenarioId}-${nextTime}-cb-open`,
        time: nextTime,
        severity: "recovery",
        component: "dependency",
        title: "Circuit Breaker Tripped OPEN — Fast Fallback Active",
        detail:
          "Downstream dependency calls short-circuited to 14ms local risk-heuristic fallback, releasing blocked worker threads.",
      });
    } else if (!shouldOpen && working.circuitBreakerOpen) {
      working.circuitBreakerOpen = false;
    }
  } else {
    working.circuitBreakerOpen = false;
  }

  // 6. Ingress admission after gateway throttling
  const admittedRequestRate = working.requestRate * working.trafficThrottleRatio;
  const throttledRejectRate = working.requestRate - admittedRequestRate;

  // 7. Database connection leak & query load dynamics
  const isCanaryBugActive = working.deploymentVersion === "v2.5.0-canary-n+1";
  if (isCanaryBugActive) {
    const leakRate = prev.databaseSaturation > 0.4 ? 5.2 : 2.6;
    working.leakedConnections = clamp(
      prev.leakedConnections + leakRate,
      0,
      working.connectionPoolLimit * 0.82
    );
  } else {
    // Leaked connections drain once canary is rolled back
    working.leakedConnections = clamp(
      prev.leakedConnections * 0.52 - 6,
      0,
      working.connectionPoolLimit
    );
  }

  // Effective dependency latency experienced by workers
  const effectiveDepLatencyMs = working.circuitBreakerOpen
    ? 14
    : working.dependencyLatencyMs;

  // 8. Database saturation & active connections calculation
  // Base DB query service time increases nonlinearly with total concurrent query volume
  const rawQueryRate = admittedRequestRate * working.queriesPerRequest;
  const dbNominalQueryCapacity = 980; // queries/sec hardware ceiling
  const queryLoadRatio = rawQueryRate / dbNominalQueryCapacity;

  // Expanding the connection pool when N+1 queries are active amplifies lock contention!
  const poolAmplificationFactor =
    isCanaryBugActive && working.connectionPoolLimit > 120
      ? 1 + ((working.connectionPoolLimit - 120) / 120) * 0.55
      : 1.0;

  //Replica amplification on DB contention if canary bug is active
  const replicaDbContentionFactor =
    isCanaryBugActive && working.healthyReplicaCount > 6
      ? 1 + (working.healthyReplicaCount - 6) * 0.12
      : 1.0;

  const dbDependencyHoldFactor =
    effectiveDepLatencyMs > 200 ? 0.38 : 0.0;

  const targetDbSaturation = clamp(
    queryLoadRatio * 0.62 * poolAmplificationFactor * replicaDbContentionFactor +
      (working.leakedConnections / Math.max(1, working.connectionPoolLimit)) * 0.48 +
      dbDependencyHoldFactor +
      noise2.delta,
    0.05,
    1.0
  );

  working.databaseSaturation = roundTo(
    clamp(prev.databaseSaturation * 0.35 + targetDbSaturation * 0.65, 0.05, 1.0),
    3
  );

  // Per-query DB execution time (ms) rises steeply as databaseSaturation -> 1.0
  const dbQueryTimeMs =
    6 +
    14 * Math.pow(working.databaseSaturation, 1.5) +
    160 * Math.pow(working.databaseSaturation, 4.2);

  // Total DB time per request
  const dbTimePerRequestMs = working.queriesPerRequest * dbQueryTimeMs;

  // Little's Law for active DB connections: C = C_leaked + lambda_eff * W_hold
  // Notice that when workers call the dependency synchronously inside a transaction,
  // connections stay checked out during the dependency call too!
  const connectionHoldTimeSeconds =
    (dbTimePerRequestMs + effectiveDepLatencyMs * 0.85) / 1000;

  const demandedConnections =
    working.leakedConnections + admittedRequestRate * connectionHoldTimeSeconds;

  working.activeConnections = Math.round(
    clamp(demandedConnections, 1, working.connectionPoolLimit)
  );

  const connectionPoolExhaustionRatio = clamp(
    working.activeConnections / Math.max(1, working.connectionPoolLimit),
    0,
    1
  );

  //Emit event when connection pool hits >= 95% saturation for the first time
  if (
    connectionPoolExhaustionRatio >= 0.95 &&
    prev.activeConnections / Math.max(1, prev.connectionPoolLimit) < 0.95
  ) {
    events.push({
      id: `evt-${scenarioId}-${nextTime}-pool-exhausted`,
      time: nextTime,
      severity: "critical",
      component: "database",
      title: `Database Connection Pool Exhausted (${working.activeConnections}/${working.connectionPoolLimit})`,
      detail: `Active connections reached ${working.activeConnections}/${working.connectionPoolLimit}. Incoming requests must wait for connection acquisition or fail with pool timeout.`,
      equationRef: "C_active(t) == C_max => pool acquisition blocking",
    });
  }

  // 9. Effective Service Capacity (mu_eff)
  // Nominal per-replica throughput is 150 req/s when request hold time is ~25ms.
  // When DB time or Dependency time inflates, or connection pool is exhausted, service capacity drops.
  const baseComputeMs = 10;
  const totalRequestServiceTimeMs =
    baseComputeMs + dbTimePerRequestMs + effectiveDepLatencyMs;

  // Thread concurrency per replica = 4.5 slots -> at 30ms service time, 1 replica does 150 req/s
  const perReplicaCapacityFromLatency = clamp(
    (4.5 * 1000) / Math.max(25, totalRequestServiceTimeMs),
    14,
    155
  );

  // Connection pool bottleneck caps total throughput if DB connections are maxed out
  const availableWorkingConnections = Math.max(
    4,
    working.connectionPoolLimit - working.leakedConnections * 0.85
  );
  const poolCappedCapacity =
    availableWorkingConnections / Math.max(0.012, connectionHoldTimeSeconds);

  // Queue thrashing penalty when queueDepth is huge
  const queueThrashingPenalty =
    prev.queueDepth > 800
      ? clamp(1 - ((prev.queueDepth - 800) / MAX_QUEUE_DEPTH) * 0.24, 0.72, 1.0)
      : 1.0;

  // Rolling restart penalty if rollback was triggered unnecessarily
  const restartFactor =
    working.deploymentVersion === "v2.4.0-restarted" &&
    nextTime - (activeInterventions.at(-1)?.appliedAtTime ?? -10) <= 3
      ? 1 - unnecessaryRestartPenalty
      : 1.0;

  const rawReplicaCapacity =
    working.healthyReplicaCount *
    perReplicaCapacityFromLatency *
    queueThrashingPenalty *
    restartFactor;

  working.serviceCapacity = roundTo(
    clamp(Math.min(rawReplicaCapacity, poolCappedCapacity), 25, 3500),
    1
  );

  // 10. Queue Depth evolution: Q(t+1) = clamp(Q(t) + lambda_admitted - mu_eff, 0, Q_max)
  // When capacity exceeds demand, queue drains faster as workers clear backlog
  const netFlow = admittedRequestRate - working.serviceCapacity;
  const drainBoost = netFlow < 0 ? netFlow * 1.35 : netFlow;
  working.queueDepth = Math.round(
    clamp(prev.queueDepth + drainBoost, 0, MAX_QUEUE_DEPTH)
  );

  // 11. Latency Estimate (p95 ms)
  // Includes base compute + DB time + effective dependency time + queueing delay (Q / mu_eff) + pool wait
  const queueingDelayMs =
    (working.queueDepth / Math.max(40, working.serviceCapacity)) * 1000;
  const poolWaitPenaltyMs =
    connectionPoolExhaustionRatio > 0.88
      ? Math.pow((connectionPoolExhaustionRatio - 0.88) / 0.12, 2) * 1850
      : 0;

  const targetLatencyMs =
    baseComputeMs +
    dbTimePerRequestMs +
    effectiveDepLatencyMs +
    queueingDelayMs +
    poolWaitPenaltyMs;

  working.latencyEstimate = Math.round(
    clamp(
      prev.latencyEstimate * 0.25 + targetLatencyMs * 0.75,
      MIN_LATENCY_MS,
      MAX_LATENCY_MS
    )
  );

  // 12. Error Rate in [0, 1]
  // Composed of:
  // (a) Gateway throttle rejections (HTTP 429)
  // (b) Overload / Queue overflow / Timeout drops when demand > capacity or latency > SLA timeout
  // (c) Connection pool exhaustion errors
  // (d) Circuit breaker conservative fallback rejection (~3.5% when open)
  const throttleErrorFraction =
    throttledRejectRate / Math.max(1, working.requestRate);

  const overloadShortfall = Math.max(0, admittedRequestRate - working.serviceCapacity);
  const overloadErrorFraction =
    (overloadShortfall / Math.max(1, working.requestRate)) *
    (working.queueDepth > 350 ? 0.92 : 0.45);

  const queueTimeoutFraction =
    working.queueDepth > 500
      ? clamp(((working.queueDepth - 500) / MAX_QUEUE_DEPTH) * 0.48, 0, 0.48)
      : 0;

  const poolTimeoutFraction =
    connectionPoolExhaustionRatio > 0.92
      ? clamp((connectionPoolExhaustionRatio - 0.92) * 4.2, 0, 0.42)
      : 0;

  const circuitBreakerFallbackFraction = working.circuitBreakerOpen ? 0.035 : 0;

  const baselineNoiseError = 0.001 + Math.max(0, noise2.delta * 0.1);

  const combinedAdmittedFailureProbability = clamp(
    overloadErrorFraction +
      queueTimeoutFraction +
      poolTimeoutFraction +
      circuitBreakerFallbackFraction +
      baselineNoiseError,
    0.001,
    0.98
  );

  const totalErrorRate =
    throttleErrorFraction +
    (1 - throttleErrorFraction) * combinedAdmittedFailureProbability;

  working.errorRate = roundTo(clamp(totalErrorRate, 0.001, 0.98), 4);

  // 13. Evaluate overall status and component node health
  const { status, nodeHealth } = evaluateHealthStatus(working, prev.errorRate);
  working.status = status;
  working.nodeHealth = nodeHealth;

  // Emit recovery event when transitioning out of INCIDENT into RECOVERING/NOMINAL
  if (
    prev.status === "INCIDENT" &&
    (working.status === "RECOVERING" || working.status === "NOMINAL")
  ) {
    events.push({
      id: `evt-${scenarioId}-${nextTime}-recovering`,
      time: nextTime,
      severity: "recovery",
      component: "service",
      title: "System Entering Recovery Trajectory",
      detail: `Error rate dropped to ${(working.errorRate * 100).toFixed(1)}%, p95 latency at ${working.latencyEstimate}ms, queue depth at ${working.queueDepth}.`,
    });
  }

  return {
    time: nextTime,
    state: working,
    eventsAtStep: events,
    activeInterventions,
  };
}

/**
 * Computes aggregate summary statistics for a completed or partial trajectory.
 */
export function summarizeTrajectory(
  snapshots: SimulationSnapshot[],
  incidentTriggerTime: number
): TrajectoryMetricsSummary {
  let peakLatencyMs = 0;
  let peakErrorRate = 0;
  let peakQueueDepth = 0;
  let peakDbSaturation = 0;
  let minHealthyReplicas = Infinity;
  let totalFailedRequests = 0;
  let totalServedRequests = 0;
  let timeInIncidentSeconds = 0;
  let hadIncident = false;
  let lastIncidentTime = -1;

  for (const snap of snapshots) {
    const s = snap.state;
    if (s.latencyEstimate > peakLatencyMs) peakLatencyMs = s.latencyEstimate;
    if (s.errorRate > peakErrorRate) peakErrorRate = s.errorRate;
    if (s.queueDepth > peakQueueDepth) peakQueueDepth = s.queueDepth;
    if (s.databaseSaturation > peakDbSaturation) {
      peakDbSaturation = s.databaseSaturation;
    }
    if (s.healthyReplicaCount < minHealthyReplicas) {
      minHealthyReplicas = s.healthyReplicaCount;
    }

    const failed = s.requestRate * s.errorRate;
    const served = s.requestRate * (1 - s.errorRate);
    totalFailedRequests += failed;
    totalServedRequests += served;

    const isUnhealthy =
      s.errorRate >= 0.1 || s.latencyEstimate >= 500 || s.queueDepth >= 300;
    if (snap.time >= incidentTriggerTime && isUnhealthy) {
      hadIncident = true;
      timeInIncidentSeconds += 1;
      lastIncidentTime = snap.time;
    }
  }

  const finalState = snapshots[snapshots.length - 1].state;
  const recoveredByEnd =
    finalState.errorRate < 0.08 &&
    finalState.latencyEstimate < 250 &&
    finalState.queueDepth < 100;

  let recoveryTimeSeconds: number | null = null;
  if (hadIncident && recoveredByEnd && lastIncidentTime >= incidentTriggerTime) {
    recoveryTimeSeconds = lastIncidentTime - incidentTriggerTime + 1;
  } else if (!hadIncident && recoveredByEnd) {
    recoveryTimeSeconds = 0;
  }

  const totalRequests = totalFailedRequests + totalServedRequests;
  const availabilityPct =
    totalRequests > 0
      ? roundTo((totalServedRequests / totalRequests) * 100, 2)
      : 100;

  return {
    peakLatencyMs: Math.round(peakLatencyMs),
    peakErrorRate: roundTo(peakErrorRate, 4),
    peakQueueDepth: Math.round(peakQueueDepth),
    peakDbSaturation: roundTo(peakDbSaturation, 3),
    minHealthyReplicas: Number.isFinite(minHealthyReplicas) ? minHealthyReplicas : 1,
    totalFailedRequests: Math.round(totalFailedRequests),
    totalServedRequests: Math.round(totalServedRequests),
    availabilityPct,
    timeInIncidentSeconds,
    recoveryTimeSeconds,
    recoveredByEnd,
    finalState: cloneState(finalState),
  };
}

/**
 * Runs a full deterministic trajectory from t = 0 (or from an existing snapshot prefix for branching)
 * up to durationSeconds.
 */
export function runTrajectory(params: {
  id: string;
  label: string;
  scenarioId: ScenarioId;
  seed?: number;
  durationSeconds?: number;
  interventions?: InterventionAction[];
  prefixSnapshots?: SimulationSnapshot[];
  branchedFromTime?: number | null;
}): SimulationTrajectory {
  const scenario = SCENARIOS[params.scenarioId];
  const seed = params.seed ?? scenario.defaultSeed;
  const duration = params.durationSeconds ?? scenario.durationSeconds;
  const interventions = params.interventions ?? [];

  const snapshots: SimulationSnapshot[] =
    params.prefixSnapshots && params.prefixSnapshots.length > 0
      ? params.prefixSnapshots.map(cloneSnapshot)
      : [createInitialSnapshot(params.scenarioId, seed)];

  // If interventions are scheduled at the exact branch start tick (and not yet applied in the last prefix snapshot),
  // apply them to the starting snapshot of the branch.
  const startSnap = snapshots[snapshots.length - 1];
  const startTickInterventions = interventions.filter(
    (intv) =>
      intv.appliedAtTime === startSnap.time &&
      !startSnap.activeInterventions.some((existing) => existing.id === intv.id)
  );

  if (startTickInterventions.length > 0) {
    let updatedState = cloneState(startSnap.state);
    const newEvents = [...startSnap.eventsAtStep];
    const newActive = [...startSnap.activeInterventions];
    for (const intv of startTickInterventions) {
      const res = applyInterventionToState(updatedState, intv, params.scenarioId);
      updatedState = res.updatedState;
      newEvents.push(res.event);
      newActive.push(intv);
    }
    const { status, nodeHealth } = evaluateHealthStatus(
      updatedState,
      startSnap.state.errorRate
    );
    updatedState.status = status;
    updatedState.nodeHealth = nodeHealth;
    snapshots[snapshots.length - 1] = {
      time: startSnap.time,
      state: updatedState,
      eventsAtStep: newEvents,
      activeInterventions: newActive,
    };
  }

  while (snapshots[snapshots.length - 1].time < duration) {
    const current = snapshots[snapshots.length - 1];
    const nextTick = current.time + 1;
    const scheduledForNext = interventions.filter(
      (i) => i.appliedAtTime === nextTick
    );
    const nextSnap = stepSimulation(current, params.scenarioId, scheduledForNext);
    snapshots.push(nextSnap);
  }

  const allEvents = snapshots.flatMap((s) => s.eventsAtStep);
  const allInterventions =
    snapshots[snapshots.length - 1].activeInterventions.map((i) => ({ ...i }));

  return {
    id: params.id,
    label: params.label,
    scenarioId: params.scenarioId,
    seed,
    branchedFromTime: params.branchedFromTime ?? null,
    snapshots,
    events: allEvents,
    interventions: allInterventions,
    summary: summarizeTrajectory(snapshots, scenario.incidentTriggerTime),
  };
}

/**
 * Rewinds a trajectory to a target simulated time `targetTime` and returns the truncated
 * snapshot history up to `targetTime` (inclusive), restoring the exact SystemState at `targetTime`.
 */
export function rewindSnapshotsToTime(
  snapshots: SimulationSnapshot[],
  targetTime: number
): SimulationSnapshot[] {
  const clampedTime = clamp(
    Math.round(targetTime),
    0,
    snapshots[snapshots.length - 1]?.time ?? 0
  );
  const sliced = snapshots
    .filter((snap) => snap.time <= clampedTime)
    .map(cloneSnapshot);
  return sliced.length > 0 ? sliced : [cloneSnapshot(snapshots[0])];
}

/**
 * Creates a counterfactual branched trajectory from `sourceTrajectory` at `branchTime`
 * by rewinding to `branchTime`, applying `newInterventions`, and simulating forward to the end.
 */
export function createCounterfactualBranch(params: {
  sourceTrajectory: SimulationTrajectory;
  branchTime: number;
  newInterventions: InterventionAction[];
  branchLabel?: string;
}): SimulationTrajectory {
  const prefix = rewindSnapshotsToTime(
    params.sourceTrajectory.snapshots,
    params.branchTime
  );
  const preservedInterventions = prefix[prefix.length - 1].activeInterventions;
  const combinedInterventions = [
    ...preservedInterventions,
    ...params.newInterventions,
  ];

  return runTrajectory({
    id: `branch-${params.sourceTrajectory.scenarioId}-${params.branchTime}-${params.newInterventions.map((i) => i.type).join("-")}`,
    label:
      params.branchLabel ??
      `Counterfactual Branch @ t=${params.branchTime}s (${params.newInterventions
        .map((i) => INTERVENTION_CATALOG[i.type].shortLabel)
        .join(" + ")})`,
    scenarioId: params.sourceTrajectory.scenarioId,
    seed: params.sourceTrajectory.seed,
    durationSeconds:
      params.sourceTrajectory.snapshots[
        params.sourceTrajectory.snapshots.length - 1
      ].time,
    interventions: combinedInterventions,
    prefixSnapshots: prefix,
    branchedFromTime: params.branchTime,
  });
}
