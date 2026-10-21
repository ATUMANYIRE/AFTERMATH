"""
Pydantic Schemas for AFTERMATH Autonomous Remediation Engine (Milestone 4).
"""
from typing import List, Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict


class RemediationWorkflowCreate(BaseModel):
    release_id: str = Field(..., description="ID of the release experiencing the defect")
    triggering_experiment_id: Optional[str] = Field(None, description="Experiment ID that exposed the invariant violation")
    violated_invariant: str = Field(
        default="INV-PAY-001: Exactly-One-Charge-Per-Purchase",
        description="The safety invariant that failed during consequence simulation"
    )
    causal_node_id: Optional[str] = Field(default="node-inv-001", description="Node ID in the causal graph")
    target_file_path: str = Field(
        default="services/payment_worker/processor.py",
        description="Target source code path to remediate"
    )
    agent_provider: str = Field(
        default="reference_remediation_engine",
        description="Remediation provider or agent engine identifier"
    )


class RemediationApproveRequest(BaseModel):
    approver_name: str = Field(..., min_length=2, description="Full name of human approver")
    approver_email: str = Field(..., min_length=5, description="Corporate/GitLab email of human approver")
    note: Optional[str] = Field(default=None, description="Optional sign-off remarks or release justification")


class RemediationRejectRequest(BaseModel):
    approver_name: str = Field(..., min_length=2, description="Full name of reviewer rejecting the patch")
    approver_email: str = Field(..., min_length=5, description="Email of reviewer")
    reason: str = Field(..., min_length=5, description="Detailed technical reason for rejection")


class RemediationWorkflowResponse(BaseModel):
    id: str
    release_id: str
    triggering_experiment_id: Optional[str] = None
    violated_invariant: str
    causal_node_id: Optional[str] = None
    source_commit: str
    target_file_path: str
    patch_diff: Optional[str] = None
    patch_hash: Optional[str] = None
    changed_files: List[str] = []
    status: str
    agent_provider: str
    agent_model: Optional[str] = None
    tool_execution_records: List[Dict[str, Any]] = []
    validation_results: Dict[str, Any] = {}
    approval_status: str
    approval_decision: Optional[Dict[str, Any]] = None
    remediation_branch: Optional[str] = None
    gitlab_mr_url: Optional[str] = None
    gitlab_mr_status: str
    created_at: datetime
    updated_at: datetime
    completed_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class RemediationValidationResponse(BaseModel):
    workflow_id: str
    status: str
    validation_passed: bool
    validation_results: Dict[str, Any]
