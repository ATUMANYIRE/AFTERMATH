"""
Remediation Workflow API endpoints (Milestone 4).
Supervised remediation, patch generation, isolated verification, and human gatekeeper approvals.
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.schemas.remediation import (
    RemediationWorkflowCreate,
    RemediationWorkflowResponse,
    RemediationApproveRequest,
    RemediationRejectRequest,
    RemediationValidationResponse,
)
from app.services.remediation_engine import (
    create_remediation_workflow,
    validate_remediation_workflow,
    approve_remediation_workflow,
    reject_remediation_workflow,
    list_remediation_workflows,
    get_remediation_workflow,
)

router = APIRouter(prefix="/remediations", tags=["Remediation & Fix Verification"])


@router.post(
    "/trigger",
    response_model=RemediationWorkflowResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Trigger Autonomous Remediation Workflow",
    description="Initiates root-cause patch synthesis for a detected invariant violation and generates a unified diff.",
)
async def trigger_remediation(
    req: RemediationWorkflowCreate,
    db: AsyncSession = Depends(get_db),
):
    return await create_remediation_workflow(db, req)


@router.get(
    "/workflows",
    response_model=List[RemediationWorkflowResponse],
    summary="List Remediation Workflows",
    description="Returns all remediation workflows, optionally filtered by release ID.",
)
async def get_all_workflows(
    release_id: Optional[str] = Query(None, description="Filter by Release ID"),
    db: AsyncSession = Depends(get_db),
):
    return await list_remediation_workflows(db, release_id=release_id)


@router.get(
    "/workflows/{workflow_id}",
    response_model=RemediationWorkflowResponse,
    summary="Get Remediation Workflow Details",
    description="Returns detailed workflow record including patch diff, status, and validation results.",
)
async def get_workflow_by_id(
    workflow_id: str,
    db: AsyncSession = Depends(get_db),
):
    workflow = await get_remediation_workflow(db, workflow_id)
    if not workflow:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Remediation workflow '{workflow_id}' not found.",
        )
    return workflow


@router.post(
    "/workflows/{workflow_id}/validate",
    response_model=RemediationWorkflowResponse,
    summary="Execute Sandboxed Fix Verification",
    description="Executes the invariant test against both unpatched (fails) and patched (passes) source in an isolated worktree.",
)
async def run_validation(
    workflow_id: str,
    db: AsyncSession = Depends(get_db),
):
    return await validate_remediation_workflow(db, workflow_id)


@router.post(
    "/workflows/{workflow_id}/approve",
    response_model=RemediationWorkflowResponse,
    summary="Approve Remediated Patch",
    description="Explicit human gatekeeper approval. Validates identity and transitions workflow to COMPLETED.",
)
async def approve_patch(
    workflow_id: str,
    req: RemediationApproveRequest,
    db: AsyncSession = Depends(get_db),
):
    return await approve_remediation_workflow(
        db,
        workflow_id=workflow_id,
        approver_name=req.approver_name,
        approver_email=req.approver_email,
        note=req.note,
    )


@router.post(
    "/workflows/{workflow_id}/reject",
    response_model=RemediationWorkflowResponse,
    summary="Reject Remediated Patch",
    description="Explicit human gatekeeper rejection. Validates reviewer identity and records required justification.",
)
async def reject_patch(
    workflow_id: str,
    req: RemediationRejectRequest,
    db: AsyncSession = Depends(get_db),
):
    return await reject_remediation_workflow(
        db,
        workflow_id=workflow_id,
        approver_name=req.approver_name,
        approver_email=req.approver_email,
        reason=req.reason,
    )


@router.get(
    "/workflows/{workflow_id}/diff",
    summary="Get Raw Patch Diff",
    description="Returns the GNU unified diff text for syntax highlighting and inspection.",
)
async def get_patch_diff(
    workflow_id: str,
    db: AsyncSession = Depends(get_db),
):
    workflow = await get_remediation_workflow(db, workflow_id)
    if not workflow:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Remediation workflow '{workflow_id}' not found.",
        )
    return {
        "workflow_id": workflow.id,
        "target_file_path": workflow.target_file_path,
        "patch_hash": workflow.patch_hash,
        "patch_diff": workflow.patch_diff,
        "changed_files": workflow.changed_files,
    }
