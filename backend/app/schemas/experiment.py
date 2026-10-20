"""
Pydantic schemas for Experiment, Event, Evidence, and Transaction models.
"""
from datetime import datetime
from typing import Optional, Dict, Any, List
from pydantic import BaseModel, ConfigDict, Field


class ExperimentEventResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    timestamp_offset_ms: int
    service_name: str
    event_type: str
    level: str
    message: str
    latency_ms: Optional[float] = None
    payload: Optional[Dict[str, Any]] = None


class EvidenceResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    title: str
    category: str
    severity: str
    summary: str
    raw_log_excerpt: Optional[str] = None
    gitlab_artifact_url: Optional[str] = None
    verified: bool
    metadata_json: Optional[Dict[str, Any]] = None
    created_at: datetime


class TransactionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    experiment_id: Optional[str] = None
    order_id: Optional[str] = None
    transaction_ref: str
    idempotency_key: Optional[str] = None
    customer_id: str
    amount_cents: int
    currency: str
    status: str
    latency_ms: float
    is_duplicate: bool
    has_anomaly: bool
    error_detail: Optional[str] = None
    release_variant: str
    metadata_payload: Optional[Dict[str, Any]] = None
    created_at: datetime


class ExperimentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    release_id: str
    name: str
    description: str
    variant: str  # "vulnerable" or "repaired"
    status: str
    duration_seconds: float
    error_count: int
    transaction_count: int
    p95_latency_ms: float
    anomaly_detected: bool
    metrics_summary: Optional[Dict[str, Any]] = None
    gitlab_job_id: Optional[str] = None
    gitlab_pipeline_id: Optional[str] = None

    # Milestone 2 Executable Consequence Engine fields
    scenario_id: Optional[str] = None
    scenario_config: Optional[Dict[str, Any]] = None
    reproducibility_seed: Optional[int] = None
    invariant_status: Optional[str] = None
    invariant_verdict: Optional[str] = None
    ledger_summary: Optional[Dict[str, Any]] = None

    started_at: datetime
    completed_at: Optional[datetime] = None
    events: List[ExperimentEventResponse] = []
    evidences: List[EvidenceResponse] = []


class TimeMachineComparisonResponse(BaseModel):
    release_id: str
    version_tag: str
    summary: str
    vulnerable_experiment: ExperimentResponse
    repaired_experiment: ExperimentResponse
    delta_summary: Dict[str, Any]


class ScenarioConfigSchema(BaseModel):
    scenario_id: str = "lost-response-retry"
    concurrency: int = Field(default=5, ge=1, le=50)
    retry_count: int = Field(default=2, ge=0, le=10)
    delay_ms: int = Field(default=120, ge=0, le=2000)
    failure_rate: float = Field(default=0.15, ge=0.0, le=1.0)
    order_count: int = Field(default=10, ge=1, le=100)
    seed: int = Field(default=42, ge=0)


class RunExperimentRequestSchema(BaseModel):
    release_id: str = "rel-2026-001"
    variant: str = "vulnerable"
    scenario: ScenarioConfigSchema = Field(default_factory=ScenarioConfigSchema)


class RunPairRequestSchema(BaseModel):
    release_id: str = "rel-2026-001"
    scenario: ScenarioConfigSchema = Field(default_factory=ScenarioConfigSchema)
