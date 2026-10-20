import { ScenarioDefinition, ScenarioId, InterventionType } from "./types";

export const SCENARIOS: Record<ScenarioId, ScenarioDefinition> = {
  "checkout-db-exhaustion": {
    id: "checkout-db-exhaustion",
    title: "Checkout Deployment Triggers Database Connection Exhaustion",
    shortTitle: "DB Connection Exhaustion",
    subtitle: "Canary release v2.5.0 introduces an N+1 ORM query regression and unclosed transaction leak under lock contention.",
    category: "Release Regression · Connection Pool Dynamics",
    defaultSeed: 104729,
    durationSeconds: 60,
    incidentTriggerTime: 8,
    summary:
      "At t = 8s, Checkout Service upgrades from v2.4.0-stable to v2.5.0-canary-n+1. Queries per request jump from 1.2 to 6.8 and unclosed cursor handles leak under lock wait. Active DB connections saturate the 120-connection pool limit, causing Little's Law queue accumulation and cascading 503/504 checkout failures.",
    initialState: {
      simulatedTime: 0,
      requestRate: 520,
      serviceCapacity: 840,
      activeConnections: 32,
      connectionPoolLimit: 120,
      queueDepth: 0,
      errorRate: 0.002,
      latencyEstimate: 28,
      healthyReplicaCount: 6,
      databaseSaturation: 0.24,
      deploymentVersion: "v2.4.0-stable",
      targetReplicaCount: 6,
      replicaWarmupRemaining: 0,
      trafficThrottleRatio: 1.0,
      circuitBreakerEnabled: false,
      circuitBreakerOpen: false,
      dependencyLatencyMs: 18,
      leakedConnections: 0,
      queriesPerRequest: 1.2,
    },
    rootCauseGroundTruth: {
      primaryMechanism:
        "Canary release v2.5.0-canary-n+1 increases database fanout from 1.2 to 6.8 queries/request and leaks unclosed connection handles when database lock contention exceeds 45%.",
      governingEquation:
        "C_active(t+1) = C_leaked(t+1) + min(C_max, lambda_admitted(t) * q_req(t) * W_db(S_db(t)))",
      whyNaiveFixesFail:
        "Expanding the DB connection pool (e.g., 120 -> 220) or adding service replicas pushes more concurrent N+1 queries into an already lock-contended database, accelerating DB CPU/lock thrashing rather than resolving the query fanout regression.",
      recommendedIntervention: "ROLLBACK_DEPLOYMENT",
      tradeoffIntervention: "THROTTLE_TRAFFIC",
      failingIntervention: "ADJUST_CONNECTION_POOL",
    },
    assumptions: [
      "Discrete 1-second simulation steps (dt = 1s) modeling aggregate checkout request flow.",
      "Database query service time follows a non-linear M/M/c contention curve as active connections and query fanout approach hardware concurrency thresholds.",
      "Rolling back to v2.4.0-stable drains leaked connection handles over a deterministic decay window (tau = 2.5s) as worker pools recycle.",
    ],
    limitations: [
      "Models aggregate p95 latency and connection occupancy rather than individual SQL query execution plans or packet-level TCP states.",
      "Assumes homogeneous replica sizing and uniform traffic balancing across healthy instances.",
      "Counterfactual branches represent deterministic mathematical projections under this state-space model, not guaranteed production telemetry.",
    ],
  },

  "traffic-spike-replicas": {
    id: "traffic-spike-replicas",
    title: "Flash-Sale Traffic Surge Overwhelms Available Replicas",
    shortTitle: "Replica Capacity Overload",
    subtitle: "A 3.5x ingress surge exceeds replica compute capacity, triggering queue saturation and CPU context-switch thrashing.",
    category: "Capacity Planning · Autoscale Lag & Queueing",
    defaultSeed: 209715,
    durationSeconds: 60,
    incidentTriggerTime: 6,
    summary:
      "At t = 6s, a regional flash-sale campaign drives incoming traffic from 440 req/s to 1,520 req/s. Only 4 service replicas (600 req/s nominal capacity) are online. Without rapid horizontal scale-out or ingress load shedding, worker queues overflow, context-switch overhead degrades per-replica throughput, and 1 overloaded replica fails health checks.",
    initialState: {
      simulatedTime: 0,
      requestRate: 440,
      serviceCapacity: 600,
      activeConnections: 26,
      connectionPoolLimit: 180,
      queueDepth: 0,
      errorRate: 0.001,
      latencyEstimate: 24,
      healthyReplicaCount: 4,
      databaseSaturation: 0.19,
      deploymentVersion: "v2.4.0-stable",
      targetReplicaCount: 4,
      replicaWarmupRemaining: 0,
      trafficThrottleRatio: 1.0,
      circuitBreakerEnabled: false,
      circuitBreakerOpen: false,
      dependencyLatencyMs: 16,
      leakedConnections: 0,
      queriesPerRequest: 1.1,
    },
    rootCauseGroundTruth: {
      primaryMechanism:
        "Ingress arrival rate (lambda = 1,520 req/s) exceeds aggregate replica service rate (mu = 4 * 150 = 600 req/s), causing unstable queue growth dQ/dt = lambda - mu > 0 and CPU thrashing penalty above 90% utilization.",
      governingEquation:
        "Q(t+1) = clamp(Q(t) + lambda_admitted(t) - mu_eff(R_healthy(t), U_cpu(t)), 0, Q_max)",
      whyNaiveFixesFail:
        "Rolling back the deployment restarts stable v2.4.0 pods when code is not the issue, and enabling a downstream circuit breaker has no effect because external dependencies are healthy (16ms). Even adding replicas incurs a 3-second container warmup window.",
      recommendedIntervention: "ADD_REPLICAS",
      tradeoffIntervention: "THROTTLE_TRAFFIC",
      failingIntervention: "ROLLBACK_DEPLOYMENT",
    },
    assumptions: [
      "Each healthy replica provides 150 req/s nominal throughput, degrading by up to 25% under severe queue saturation due to thread contention.",
      "Newly provisioned replicas require a 3-second container initialization and readiness warmup window before serving traffic.",
      "Database tier has sufficient headroom (180 connection pool limit) for horizontal scale-out up to 12 replicas.",
    ],
    limitations: [
      "Does not model cold-cache misses on newly booted replicas or L4 load balancer connection draining jitter.",
      "Assumes container image pull is cached on worker nodes (fixed 3s readiness delay).",
      "Modeled trajectories illustrate queueing-theory tradeoffs, not empirical cloud provider SLA guarantees.",
    ],
  },

  "dependency-timeout-cascade": {
    id: "dependency-timeout-cascade",
    title: "Dependency Slowdown Causes Queue Accumulation & Cascading Timeouts",
    shortTitle: "Dependency Timeout Cascade",
    subtitle: "A synchronous third-party Fraud API degrades from 20ms to 2,400ms, pinning worker threads and starving the service tier.",
    category: "Cascading Failure · Little's Law Thread Starvation",
    defaultSeed: 314159,
    durationSeconds: 60,
    incidentTriggerTime: 7,
    summary:
      "At t = 7s, an upstream Fraud Scoring API experiences severe latency degradation (20ms -> 2,400ms). Because Checkout calls the dependency synchronously inside request workers while holding DB connections, Little's Law collapses effective throughput from 780 req/s to under 140 req/s, exhausting the connection pool and causing a total timeout cascade.",
    initialState: {
      simulatedTime: 0,
      requestRate: 490,
      serviceCapacity: 780,
      activeConnections: 30,
      connectionPoolLimit: 130,
      queueDepth: 0,
      errorRate: 0.002,
      latencyEstimate: 31,
      healthyReplicaCount: 6,
      databaseSaturation: 0.21,
      deploymentVersion: "v2.4.0-stable",
      targetReplicaCount: 6,
      replicaWarmupRemaining: 0,
      trafficThrottleRatio: 1.0,
      circuitBreakerEnabled: false,
      circuitBreakerOpen: false,
      dependencyLatencyMs: 20,
      leakedConnections: 0,
      queriesPerRequest: 1.15,
    },
    rootCauseGroundTruth: {
      primaryMechanism:
        "Synchronous blocking calls to a degraded external dependency (2,400ms) inflate per-request holding time W by 40x, collapsing worker concurrency capacity mu_eff ~ ConcurrencyLimit / W and pinning DB connections idle during HTTP waits.",
      governingEquation:
        "mu_eff(t) = R_healthy(t) * ThreadsPerReplica / (T_compute + T_db(t) + T_dep_effective(t))",
      whyNaiveFixesFail:
        "Adding replicas or raising DB connection pool limits without breaking the slow synchronous dependency call simply pins more threads and connections waiting on the 2,400ms upstream timeout.",
      recommendedIntervention: "ENABLE_CIRCUIT_BREAKER",
      tradeoffIntervention: "THROTTLE_TRAFFIC",
      failingIntervention: "ADJUST_CONNECTION_POOL",
    },
    assumptions: [
      "Workers hold a pooled database connection across the synchronous Fraud API check unless circuit-broken.",
      "When enabled, the circuit breaker trips open whenever dependency latency exceeds 350ms, routing requests to a fast local heuristic fallback (14ms) with a 3.5% conservative risk-rejection tradeoff.",
      "Upstream dependency remains degraded through the incident window until t = 54s.",
    ],
    limitations: [
      "Models a binary/hysteresis circuit breaker with deterministic local fallback rather than per-endpoint stochastic retry storms.",
      "Does not simulate multi-region failover of the third-party provider.",
      "Outputs represent deterministic model behavior for incident rehearsal and architectural reasoning.",
    ],
  },
};

