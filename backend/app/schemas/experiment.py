"""
Pydantic schemas for Experiment, Event, and Evidence models.
"""
from datetime import datetime
from typing import Optional, Dict, Any, List
from pydantic import BaseModel, ConfigDict


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
