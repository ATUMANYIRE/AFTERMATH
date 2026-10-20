"""
Causal Edge Model.
Represents directed causal, dependency, and evidential links in AFTERMATH.
"""
from datetime import datetime
from sqlalchemy import Column, String, DateTime, Text, Float, JSON, ForeignKey
from app.database import Base


class CausalEdge(Base):
    __tablename__ = "causal_edges"

    id = Column(String(64), primary_key=True)
    release_id = Column(String(64), ForeignKey("releases.id", ondelete="CASCADE"), nullable=True, index=True)
    source_node_id = Column(String(64), ForeignKey("causal_nodes.id", ondelete="CASCADE"), nullable=False, index=True)
    target_node_id = Column(String(64), ForeignKey("causal_nodes.id", ondelete="CASCADE"), nullable=False, index=True)

    # Relation Type:
    # "triggers", "violates", "mitigates", "propagates_to", "evidenced_by", "hypothesizes", "affects"
    relation_type = Column(String(64), nullable=False)

    # Strict Epistemic Classification:
    # "OBSERVED", "EXPERIMENTALLY_SUPPORTED", "INFERRED", "UNKNOWN"
    classification = Column(String(32), nullable=False, default="INFERRED", index=True)

    # Grounded confidence score (1.0 for experimentally supported, 0.95 for observed, 0.6 for inferred, 0.2 for unknown)
    confidence_score = Column(Float, nullable=False, default=1.0)

    # Optional evidence linkage
    evidence_id = Column(String(64), ForeignKey("evidences.id", ondelete="SET NULL"), nullable=True)
    explanation = Column(Text, nullable=True)

    # Variant activation: "vulnerable", "repaired", "both"
    is_active_in_variant = Column(String(32), nullable=False, default="both")

    metadata_json = Column(JSON, nullable=False, default=dict)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    def __repr__(self):
        return f"<CausalEdge {self.id}: {self.source_node_id} -[{self.relation_type} ({self.classification})]-> {self.target_node_id}>"