export const SCENARIO_LIST: ScenarioDefinition[] = [
  SCENARIOS["checkout-db-exhaustion"],
  SCENARIOS["traffic-spike-replicas"],
  SCENARIOS["dependency-timeout-cascade"],
];

export interface InterventionCatalogItem {
  type: InterventionType;
  label: string;
  shortLabel: string;
  actionVerb: string;
  defaultParameterValue?: number;
  parameterUnit?: string;
  description: string;
  engineeringMechanism: string;
}

export const INTERVENTION_CATALOG: Record<InterventionType, InterventionCatalogItem> = {
  ROLLBACK_DEPLOYMENT: {
    type: "ROLLBACK_DEPLOYMENT",
    label: "Roll Back Deployment",
    shortLabel: "Rollback v2.4.0",
    actionVerb: "Reverting deployment to v2.4.0-stable",
    description:
      "Reverts service deployment to v2.4.0-stable, eliminating N+1 query regressions and draining leaked connection handles. Briefly recycles worker pods during rollout.",
    engineeringMechanism:
      "Resets queriesPerRequest -> 1.2, stops connection handle leaks, and decays existing leaked connections with短暂 pod-restart overhead if applied unnecessarily.",
  },
  ADD_REPLICAS: {
    type: "ADD_REPLICAS",
    label: "Add Service Replicas (+4)",
    shortLabel: "Scale +4 Replicas",
    actionVerb: "Provisioning +4 horizontal service replicas",
    defaultParameterValue: 4,
    parameterUnit: "replicas",
    description:
      "Schedules +4 additional service replicas (3-second container warmup). Expands compute throughput capacity but increases concurrent DB connection demand.",
    engineeringMechanism:
      "Increases targetReplicaCount by +4 (bounded at 16). After 3s warmup, increases compute capacity but amplifies downstream DB/dependency concurrency pressure.",
  },
  THROTTLE_TRAFFIC: {
    type: "THROTTLE_TRAFFIC",
    label: "Throttle Ingress Traffic (60% Cap)",
    shortLabel: "Throttle 60% Ingress",
    actionVerb: "Enforcing 60% adaptive rate limit at API Gateway",
    defaultParameterValue: 0.6,
    parameterUnit: "admitted ratio",
    description:
      "Applies an API Gateway token-bucket throttle admitting 60% of incoming traffic and fast-rejecting 40% with HTTP 429 to protect downstream stability.",
    engineeringMechanism:
      "Sets trafficThrottleRatio = 0.60. Protects queues and DB saturation at the explicit cost of shedding 40% of excess user traffic.",
  },
  ADJUST_CONNECTION_POOL: {
    type: "ADJUST_CONNECTION_POOL",
    label: "Expand DB Connection Pool (+80)",
    shortLabel: "DB Pool +80 Conns",
    actionVerb: "Increasing DB connection pool limit by +80",
    defaultParameterValue: 80,
    parameterUnit: "connections",
    description:
      "Increases max database connection pool size by +80. Caution: if the database CPU/locks are already saturated by N+1 queries, higher concurrency worsens lock thrashing.",
    engineeringMechanism:
      "Increases connectionPoolLimit by +80 (up to 300). Under high query fanout, higher concurrency drives DB lock contention nonlinearly higher.",
  },
  ENABLE_CIRCUIT_BREAKER: {
    type: "ENABLE_CIRCUIT_BREAKER",
    label: "Enable Dependency Circuit Breaker",
    shortLabel: "Arm Circuit Breaker",
    actionVerb: "Enabling fast-fail circuit breaker on external dependency",
    description:
      "Arms a latency circuit breaker (threshold: 350ms). Trips open when downstream dependencies stall, serving a 14ms local heuristic fallback (~3.5% conservative reject tradeoff).",
    engineeringMechanism:
      "Sets circuitBreakerEnabled = true. When dependencyLatencyMs > 350ms, opens breaker, cutting holding time from 2,400ms to 14ms and releasing worker threads.",
  },
  RESTORE_BASELINE: {
    type: "RESTORE_BASELINE",
    label: "Restore Baseline Controls",
    shortLabel: "Restore Baseline",
    actionVerb: "Clearing manual overrides and restoring baseline configuration",
    description:
      "Removes traffic throttling, resets connection pool limit to scenario baseline, and disarms manual overrides.",
    engineeringMechanism:
      "Restores trafficThrottleRatio = 1.0, resets connectionPoolLimit to baseline, and returns targetReplicaCount toward initial baseline.",
  },
};
