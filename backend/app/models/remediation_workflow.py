"""
Remediation Workflow Model.
Persists the end-to-end autonomous remediation lifecycle:
DETECTED -> INVESTIGATING -> PATCH_PROPOSED -> VALIDATING -> AWAITING_APPROVAL -> APPROVED/REJECTED -> COMPLETED
"""
from datetime import datetime
from sqlalchemy import Column, String, DateTime, Text, JSON, ForeignKey
from app.database import Base


class RemediationWorkflow(Base):
    __tablename__ = "remediation_workflows"

    id = Column(String(64), primary_key=True)
    release_id = Column(String(64), ForeignKey("releases.id", ondelete="CASCADE"), nullable=False, index=True)
    triggering_experiment_id = Column(String(64), ForeignKey("experiments.id", ondelete="SET NULL"), nullable=True, index=True)

    violated_invariant = Column(String(128), nullable=False, default="INV-PAY-001: Exactly-One-Charge-Per-Purchase")
    causal_node_id = Column(String(64), nullable=True)
    source_commit = Column(String(64), nullable=False)
    target_file_path = Column(String(255), nullable=False)

    # Patch Artifacts
    patch_diff = Column(Text, nullable=True)
    patch_hash = Column(String(64), nullable=True)
    changed_files = Column(JSON, nullable=False, default=list)

    # State Machine Status
    # DETECTED, INVESTIGATING, PATCH_PROPOSED, VALIDATING, AWAITING_APPROVAL, APPROVED, REJECTED, COMPLETED, FAILED, CANCELLED, BLOCKED
    status = Column(String(32), nullable=False, default="DETECTED", index=True)

    # Agent / Provider Provenance
    agent_provider = Column(String(64), nullable=False, default="reference_remediation_engine")
    agent_model = Column(String(64), nullable=True)
    tool_execution_records = Column(JSON, nullable=False, default=list)

    # Concrete Validation Execution Results
    validation_results = Column(JSON, nullable=False, default=dict)

    # Human Approval Gate
    approval_status = Column(String(32), nullable=False, default="PENDING")
    approval_decision = Column(JSON, nullable=True)

    # Branch & GitLab MR Linkage
    remediation_branch = Column(String(128), nullable=True)
    gitlab_mr_url = Column(String(255), nullable=True)
    gitlab_mr_status = Column(String(32), nullable=False, default="BLOCKED")

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    completed_at = Column(DateTime, nullable=True)

    def __repr__(self):
        return f"<RemediationWorkflow {self.id} status={self.status} target={self.target_file_path}>"
