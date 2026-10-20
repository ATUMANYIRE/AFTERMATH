"""
Experiment domain model.
Represents an empirical run comparing vulnerable vs repaired release behavior.
"""
from datetime import datetime
from sqlalchemy import Column, String, Text, DateTime, Integer, Float, Boolean, ForeignKey, JSON
from sqlalchemy.orm import relationship
from app.database import Base


class Experiment(Base):
    __tablename__ = "experiments"

    id = Column(String(64), primary_key=True, index=True)
    release_id = Column(String(64), ForeignKey("releases.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(128), nullable=False)
    description = Column(Text, nullable=False)
    variant = Column(String(32), nullable=False, index=True)  # "vulnerable" or "repaired"
    status = Column(String(32), nullable=False, default="completed")  # running, completed, failed
    duration_seconds = Column(Float, nullable=False, default=0.0)
    error_count = Column(Integer, nullable=False, default=0)
    transaction_count = Column(Integer, nullable=False, default=0)
    p95_latency_ms = Column(Float, nullable=False, default=0.0)
    anomaly_detected = Column(Boolean, nullable=False, default=False)
    metrics_summary = Column(JSON, nullable=True)  # Detailed metrics map
    gitlab_job_id = Column(String(64), nullable=True)
    gitlab_pipeline_id = Column(String(64), nullable=True)

    # Executable Consequence Engine fields (Milestone 2)
    scenario_id = Column(String(64), nullable=True, default="lost-response-retry")
    scenario_config = Column(JSON, nullable=True)
    reproducibility_seed = Column(Integer, nullable=True, default=42)
    invariant_status = Column(String(16), nullable=True, default="PASS")  # PASS, FAIL, ERROR
    invariant_verdict = Column(Text, nullable=True)
    ledger_summary = Column(JSON, nullable=True)

    started_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    completed_at = Column(DateTime, nullable=True)

    release = relationship("Release", back_populates="experiments")
    events = relationship("ExperimentEvent", back_populates="experiment", cascade="all, delete-orphan")
    evidences = relationship("Evidence", back_populates="experiment", cascade="all, delete-orphan")
