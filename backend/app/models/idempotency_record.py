"""
IdempotencyRecord domain model.
Provides durable database-backed idempotency tracking with lease expiration and state machine.
Enforces transactional safety for the repaired release variant.
"""
from datetime import datetime
from sqlalchemy import Column, String, DateTime, JSON, ForeignKey, UniqueConstraint
from app.database import Base


class IdempotencyRecord(Base):
    __tablename__ = "idempotency_records"

    id = Column(String(64), primary_key=True, index=True)
    experiment_id = Column(String(64), ForeignKey("experiments.id", ondelete="CASCADE"), nullable=False, index=True)
    scope = Column(String(64), nullable=False, default="checkout_payment")
    idempotency_key = Column(String(128), nullable=False, index=True)
    order_id = Column(String(64), nullable=False, index=True)
    status = Column(String(32), nullable=False, default="IN_FLIGHT")  # IN_FLIGHT, SETTLED, FAILED
    response_payload = Column(JSON, nullable=True)
    locked_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    lease_expires_at = Column(DateTime, nullable=False)
    settled_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    __table_args__ = (
        UniqueConstraint("experiment_id", "scope", "idempotency_key", name="uq_experiment_idempotency_key"),
    )
