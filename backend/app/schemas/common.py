"""
Common Pydantic schemas.
"""
from typing import Any, Dict, Optional
from pydantic import BaseModel


class HealthResponse(BaseModel):
    status: str
    environment: str
    database: str
    version: str


class ReadinessResponse(BaseModel):
    ready: bool
    database_connected: bool
    seed_data_loaded: bool
    gitlab_duo_configured: bool
    message: str


class StandardResponse(BaseModel):
    success: bool
    message: str
    data: Optional[Dict[str, Any]] = None
