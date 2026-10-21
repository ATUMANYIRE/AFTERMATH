"""
Integration tests for AFTERMATH REST endpoints across all five workspaces.
"""
import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_overview_endpoint(client: AsyncClient):
    resp = await client.get("/api/v1/overview")
    assert resp.status_code == 200
    data = resp.json()
    assert data["total_releases"] >= 2
    assert "active_investigations" in data
    assert "consequences_prevented" in data
    assert len(data["releases"]) >= 2
    assert data["releases"][0]["id"] == "rel-2026-001"


@pytest.mark.asyncio
async def test_time_machine_comparison(client: AsyncClient):
    resp = await client.get("/api/v1/time-machine/compare/rel-2026-001")
    assert resp.status_code == 200
    data = resp.json()
    assert data["release_id"] == "rel-2026-001"
    
    # Vulnerable run assertions
    vuln = data["vulnerable_experiment"]
    assert vuln["variant"] == "vulnerable"
    assert vuln["anomaly_detected"] is True
    assert vuln["error_count"] == 27
    assert len(vuln["events"]) > 0
    assert len(vuln["evidences"]) > 0

    # Repaired run assertions
    rep = data["repaired_experiment"]
    assert rep["variant"] == "repaired"
    assert rep["anomaly_detected"] is False
    assert rep["error_count"] == 0
    assert len(rep["events"]) > 0

    # Delta summary
    delta = data["delta_summary"]
    assert delta["errors_prevented"] == 27
    assert delta["financial_exposure_prevented_usd"] == 1240.00
    assert delta["anomalies_eliminated"] is True


@pytest.mark.asyncio
async def test_time_machine_not_found(client: AsyncClient):
    resp = await client.get("/api/v1/time-machine/compare/rel-non-existent")
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_investigation_endpoint(client: AsyncClient):
    resp = await client.get("/api/v1/investigation/rel-2026-001")
    assert resp.status_code == 200
    data = resp.json()
    assert data["release_id"] == "rel-2026-001"
    assert len(data["suspected_components"]) > 0
    assert len(data["graph"]["nodes"]) >= 4
    assert len(data["graph"]["edges"]) >= 3
    assert len(data["evidence_items"]) >= 2


@pytest.mark.asyncio
async def test_agent_activity_endpoint(client: AsyncClient):
    resp = await client.get("/api/v1/agent-activity")
    assert resp.status_code == 200
    data = resp.json()
    assert "duo_connected" in data
    assert "connection_message" in data
    assert len(data["sessions"]) >= 2

    # Test trigger agent
    trigger_payload = {
        "release_id": "rel-2026-001",
        "goal": "Verify idempotency barrier in sandbox test",
        "agent_role": "consequence_auditor",
    }
    trigger_resp = await client.post("/api/v1/agent-activity/trigger", json=trigger_payload)
    assert trigger_resp.status_code == 200
    triggered = trigger_resp.json()
    assert triggered["release_id"] == "rel-2026-001"
    assert triggered["status"] == "completed"


@pytest.mark.asyncio
async def test_release_control_and_approval(client: AsyncClient):
    # Fetch initial status
    resp = await client.get("/api/v1/release-control/rel-2026-001")
    assert resp.status_code == 200
    data = resp.json()
    assert data["release_id"] == "rel-2026-001"
    assert len(data["gates"]) == 4
    assert data["gates_passed"] == 3
    assert data["can_promote"] is False  # Gate 4 pending human signoff

    # Perform sign-off on human gate (gate-004)
    action_payload = {
        "status": "approved",
        "approver_name": "Darlen Atumanyire",
        "approver_email": "darlen@aftermath.dev",
        "reason": "Empirical evidence in exp-rep-001 demonstrates complete mitigation of double-debit vulnerability.",
    }
    gate_resp = await client.post("/api/v1/release-control/rel-2026-001/gates/gate-004/action", json=action_payload)
    assert gate_resp.status_code == 200
    gate_data = gate_resp.json()
    assert gate_data["status"] == "approved"
    assert gate_data["approver_name"] == "Darlen Atumanyire"

    # Re-fetch release control status: all gates passed, can promote
    resp_updated = await client.get("/api/v1/release-control/rel-2026-001")
    assert resp_updated.status_code == 200
    data_updated = resp_updated.json()
    assert data_updated["gates_passed"] == 4
    assert data_updated["can_promote"] is True
    assert data_updated["overall_status"] == "approved_for_staging"


@pytest.mark.asyncio
async def test_release_superposition_endpoint(client: AsyncClient):
    """Verifies Milestone 5 Release Superposition Multi-Scenario Matrix."""
    resp = await client.get("/api/v1/release-control/rel-2026-001/superposition")
    assert resp.status_code == 200
    data = resp.json()
    assert data["release_id"] == "rel-2026-001"
    assert data["recommendation"]["verdict"] == "CONDITIONAL_APPROVAL"
    assert len(data["scenario_matrix"]) == 5
    assert data["blast_radius_delta"]["financial_exposure_mitigated_usd"] == 1500.00

    # Verify first scenario in matrix
    s1 = data["scenario_matrix"][0]
    assert s1["scenario_id"] == "lost-response-retry"
    assert s1["vulnerable"]["verdict"] == "FAIL"
    assert s1["repaired"]["verdict"] == "PASS"
