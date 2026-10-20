"""
Causal Node Model.
Represents discrete graph nodes within the AFTERMATH Causal Graph Engine.
"""
from datetime import datetime
from sqlalchemy import Column, String, DateTime, Text, JSON, ForeignKey
from app.database import Base


class CausalNode(Base):
    __tablename__ = "causal_nodes"

    id = Column(String(64), primary_key=True)
    release_id = Column(String(64), ForeignKey("releases.id", ondelete="CASCADE"), nullable=True, index=True)
    experiment_id = Column(String(64), ForeignKey("experiments.id", ondelete="CASCADE"), nullable=True, index=True)

    # Node Type
    # "service", "component", "code_change", "experiment", "runtime_event",
    # "failure_condition", "invariant", "observed_consequence",
    # "hypothesized_downstream_effect", "remediation_candidate", "verification_evidence"
    node_type = Column(String(64), nullable=False, index=True)

    label = Column(String(128), nullable=False)
    description = Column(Text, nullable=True)

    # Health & Risk Severity
    # "normal", "warning", "critical", "verified", "mitigated"
    severity = Column(String(32), nullable=False, default="normal")
    status = Column(String(32), nullable=False, default="active")

    # Provenance
    # "git_commit", "runtime_trace", "static_architecture", "invariant_assertion", "duo_audit", "empirical_ledger"
    provenance_type = Column(String(64), nullable=False, default="unknown")
    provenance_id = Column(String(128), nullable=True)

    # Metadata & coordinates for visual canvas
    metadata_json = Column(JSON, nullable=False, default=dict)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    def __repr__(self):
        return f"<CausalNode {self.id} type={self.node_type} label='{self.label}'>"
