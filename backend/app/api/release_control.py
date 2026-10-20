"""
Release Control Workspace API.
Verification gates, staging readiness, human sign-off, and audit trail.
Never simulates fake production deployment; tracks verified readiness gates.
"""
from datetime import datetime
import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models.release import Release
from app.models.approval import Approval
from app.models.audit_event import AuditEvent
from app.schemas.approval import (
    ReleaseControlStatusResponse,
    ApprovalResponse,
    ApprovalActionRequest,
    AuditEventResponse,
)

router = APIRouter(prefix="/release-control", tags=["Release Control Workspace"])


@router.get("/{release_id}", response_model=ReleaseControlStatusResponse, summary="Get Release Control Gates & Status")
async def get_release_control(release_id: str, db: AsyncSession = Depends(get_db)):
    release = (await db.execute(select(Release).where(Release.id == release_id))).scalars().first()
    if not release:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Release '{release_id}' not found.",
        )

    # Fetch gates
    gates_stmt = select(Approval).where(Approval.release_id == release_id).order_by(Approval.created_at.asc())
    gates = (await db.execute(gates_stmt)).scalars().all()

    # Fetch recent audits
    audits_stmt = select(AuditEvent).where(
        AuditEvent.entity_type.in_(["release", "approval", "experiment"])
    ).order_by(AuditEvent.created_at.desc()).limit(15)
    audits = (await db.execute(audits_stmt)).scalars().all()

    gates_passed = sum(1 for g in gates if g.status == "approved")
    gates_total = len(gates)
    can_promote = (gates_passed == gates_total) and (gates_total > 0)

    overall_status = "blocked"
    if can_promote:
        overall_status = "approved_for_staging"
    elif gates_passed >= 3:
        overall_status = "pending_human_signoff"

    return ReleaseControlStatusResponse(
        release_id=release.id,
        version_tag=release.version_tag,
        overall_status=overall_status,
        gates_passed=gates_passed,
        gates_total=gates_total,
        can_promote=can_promote,
        gates=[ApprovalResponse.model_validate(g) for g in gates],
        recent_audits=[AuditEventResponse.model_validate(a) for a in audits],
    )


@router.post("/{release_id}/gates/{gate_id}/action", response_model=ApprovalResponse, summary="Sign-off or Reject Release Gate")
async def sign_off_gate(
    release_id: str,
    gate_id: str,
    req: ApprovalActionRequest,
    db: AsyncSession = Depends(get_db),
):
    gate = (await db.execute(select(Approval).where(
        Approval.id == gate_id,
        Approval.release_id == release_id,
    ))).scalars().first()

    if not gate:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Gate '{gate_id}' for release '{release_id}' not found.",
        )

    if req.status not in ("approved", "rejected"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Status must be either 'approved' or 'rejected'.",
        )

    gate.status = req.status
    gate.approver_name = req.approver_name
    gate.approver_email = req.approver_email
    gate.reason = req.reason
    gate.signed_at = datetime.utcnow()

    # Record immutable audit event
    audit = AuditEvent(
        id=f"audit-{uuid.uuid4().hex[:8]}",
        entity_type="approval",
        entity_id=gate.id,
        action=f"gate_{req.status}",
        actor=f"{req.approver_name} <{req.approver_email}>",
        details={"gate_name": gate.gate_name, "reason": req.reason},
        created_at=datetime.utcnow(),
    )
    db.add(audit)

    # If all gates approved, update release status
    all_gates = (await db.execute(select(Approval).where(Approval.release_id == release_id))).scalars().all()
    if all(g.status == "approved" for g in all_gates):
        rel = (await db.execute(select(Release).where(Release.id == release_id))).scalars().first()
        if rel:
            rel.status = "approved"

    await db.commit()
    await db.refresh(gate)

    return ApprovalResponse.model_validate(gate)
