"""
Pydantic schemas for Approval, Release Control, and Audit models.
"""
from datetime import datetime
from typing import Optional, Dict, Any, List
from pydantic import BaseModel, ConfigDict


class ApprovalResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    release_id: str
    gate_name: str
    gate_type: str
    status: str
    approver_name: Optional[str] = None
    approver_email: Optional[str] = None
    reason: Optional[str] = None
    required: bool
    signed_at: Optional[datetime] = None
    created_at: datetime


class ApprovalActionRequest(BaseModel):
    status: str  # "approved" or "rejected"
    approver_name: str
    approver_email: str
    reason: str


class AuditEventResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    entity_type: str
    entity_id: str
    action: str
    actor: str
    details: Optional[Dict[str, Any]] = None
    created_at: datetime


class ReleaseControlStatusResponse(BaseModel):
    release_id: str
    version_tag: str
    overall_status: str  # "blocked", "ready_for_staging", "approved_for_production"
    gates_passed: int
    gates_total: int
    can_promote: bool
    gates: List[ApprovalResponse]
    recent_audits: List[AuditEventResponse]


class ReleaseSuperpositionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    release_id: str
    version_tag: str
    commit_hash: str
    generated_at: str
    recommendation: Dict[str, Any]
    scenario_matrix: List[Dict[str, Any]]
    blast_radius_delta: Dict[str, Any]
