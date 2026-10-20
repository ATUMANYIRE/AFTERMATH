"""
SyntheticTransaction domain model.
Represents transactions processed by the isolated synthetic payment service during release consequence testing.
"""
from datetime import datetime
from sqlalchemy import Column, String, Integer, DateTime, Boolean, JSON, Float
from app.database import Base


class SyntheticTransaction(Base):
    __tablename__ = "synthetic_transactions"

    id = Column(String(64), primary_key=True, index=True)
    transaction_ref = Column(String(64), nullable=False, unique=True, index=True)
    idempotency_key = Column(String(128), nullable=True, index=True)
    customer_id = Column(String(64), nullable=False, index=True)
    amount_cents = Column(Integer, nullable=False)
    currency = Column(String(3), nullable=False, default="USD")
    status = Column(String(32), nullable=False)  # settled, rejected, duplicate_detected, race_corrupted
    latency_ms = Column(Float, nullable=False, default=45.0)
    is_duplicate = Column(Boolean, nullable=False, default=False)
    has_anomaly = Column(Boolean, nullable=False, default=False)
    error_detail = Column(String(256), nullable=True)
    release_variant = Column(String(32), nullable=False)  # "vulnerable" or "repaired"
    metadata_payload = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
