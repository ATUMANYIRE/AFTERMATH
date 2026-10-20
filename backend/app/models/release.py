"""
Release domain model.
"""
from datetime import datetime
from sqlalchemy import Column, String, Text, DateTime, JSON
from sqlalchemy.orm import relationship
from app.database import Base


class Release(Base):
    __tablename__ = "releases"

    id = Column(String(64), primary_key=True, index=True)
    version_tag = Column(String(32), nullable=False, index=True)
    commit_hash = Column(String(64), nullable=False, index=True)
    branch = Column(String(128), nullable=False)
    author = Column(String(128), nullable=False)
    summary = Column(Text, nullable=False)
    status = Column(String(32), nullable=False, default="investigating")  # investigating, verified_safe, blocked, approved
    diff_stats = Column(JSON, nullable=True)  # {"files_changed": 4, "additions": 142, "deletions": 18}
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    experiments = relationship("Experiment", back_populates="release", cascade="all, delete-orphan")
    agent_sessions = relationship("AgentSession", back_populates="release", cascade="all, delete-orphan")
    approvals = relationship("Approval", back_populates="release", cascade="all, delete-orphan")
