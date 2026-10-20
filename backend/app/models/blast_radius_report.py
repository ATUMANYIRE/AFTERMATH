"""
Blast Radius Report Model.
Persists deterministic blast radius calculations, synthetic exposure, and counterfactual deltas.
"""
from datetime import datetime
from sqlalchemy import Column, String, DateTime, Integer, Float, Boolean, JSON, ForeignKey
from app.database import Base


class BlastRadiusReport(Base):
    __tablename__ = "blast_radius_reports"

    id = Column(String(64), primary_key=True)
    release_id = Column(String(64), ForeignKey("releases.id", ondelete="CASCADE"), nullable=False, index=True)
    experiment_id = Column(String(64), ForeignKey("experiments.id", ondelete="CASCADE"), nullable=True, index=True)
    scenario_id = Column(String(64), nullable=True)

    # Severity: "CRITICAL", "HIGH", "MEDIUM", "LOW"
    severity = Column(String(32), nullable=False, default="HIGH")

    # Affected services and components
    directly_affected_services = Column(JSON, nullable=False, default=list)
    downstream_affected_services = Column(JSON, nullable=False, default=list)
    violated_invariants = Column(JSON, nullable=False, default=list)

    # Impact metrics
    affected_transaction_count = Column(Integer, nullable=False, default=0)
    financial_exposure_cents = Column(Integer, nullable=False, default=0)
    financial_exposure_usd = Column(Float, nullable=False, default=0.0)

    # Counterfactual mitigation
    mitigated_in_repaired = Column(Boolean, nullable=False, default=False)
    counterfactual_delta = Column(JSON, nullable=False, default=dict)

    # Epistemic confidence & mathematical assumptions
    confidence_basis = Column(String(128), nullable=False, default="Empirically Grounded (Synthetic Consequence Engine)")
    assumptions = Column(JSON, nullable=False, default=list)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    def __repr__(self):
        return f"<BlastRadiusReport {self.id} release={self.release_id} severity={self.severity} exposure=${self.financial_exposure_usd:.2f}>"
