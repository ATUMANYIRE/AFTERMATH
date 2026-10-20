export type ScenarioId =
  | "checkout-db-exhaustion"
  | "traffic-spike-replicas"
  | "dependency-timeout-cascade";

export type InterventionType =
  | "ROLLBACK_DEPLOYMENT"
  | "ADD_REPLICAS"
  | "THROTTLE_TRAFFIC"
  | "ADJUST_CONNECTION_POOL"
  | "ENABLE_CIRCUIT_BREAKER"
  | "RESTORE_BASELINE";

export type SystemHealthStatus = "NOMINAL" | "DEGRADED" | "INCIDENT" | "RECOVERING";

export type NodeStatus = "healthy" | "degraded" | "critical";

export interface ArchitectureNodeHealth {
  edge: NodeStatus;
  gateway: NodeStatus;
  service: NodeStatus;
  dependency: NodeStatus;
  database: NodeStatus;
}

/**
 * Explicit deterministic discrete-time system state vector at simulated time t.
 * Includes all 11 required core state metrics plus auxiliary causal state variables
 * required for stateful multi-tick transitions and exact snapshot restoration.
 */
export interface SystemState {
  /** Discrete simulated time in seconds (t >= 0) */
  simulatedTime: number;
  /** Incoming client request rate in req/s */
  requestRate: number;
  /** Effective service processing capacity across healthy replicas in req/s */
  serviceCapacity: number;
  /** Currently held concurrent database connections */
  activeConnections: number;
  /** Configured maximum database connection pool limit */
  connectionPoolLimit: number;
  /** Current number of queued requests awaiting processing */
  queueDepth: number;
  /** Fraction of requests failing or shed in [0, 1] */
  errorRate: number;
  /** Estimated p95 end-to-end latency in milliseconds */
  latencyEstimate: number;
  /** Currently active and healthy service replicas */
  healthyReplicaCount: number;
  /** Database CPU / lock / I/O saturation index in [0, 1] */
  databaseSaturation: number;
  /** Active service deployment version identifier */
  deploymentVersion: string;

  // Auxiliary causal state variables (persisted in snapshots for true time-travel)
  /** Target replica count including any replicas currently warming up */
  targetReplicaCount: number;
  /** Remaining ticks until pending replicas finish booting (0 if none) */
  replicaWarmupRemaining: number;
  /** Fraction of incoming traffic admitted through gateway in [0.1, 1.0] */
  trafficThrottleRatio: number;
  /** Whether the downstream dependency circuit breaker is armed */
  circuitBreakerEnabled: boolean;
  /** Whether the circuit breaker is actively open (fast-fallback mode) */
  circuitBreakerOpen: boolean;
  /** Downstream dependency call latency in ms */
  dependencyLatencyMs: number;
  /** Accumulated leaked DB connections from faulty release */
  leakedConnections: number;
  /** Average database queries executed per admitted request */
  queriesPerRequest: number;
  /** Deterministic PRNG internal 32-bit state for exact replay */
  prngState: number;
  /** Overall system health classification */
  status: SystemHealthStatus;
  /** Component-level statuses for architecture graph synchronization */
  nodeHealth: ArchitectureNodeHealth;
}

export interface InterventionAction {
  id: string;
  type: InterventionType;
  appliedAtTime: number;
  label: string;
  parameterValue?: number;
  rationale: string;
}

export type SimulationEventSeverity = "info" | "warning" | "critical" | "recovery" | "intervention";

export interface SimulationEvent {
  id: string;
  time: number;
  severity: SimulationEventSeverity;
  component: "edge" | "gateway" | "service" | "dependency" | "database" | "operator";
  title: string;
  detail: string;
  equationRef?: string;
}

export interface SimulationSnapshot {
  time: number;
  state: SystemState;
  eventsAtStep: SimulationEvent[];
  activeInterventions: InterventionAction[];
}

export interface ScenarioDefinition {
  id: ScenarioId;
  title: string;
  shortTitle: string;
  subtitle: string;
  category: string;
  defaultSeed: number;
  durationSeconds: number;
  incidentTriggerTime: number;
  summary: string;
  initialState: Omit<SystemState, "prngState" | "status" | "nodeHealth">;
  rootCauseGroundTruth: {
    primaryMechanism: string;
    governingEquation: string;
    whyNaiveFixesFail: string;
    recommendedIntervention: InterventionType;
    tradeoffIntervention: InterventionType;
    failingIntervention: InterventionType;
  };
  assumptions: string[];
  limitations: string[];
}

export interface TrajectoryMetricsSummary {
  peakLatencyMs: number;
  peakErrorRate: number;
  peakQueueDepth: number;
  peakDbSaturation: number;
  minHealthyReplicas: number;
  totalFailedRequests: number;
  totalServedRequests: number;
  availabilityPct: number;
  timeInIncidentSeconds: number;
  recoveryTimeSeconds: number | null;
  recoveredByEnd: boolean;
  finalState: SystemState;
}

export interface SimulationTrajectory {
  id: string;
  label: string;
  scenarioId: ScenarioId;
  seed: number;
  branchedFromTime: number | null;
  snapshots: SimulationSnapshot[];
  events: SimulationEvent[];
  interventions: InterventionAction[];
  summary: TrajectoryMetricsSummary;
}

export interface InterventionEvaluation {
  type: InterventionType;
  name: string;
  shortDescription: string;
  expectedOutcome: "effective" | "tradeoff" | "counterproductive";
  causalMechanism: string;
  simulatedDeltaSummary?: {
    peakErrorRateDeltaPct: number;
    peakLatencyDeltaMs: number;
    availabilityDeltaPct: number;
    recoveryTimeSeconds: number | null;
  };
}

export interface CausalIncidentReport {
  scenario: ScenarioDefinition;
  seed: number;
  generatedAtIso: string;
  baselineTrajectory: SimulationTrajectory;
  branchTrajectory: SimulationTrajectory | null;
  rootCauseHypothesis: {
    headline: string;
    causalChain: string[];
    mathematicalEvidence: string[];
  };
  keyEvidence: {
    metric: string;
    baselinePeak: string;
    counterfactualPeak: string;
    delta: string;
    interpretation: string;
  }[];
  interventionEvaluations: InterventionEvaluation[];
  recoveryOutcome: {
    status: "RECOVERED" | "PARTIAL_MITIGATION" | "UNRECOVERED" | "NO_INTERVENTION";
    headline: string;
    explanation: string;
  };
  modelAssumptions: string[];
  modelLimitations: string[];
}
