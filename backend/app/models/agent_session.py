"""
AgentSession domain model.
Tracks GitLab Duo agents, flows, tasks, and execution progress.
"""
from datetime import datetime
from sqlalchemy import Column, String, Text, DateTime, JSON, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base


class AgentSession(Base):
    __tablename__ = "agent_sessions"

    id = Column(String(64), primary_key=True, index=True)
    release_id = Column(String(64), ForeignKey("releases.id", ondelete="CASCADE"), nullable=False, index=True)
    agent_name = Column(String(128), nullable=False)
    agent_role = Column(String(64), nullable=False)  # triage_analyst, consequence_auditor, remediation_engineer
    status = Column(String(32), nullable=False, default="completed")  # running, completed, waiting_input, failed
    goal = Column(Text, nullable=False)
    prompt = Column(Text, nullable=True)
    summary = Column(Text, nullable=True)
    tools_invoked = Column(JSON, nullable=True)  # List of tools invoked: ["gitlab_api_read_diff", "simulate_consequences", ...]
    gitlab_duo_session_id = Column(String(128), nullable=True)
    gitlab_flow_name = Column(String(128), nullable=True)
    started_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    completed_at = Column(DateTime, nullable=True)

    release = relationship("Release", back_populates="agent_sessions")
