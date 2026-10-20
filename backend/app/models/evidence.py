"""
Evidence domain model.
Empirical artifacts, traces, and verified facts tied to an experiment.
"""
from datetime import datetime
from sqlalchemy import Column, String, Text, Boolean, ForeignKey, JSON, DateTime
from sqlalchemy.orm import relationship
from app.database import Base


class Evidence(Base):
    __tablename__ = "evidences"

    id = Column(String(64), primary_key=True, index=True)
    experiment_id = Column(String(64), ForeignKey("experiments.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(128), nullable=False)
    category = Column(String(64), nullable=False)  # race_condition, data_corruption, timeout_cascade, security_breach
    severity = Column(String(16), nullable=False)  # critical, high, medium, low
    summary = Column(Text, nullable=False)
    raw_log_excerpt = Column(Text, nullable=True)
    gitlab_artifact_url = Column(String(256), nullable=True)
    verified = Column(Boolean, nullable=False, default=True)
    metadata_json = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    experiment = relationship("Experiment", back_populates="evidences")
