"""
Pydantic schemas for Release models.
"""
from datetime import datetime
from typing import Optional, Dict, Any, List
from pydantic import BaseModel, ConfigDict


class ReleaseBase(BaseModel):
    version_tag: str
    commit_hash: str
    branch: str
    author: str
    summary: str
    status: str = "investigating"
    diff_stats: Optional[Dict[str, Any]] = None


class ReleaseCreate(ReleaseBase):
    id: str


class ReleaseResponse(ReleaseBase):
    model_config = ConfigDict(from_attributes=True)

    id: str
    created_at: datetime
    updated_at: datetime


class OverviewSummary(BaseModel):
    total_releases: int
    active_investigations: int
    consequences_prevented: int
    system_readiness_score: float
    releases: List[ReleaseResponse]
