"""
Pydantic schemas for AgentSession models and GitLab Duo flow status.
"""
from datetime import datetime
from typing import Optional, Dict, Any, List
from pydantic import BaseModel, ConfigDict


class AgentSessionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    release_id: str
    agent_name: str
    agent_role: str
    status: str
    goal: str
    prompt: Optional[str] = None
    summary: Optional[str] = None
    tools_invoked: Optional[List[str]] = None
    gitlab_duo_session_id: Optional[str] = None
    gitlab_flow_name: Optional[str] = None
    started_at: datetime
    completed_at: Optional[datetime] = None


class AgentActivityStatusResponse(BaseModel):
    duo_connected: bool
    gitlab_instance_url: str
    gitlab_project_path: str
    connection_message: str
    active_sessions_count: int
    completed_sessions_count: int
    sessions: List[AgentSessionResponse]
