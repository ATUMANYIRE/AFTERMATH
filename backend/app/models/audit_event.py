"""
AuditEvent domain model.
Immutable append-only audit trail for compliance and DevSecOps governance.
"""
from datetime import datetime
from sqlalchemy import Column, String, Text, DateTime, JSON
from app.database import Base


class AuditEvent(Base):
    __tablename__ = "audit_events"

    id = Column(String(64), primary_key=True, index=True)
    entity_type = Column(String(64), nullable=False, index=True)  # release, approval, experiment, agent_session
    entity_id = Column(String(64), nullable=False, index=True)
    action = Column(String(64), nullable=False)  # created, evaluated, approved, rejected, blocked
    actor = Column(String(128), nullable=False)  # user email or agent identifier
    details = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
