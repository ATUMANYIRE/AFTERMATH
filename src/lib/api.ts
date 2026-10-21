/**
 * AFTERMATH API Client & TypeScript Interfaces
 * Milestone 2 — The Consequence Laboratory
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export interface HealthResponse {
  status: string;
  environment: string;
  database: string;
  version: string;
}

export interface ReadinessResponse {
  ready: boolean;
  database_connected: boolean;
  seed_data_loaded: boolean;
  gitlab_duo_configured: boolean;
  message: string;
}

export interface ReleaseItem {
  id: string;
  version_tag: string;
  commit_hash: string;
  branch: string;
  author: string;
  summary: string;
  status: "investigating" | "blocked" | "verified_safe" | "approved";
  diff_stats?: {
    files_changed: number;
    additions: number;
    deletions: number;
  };
  created_at: string;
  updated_at: string;
}

export interface OverviewSummary {
  total_releases: number;
  active_investigations: number;
  consequences_prevented: number;
  system_readiness_score: number;
  releases: ReleaseItem[];
}

export interface ExperimentEventItem {
  id: string;
  timestamp_offset_ms: number;
  service_name: string;
  event_type: string;
  level: "info" | "warning" | "error" | "critical" | "success";
  message: string;
  latency_ms?: number;
  payload?: Record<string, unknown>;
}

export interface EvidenceItem {
  id: string;
  title: string;
  category: string;
  severity: "critical" | "high" | "medium" | "low";
  summary: string;
  raw_log_excerpt?: string;
  gitlab_artifact_url?: string;
  verified: boolean;
  metadata_json?: Record<string, unknown>;
  created_at: string;
}

export interface TransactionItem {
  id: string;
  experiment_id?: string;
  order_id?: string;
  transaction_ref: string;
  idempotency_key?: string;
  customer_id: string;
  amount_cents: number;
  currency: string;
  status: "settled" | "duplicate_detected" | "race_corrupted" | "rejected" | "failed";
  latency_ms: number;
  is_duplicate: boolean;
  has_anomaly: boolean;
  error_detail?: string;
  release_variant: "vulnerable" | "repaired";
  metadata_payload?: Record<string, unknown>;
  created_at: string;
}

export interface ScenarioConfig {
  scenario_id: string;
  concurrency: number;
  retry_count: number;
  delay_ms: number;
  failure_rate: number;
  order_count: number;
  seed: number;
}

export interface RemediationWorkflowItem {
  id: string;
  release_id: string;
  triggering_experiment_id?: string | null;
  violated_invariant: string;
  causal_node_id?: string | null;
  source_commit: string;
  target_file_path: string;
  patch_diff?: string | null;
  patch_hash?: string | null;
  changed_files: string[];
  status:
    | "DETECTED"
    | "INVESTIGATING"
    | "PATCH_PROPOSED"
    | "VALIDATING"
    | "AWAITING_APPROVAL"
    | "APPROVED"
    | "REJECTED"
    | "COMPLETED"
    | "FAILED"
    | "CANCELLED"
    | "BLOCKED";
  agent_provider: string;
  agent_model?: string | null;
  tool_execution_records: Array<{
    step: number;
    tool: string;
    action: string;
    details?: string;
    timestamp: string;
    [key: string]: unknown;
  }>;
  validation_results: {
    verified?: boolean;
    tested_at?: string;
    pre_patch_run?: {
      exit_code: number;
      passed: number;
      failed: number;
      duration_seconds: number;
      stdout: string;
      stderr: string;
      invariant_violated?: string;
    };
    post_patch_run?: {
      exit_code: number;
      passed: number;
      failed: number;
      duration_seconds: number;
      stdout: string;
      stderr: string;
      invariant_satisfied?: string;
    };
    sandbox_worktree?: {
      isolation_mode: string;
      clean_teardown: boolean;
    };
    [key: string]: unknown;
  };
  approval_status: "PENDING" | "APPROVED" | "REJECTED";
  approval_decision?: {
    status: string;
    approver_name: string;
    approver_email: string;
    note?: string;
    reason?: string;
    decided_at: string;
  } | null;
  remediation_branch?: string | null;
  gitlab_mr_url?: string | null;
  gitlab_mr_status: string;
  created_at: string;
  updated_at: string;
  completed_at?: string | null;
}

export interface ExperimentItem {
  id: string;
  release_id: string;
  name: string;
  description: string;
  variant: "vulnerable" | "repaired";
  status: string;
  duration_seconds: number;
  error_count: number;
  transaction_count: number;
  p95_latency_ms: number;
  anomaly_detected: boolean;
  metrics_summary?: Record<string, unknown>;
  gitlab_job_id?: string;
  gitlab_pipeline_id?: string;

  // Milestone 2 fields
  scenario_id?: string;
  scenario_config?: ScenarioConfig;
  reproducibility_seed?: number;
  invariant_status?: "PASS" | "FAIL" | "ERROR";
  invariant_verdict?: string;
  ledger_summary?: {
    total_orders_processed: number;
    orders_violating_invariant: number;
    financial_exposure_usd: number;
    total_debited_usd: number;
    legitimate_billed_usd: number;
  };

  started_at: string;
  completed_at?: string;
  events: ExperimentEventItem[];
  evidences: EvidenceItem[];
}

export interface TimeMachineComparison {
  release_id: string;
  version_tag: string;
  summary: string;
  vulnerable_experiment: ExperimentItem;
  repaired_experiment: ExperimentItem;
  delta_summary: {
    errors_prevented: number;
    latency_improvement_ms: number;
    latency_improvement_ratio: string;
    financial_exposure_prevented_usd: number;
    anomalies_eliminated: boolean;
    scenario_tested?: string;
    reproducibility_seed?: number;
    gitlab_pipeline_comparison: {
      vulnerable_pipeline_id?: string;
      repaired_pipeline_id?: string;
    };
  };
}

export interface ConsequenceNode {
  id: string;
  label: string;
  component_type: "service" | "database" | "cache" | "gateway" | "external_api";
  health: "normal" | "warning" | "critical" | "degraded";
  risk_level: "low" | "medium" | "high" | "severe";
  description: string;
  metrics: Record<string, unknown>;
}

export interface ConsequenceEdge {
  id: string;
  source: string;
  target: string;
  relation: string;
  impact_detected: boolean;
}

export interface InvestigationDetail {
  release_id: string;
  version_tag: string;
  commit_hash: string;
  suspected_components: string[];
  root_cause_hypothesis: string;
  verification_status: string;
  graph: {
    nodes: ConsequenceNode[];
    edges: ConsequenceEdge[];
  };
  evidence_items: EvidenceItem[];
  synthetic_sandbox_tested: boolean;
}

export interface AgentSessionItem {
  id: string;
  release_id: string;
  agent_name: string;
  agent_role: string;
  status: string;
  goal: string;
  prompt?: string;
  summary?: string;
  tools_invoked?: string[];
  gitlab_duo_session_id?: string;
  gitlab_flow_name?: string;
  started_at: string;
  completed_at?: string;
}

export interface AgentActivityStatus {
  duo_connected: boolean;
  gitlab_instance_url: string;
  gitlab_project_path: string;
  connection_message: string;
  active_sessions_count: number;
  completed_sessions_count: number;
  sessions: AgentSessionItem[];
}

export interface ApprovalItem {
  id: string;
  release_id: string;
  gate_name: string;
  gate_type: "automated" | "human";
  status: "pending" | "approved" | "rejected";
  approver_name?: string;
  approver_email?: string;
  reason?: string;
  required: boolean;
  signed_at?: string;
  created_at: string;
}

export interface AuditEventItem {
  id: string;
  entity_type: string;
  entity_id: string;
  action: string;
  actor: string;
  details?: Record<string, unknown>;
  created_at: string;
}

export interface ReleaseControlStatus {
  release_id: string;
  version_tag: string;
  overall_status: string;
  gates_passed: number;
  gates_total: number;
  can_promote: boolean;
  gates: ApprovalItem[];
  recent_audits: AuditEventItem[];
}

// Milestone 3 Causal Graph & Blast Radius Interfaces
export interface CausalNodeItem {
  id: string;
  release_id?: string;
  experiment_id?: string;
  node_type:
    | "service"
    | "component"
    | "code_change"
    | "experiment"
    | "runtime_event"
    | "failure_condition"
    | "invariant"
    | "observed_consequence"
    | "hypothesized_downstream_effect"
    | "remediation_candidate"
    | "verification_evidence";
  label: string;
  description?: string;
  severity: "normal" | "warning" | "critical" | "verified" | "mitigated";
  status: string;
  provenance_type: "git_commit" | "runtime_trace" | "static_architecture" | "invariant_assertion" | "duo_audit" | "empirical_ledger" | "unknown";
  provenance_id?: string;
  metadata_json: Record<string, unknown>;
  created_at: string;
}

export interface CausalEdgeItem {
  id: string;
  release_id?: string;
  source_node_id: string;
  target_node_id: string;
  relation_type: "triggers" | "violates" | "mitigates" | "propagates_to" | "evidenced_by" | "hypothesizes" | "affects";
  classification: "OBSERVED" | "EXPERIMENTALLY_SUPPORTED" | "INFERRED" | "UNKNOWN";
  confidence_score: number;
  evidence_id?: string;
  explanation?: string;
  is_active_in_variant: "vulnerable" | "repaired" | "both";
  metadata_json: Record<string, unknown>;
  created_at: string;
}

export interface CausalGraphData {
  release_id: string;
  variant: "vulnerable" | "repaired" | "both";
  nodes: CausalNodeItem[];
  edges: CausalEdgeItem[];
  total_nodes: number;
  total_edges: number;
  experimentally_supported_edges: number;
  inferred_edges: number;
  observed_edges: number;
  active_invariants: string[];
}

export interface BlastRadiusReportItem {
  release_id: string;
  experiment_id?: string;
  scenario_id?: string;
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  directly_affected_services: string[];
  downstream_affected_services: string[];
  violated_invariants: string[];
  affected_transaction_count: number;
  financial_exposure_usd: number;
  financial_exposure_cents: number;
  mitigated_in_repaired: boolean;
  counterfactual_delta: Record<string, unknown>;
  confidence_basis: string;
  assumptions: string[];
  created_at: string;
}

export interface CounterfactualComparisonItem {
  release_id: string;
  scenario_id: string;
  vulnerable_blast_radius: BlastRadiusReportItem;
  repaired_blast_radius: BlastRadiusReportItem;
  mitigated_consequences: string[];
  preserved_invariants: string[];
  eliminated_financial_risk_usd: number;
  causal_fix_verification: string;
}

export interface CausalPathStepItem {
  step_index: number;
  node: CausalNodeItem;
  edge_to_next?: CausalEdgeItem;
  explanation: string;
}

export interface CausalPathTraceItem {
  source_node_id: string;
  target_node_id: string;
  path_found: boolean;
  path_length: number;
  highest_severity: "normal" | "warning" | "critical";
  is_experimentally_proven: boolean;
  steps: CausalPathStepItem[];
  root_cause_node_id?: string;
  mitigating_remediation_id?: string;
}

// Fetch helper with standard timeout and error handling
async function fetchApi<T>(path: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE_URL}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  if (!res.ok) {
    let errorMsg = `API request failed with status ${res.status}`;
    try {
      const errJson = await res.json();
      if (errJson.detail) errorMsg = errJson.detail;
    } catch {
      // ignore
    }
    throw new Error(errorMsg);
  }

  return res.json();
}

export const api = {
  getHealth: () => fetchApi<HealthResponse>("/healthz"),
  getReadiness: () => fetchApi<ReadinessResponse>("/readyz"),
  getOverview: () => fetchApi<OverviewSummary>("/api/v1/overview"),
  getTimeMachineComparison: (releaseId: string) =>
    fetchApi<TimeMachineComparison>(`/api/v1/time-machine/compare/${releaseId}`),
  getInvestigation: (releaseId: string) =>
    fetchApi<InvestigationDetail>(`/api/v1/investigation/${releaseId}`),
  getAgentActivity: () => fetchApi<AgentActivityStatus>("/api/v1/agent-activity"),
  triggerAgent: (releaseId: string, goal: string) =>
    fetchApi<AgentSessionItem>("/api/v1/agent-activity/trigger", {
      method: "POST",
      body: JSON.stringify({ release_id: releaseId, goal }),
    }),
  getReleaseControl: (releaseId: string) =>
    fetchApi<ReleaseControlStatus>(`/api/v1/release-control/${releaseId}`),
  signOffGate: (
    releaseId: string,
    gateId: string,
    action: { status: "approved" | "rejected"; approver_name: string; approver_email: string; reason: string }
  ) =>
    fetchApi<ApprovalItem>(`/api/v1/release-control/${releaseId}/gates/${gateId}/action`, {
      method: "POST",
      body: JSON.stringify(action),
    }),

  // Milestone 2 Consequence Laboratory APIs
  runExperimentPair: (req: { release_id: string; scenario: ScenarioConfig }) =>
    fetchApi<TimeMachineComparison>("/api/v1/experiments/run-pair", {
      method: "POST",
      body: JSON.stringify(req),
    }),
  getExperimentHistory: (limit = 20) =>
    fetchApi<ExperimentItem[]>(`/api/v1/experiments/history?limit=${limit}`),
  getExperimentComparison: (id: string) =>
    fetchApi<TimeMachineComparison>(`/api/v1/experiments/${id}/comparison`),
  getExperimentLedger: (id: string) =>
    fetchApi<TransactionItem[]>(`/api/v1/experiments/${id}/ledger`),

  // Milestone 3 Causal Graph & Blast Radius APIs
  getCausalGraph: (releaseId: string, variant: "vulnerable" | "repaired" | "both" = "vulnerable") =>
    fetchApi<CausalGraphData>(`/api/v1/investigation/${releaseId}/causal-graph?variant=${variant}`),
  getBlastRadius: (releaseId: string, experimentId?: string) =>
    fetchApi<BlastRadiusReportItem>(
      `/api/v1/investigation/${releaseId}/blast-radius${experimentId ? `?experiment_id=${experimentId}` : ""}`
    ),
  getCounterfactualComparison: (releaseId: string, scenarioId = "lost-response-retry") =>
    fetchApi<CounterfactualComparisonItem>(
      `/api/v1/investigation/${releaseId}/counterfactual?scenario_id=${scenarioId}`
    ),
  traceCausalPath: (releaseId: string, sourceNodeId: string, targetNodeId: string, maxDepth = 10) =>
    fetchApi<CausalPathTraceItem>(
      `/api/v1/investigation/${releaseId}/trace-path?source_node_id=${sourceNodeId}&target_node_id=${targetNodeId}&max_depth=${maxDepth}`
    ),

  // Milestone 4 Autonomous Remediation & Fix Verification APIs
  getRemediationWorkflows: (releaseId?: string) =>
    fetchApi<RemediationWorkflowItem[]>(
      `/api/v1/remediations/workflows${releaseId ? `?release_id=${releaseId}` : ""}`
    ),
  getRemediationWorkflow: (workflowId: string) =>
    fetchApi<RemediationWorkflowItem>(`/api/v1/remediations/workflows/${workflowId}`),
  triggerRemediation: (req: {
    release_id: string;
    triggering_experiment_id?: string;
    violated_invariant?: string;
    causal_node_id?: string;
    target_file_path?: string;
  }) =>
    fetchApi<RemediationWorkflowItem>("/api/v1/remediations/trigger", {
      method: "POST",
      body: JSON.stringify(req),
    }),
  validateRemediation: (workflowId: string) =>
    fetchApi<RemediationWorkflowItem>(`/api/v1/remediations/workflows/${workflowId}/validate`, {
      method: "POST",
    }),
  approveRemediation: (
    workflowId: string,
    req: { approver_name: string; approver_email: string; note?: string }
  ) =>
    fetchApi<RemediationWorkflowItem>(`/api/v1/remediations/workflows/${workflowId}/approve`, {
      method: "POST",
      body: JSON.stringify(req),
    }),
  rejectRemediation: (
    workflowId: string,
    req: { approver_name: string; approver_email: string; reason: string }
  ) =>
    fetchApi<RemediationWorkflowItem>(`/api/v1/remediations/workflows/${workflowId}/reject`, {
      method: "POST",
      body: JSON.stringify(req),
    }),
  getRemediationDiff: (workflowId: string) =>
    fetchApi<{
      workflow_id: string;
      target_file_path: string;
      patch_hash: string;
      patch_diff: string;
      changed_files: string[];
    }>(`/api/v1/remediations/workflows/${workflowId}/diff`),
};
