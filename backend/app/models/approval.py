"""
Approval domain model.
Verification gates, human sign-off, staging readiness, and release gating.
"""
from datetime import datetime
from sqlalchemy import Column, String, Text, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from app.database import Base


class Approval(Base):
    __tablename__ = "approvals"

    id = Column(String(64), primary_key=True, index=True)
    release_id = Column(String(64), ForeignKey("releases.id", ondelete="CASCADE"), nullable=False, index=True)
    gate_name = Column(String(128), nullable=False)  # "synthetic_payment_idempotency", "canary_health_check", "lead_engineer_signoff"
    gate_type = Column(String(32), nullable=False, default="automated")  # automated, human
    status = Column(String(32), nullable=False, default="pending")  # pending, approved, rejected
    approver_name = Column(String(128), nullable=True)
    approver_email = Column(String(128), nullable=True)
    reason = Column(Text, nullable=True)
    required = Column(Boolean, nullable=False, default=True)
    signed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    release = relationship("Release", back_populates="approvals")
