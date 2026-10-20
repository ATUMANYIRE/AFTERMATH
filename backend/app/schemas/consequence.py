"""
Pydantic schemas for the Investigation Workspace.
"""
from typing import List, Dict, Any, Optional
from pydantic import BaseModel
from app.schemas.experiment import EvidenceResponse


class ConsequenceNode(BaseModel):
    id: str
    label: str
    component_type: str  # service, database, cache, gateway, external_api
    health: str  # normal, warning, critical, degraded
    risk_level: str  # low, medium, high, severe
    description: str
    metrics: Dict[str, Any]


class ConsequenceEdge(BaseModel):
    id: str
    source: str
    target: str
    relation: str  # calls, writes_to, relies_on, cascades_to
    impact_detected: bool


class ConsequenceGraphData(BaseModel):
    nodes: List[ConsequenceNode]
    edges: List[ConsequenceEdge]


class InvestigationDetailResponse(BaseModel):
    release_id: str
    version_tag: str
    commit_hash: str
    suspected_components: List[str]
    root_cause_hypothesis: str
    verification_status: str
    graph: ConsequenceGraphData
    evidence_items: List[EvidenceResponse]
    synthetic_sandbox_tested: bool
