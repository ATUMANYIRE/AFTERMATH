"""
Pydantic schemas for the AFTERMATH Causal Graph & Blast Radius Engine.
"""
from datetime import datetime
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, ConfigDict, Field


class CausalNodeSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    release_id: Optional[str] = None
    experiment_id: Optional[str] = None
    node_type: str  # service, component, code_change, experiment, runtime_event, failure_condition, invariant, observed_consequence, hypothesized_downstream_effect, remediation_candidate, verification_evidence
    label: str
    description: Optional[str] = None
    severity: str = "normal"  # normal, warning, critical, verified, mitigated
    status: str = "active"
    provenance_type: str = "unknown"  # git_commit, runtime_trace, static_architecture, invariant_assertion, duo_audit, empirical_ledger
    provenance_id: Optional[str] = None
    metadata_json: Dict[str, Any] = Field(default_factory=dict)
    created_at: datetime


class CausalEdgeSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    release_id: Optional[str] = None
    source_node_id: str
    target_node_id: str
    relation_type: str  # triggers, violates, mitigates, propagates_to, evidenced_by, hypothesizes, affects
    classification: str = "INFERRED"  # OBSERVED, EXPERIMENTALLY_SUPPORTED, INFERRED, UNKNOWN
    confidence_score: float = 1.0
    evidence_id: Optional[str] = None
    explanation: Optional[str] = None
    is_active_in_variant: str = "both"  # vulnerable, repaired, both
    metadata_json: Dict[str, Any] = Field(default_factory=dict)
    created_at: datetime


class CausalGraphResponse(BaseModel):
    release_id: str
    variant: str = "vulnerable"  # "vulnerable" or "repaired" or "diff"
    nodes: List[CausalNodeSchema]
    edges: List[CausalEdgeSchema]
    total_nodes: int
    total_edges: int
    experimentally_supported_edges: int
    inferred_edges: int
    observed_edges: int
    active_invariants: List[str]


class CausalPathStep(BaseModel):
    step_index: int
    node: CausalNodeSchema
    edge_to_next: Optional[CausalEdgeSchema] = None
    explanation: str


class CausalPathTraceResponse(BaseModel):
    source_node_id: str
    target_node_id: str
    path_found: bool
    path_length: int
    highest_severity: str
    is_experimentally_proven: bool
    steps: List[CausalPathStep]
    root_cause_node_id: Optional[str] = None
    mitigating_remediation_id: Optional[str] = None


class BlastRadiusResponse(BaseModel):
    release_id: str
    experiment_id: Optional[str] = None
    scenario_id: Optional[str] = None
    severity: str  # CRITICAL, HIGH, MEDIUM, LOW
    directly_affected_services: List[str]
    downstream_affected_services: List[str]
    violated_invariants: List[str]
    affected_transaction_count: int
    financial_exposure_usd: float
    financial_exposure_cents: int
    mitigated_in_repaired: bool
    counterfactual_delta: Dict[str, Any]
    confidence_basis: str
    assumptions: List[str]
    created_at: datetime


class CounterfactualComparisonResponse(BaseModel):
    release_id: str
    scenario_id: str
    vulnerable_blast_radius: BlastRadiusResponse
    repaired_blast_radius: BlastRadiusResponse
    mitigated_consequences: List[str]
    preserved_invariants: List[str]
    eliminated_financial_risk_usd: float
    causal_fix_verification: str
