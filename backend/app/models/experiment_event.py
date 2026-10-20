"""
ExperimentEvent domain model.
Chronological events recorded during an empirical release simulation/experiment.
"""
from datetime import datetime
from sqlalchemy import Column, String, Text, Integer, Float, ForeignKey, JSON
from sqlalchemy.orm import relationship
from app.database import Base


class ExperimentEvent(Base):
    __tablename__ = "experiment_events"

    id = Column(String(64), primary_key=True, index=True)
    experiment_id = Column(String(64), ForeignKey("experiments.id", ondelete="CASCADE"), nullable=False, index=True)
    timestamp_offset_ms = Column(Integer, nullable=False, index=True)  # offset from start in ms
    service_name = Column(String(64), nullable=False)
    event_type = Column(String(64), nullable=False)  # request, database_query, lock_acquired, failure, repair_check
    level = Column(String(16), nullable=False, default="info")  # info, warning, error, critical, success
    message = Column(Text, nullable=False)
    latency_ms = Column(Float, nullable=True)
    payload = Column(JSON, nullable=True)

    experiment = relationship("Experiment", back_populates="events")
