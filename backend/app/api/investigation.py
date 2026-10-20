"""
Investigation Workspace API.
Provides component failure trees, consequence dependency graph data, and verified findings.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from app.database import get_db
from app.models.release import Release
from app.models.experiment import Experiment
from app.schemas.experiment import EvidenceResponse
from app.schemas.consequence import (
    InvestigationDetailResponse,
    ConsequenceGraphData,
    ConsequenceNode,
    ConsequenceEdge,
)

router = APIRouter(prefix="/investigation", tags=["Investigation Workspace"])


@router.get("/{release_id}", response_model=InvestigationDetailResponse, summary="Get Release Investigation Findings and Graph")
async def get_investigation(release_id: str, db: AsyncSession = Depends(get_db)):
    release = (await db.execute(select(Release).where(Release.id == release_id))).scalars().first()
    if not release:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Release '{release_id}' not found.",
        )

    # Collect all evidences across experiments for this release
    exp_stmt = select(Experiment).where(Experiment.release_id == release_id).options(selectinload(Experiment.evidences))
    experiments = (await db.execute(exp_stmt)).scalars().all()

    all_evidences = []
    for exp in experiments:
        for ev in exp.evidences:
            all_evidences.append(EvidenceResponse.model_validate(ev))

    # Construct the consequence dependency graph nodes and edges
    nodes = [
        ConsequenceNode(
            id="node-gateway",
            label="API Gateway",
            component_type="gateway",
            health="normal",
            risk_level="low",
            description="Receives client checkout and automated retry requests.",
            metrics={"ingress_rps": 450, "p99_latency_ms": 14.2},
        ),
        ConsequenceNode(
            id="node-checkout",
            label="Checkout Service",
            component_type="service",
            health="critical",
            risk_level="severe",
            description="Asynchronous checkout dispatcher. Omitted atomic idempotency verification in release a8f9c21b.",
            metrics={"fanout_workers": 16, "unlocked_retries": 27},
        ),
        ConsequenceNode(
            id="node-payment",
            label="Synthetic Payment Engine",
            component_type="service",
            health="critical",
            risk_level="severe",
            description="Processes debit cards and credit authorizations. Debited customers twice under concurrent retries.",
            metrics={"duplicate_charges": 27, "exposure_usd": 1240.00},
        ),
        ConsequenceNode(
            id="node-db",
            label="PostgreSQL Ledger DB",
            component_type="database",
            health="warning",
            risk_level="high",
            description="Primary transactional store. Connection pool saturated (100/100 connections) during retry storm.",
            metrics={"active_connections": 100, "pool_utilization_pct": 100.0},
        ),
        ConsequenceNode(
            id="node-redis",
            label="Redis Distributed Lock",
            component_type="cache",
            health="normal",
            risk_level="low",
            description="Distributed lock store introduced in Duo remediation patch. Enforces single-execution atomic locks.",
            metrics={"keys_held": 450, "lock_acquire_p95_ms": 2.1},
        ),
    ]

    edges = [
        ConsequenceEdge(
            id="edge-gw-checkout",
            source="node-gateway",
            target="node-checkout",
            relation="calls",
            impact_detected=False,
        ),
        ConsequenceEdge(
            id="edge-checkout-payment",
            source="node-checkout",
            target="node-payment",
            relation="cascades_to",
            impact_detected=True,
        ),
        ConsequenceEdge(
            id="edge-payment-db",
            source="node-payment",
            target="node-db",
            relation="writes_to",
            impact_detected=True,
        ),
        ConsequenceEdge(
            id="edge-checkout-redis",
            source="node-checkout",
            target="node-redis",
            relation="relies_on",
            impact_detected=False,
        ),
    ]

    return InvestigationDetailResponse(
        release_id=release.id,
        version_tag=release.version_tag,
        commit_hash=release.commit_hash,
        suspected_components=["Checkout Service", "Synthetic Payment Engine", "PostgreSQL Ledger DB"],
        root_cause_hypothesis="Asynchronous checkout fan-out omitted distributed mutex locking on idempotency keys during retry bursts, causing parallel debit transactions against downstream payment gateway.",
        verification_status="Empirically verified in sandbox experiment exp-vuln-001. Fixed in exp-rep-001.",
        graph=ConsequenceGraphData(nodes=nodes, edges=edges),
        evidence_items=all_evidences,
        synthetic_sandbox_tested=True,
    )
