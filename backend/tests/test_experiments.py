"""
Automated unit, integration, and invariant tests for the Executable Experiment Engine.
Proves:
1. The vulnerable version produces duplicate charges under reproducible scenarios.
2. The repaired version does NOT produce duplicate charges under identical conditions.
3. Distinct legitimate purchases are never suppressed.
4. Experiment results are persisted with reproducible PRNG seeds.
5. Invariant assertions strictly evaluate PASS vs FAIL.
"""
import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_vulnerable_experiment_violates_invariant(client: AsyncClient):
    """
    Proves: Vulnerable implementation violates the invariant:
    ONE LOGICAL PURCHASE MUST NOT PRODUCE MULTIPLE CHARGES.
    """
    payload = {
        "release_id": "rel-2026-001",
        "variant": "vulnerable",
        "scenario": {
            "scenario_id": "lost-response-retry",
            "concurrency": 5,
            "retry_count": 2,
            "delay_ms": 50,
            "failure_rate": 0.2,
            "order_count": 10,
            "seed": 1337,
        },
    }
    resp = await client.post("/api/v1/experiments/run", json=payload)
    assert resp.status_code == 200
    data = resp.json()

    assert data["variant"] == "vulnerable"
    assert data["invariant_status"] == "FAIL"
    assert data["anomaly_detected"] is True
    assert data["error_count"] > 0
    assert "INVARIANT VIOLATED" in data["invariant_verdict"]

    # Verify ledger summary shows duplicate exposure
    ledger = data["ledger_summary"]
    assert ledger is not None
    assert ledger["orders_violating_invariant"] > 0
    assert ledger["financial_exposure_usd"] > 0

    # Verify events and evidence exist
    assert len(data["events"]) > 0
    assert len(data["evidences"]) > 0
    assert any(e["level"] == "critical" for e in data["events"])


@pytest.mark.asyncio
async def test_repaired_experiment_preserves_invariant(client: AsyncClient):
    """
    Proves: Repaired implementation with durable idempotency preserves the invariant:
    ONE LOGICAL PURCHASE MUST NOT PRODUCE MULTIPLE CHARGES.
    """
    payload = {
        "release_id": "rel-2026-001",
        "variant": "repaired",
        "scenario": {
            "scenario_id": "lost-response-retry",
            "concurrency": 5,
            "retry_count": 2,
            "delay_ms": 50,
            "failure_rate": 0.2,
            "order_count": 10,
            "seed": 1337,  # Identical seed as vulnerable test
        },
    }
    resp = await client.post("/api/v1/experiments/run", json=payload)
    assert resp.status_code == 200
    data = resp.json()

    assert data["variant"] == "repaired"
    assert data["invariant_status"] == "PASS"
    assert data["anomaly_detected"] is False
    assert data["error_count"] == 0
    assert "INVARIANT PRESERVED" in data["invariant_verdict"]

    # Verify ledger summary shows 0 financial exposure
    ledger = data["ledger_summary"]
    assert ledger is not None
    assert ledger["orders_violating_invariant"] == 0
    assert ledger["financial_exposure_usd"] == 0.0

    # Verify deduplication events occurred
    assert any(e["event_type"] == "retry_deduplicated" for e in data["events"])


@pytest.mark.asyncio
async def test_paired_experiment_run(client: AsyncClient):
    """
    Tests POST /api/v1/experiments/run-pair executing both variants side-by-side.
    """
    payload = {
        "release_id": "rel-2026-001",
        "scenario": {
            "scenario_id": "concurrent-checkouts",
            "concurrency": 4,
            "retry_count": 1,
            "delay_ms": 40,
            "failure_rate": 0.1,
            "order_count": 8,
            "seed": 999,
        },
    }
    resp = await client.post("/api/v1/experiments/run-pair", json=payload)
    assert resp.status_code == 200
    data = resp.json()

    vuln = data["vulnerable_experiment"]
    rep = data["repaired_experiment"]
    delta = data["delta_summary"]

    assert vuln["variant"] == "vulnerable"
    assert rep["variant"] == "repaired"
    assert vuln["invariant_status"] == "FAIL"
    assert rep["invariant_status"] == "PASS"
    assert delta["anomalies_eliminated"] is True
    assert delta["errors_prevented"] > 0
    assert delta["reproducibility_seed"] == 999


@pytest.mark.asyncio
async def test_direct_api_route(client: AsyncClient):
    """
    Tests direct conformance with POST /api/experiments/run (without /v1 prefix).
    """
    payload = {
        "release_id": "rel-2026-001",
        "variant": "repaired",
        "scenario": {
            "scenario_id": "delayed-db-commit",
            "concurrency": 2,
            "retry_count": 1,
            "delay_ms": 100,
            "failure_rate": 0.0,
            "order_count": 5,
            "seed": 42,
        },
    }
    resp = await client.post("/api/experiments/run", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert data["scenario_id"] == "delayed-db-commit"
    assert data["invariant_status"] == "PASS"


@pytest.mark.asyncio
async def test_experiment_subresources(client: AsyncClient):
    """
    Tests fetching subresources: /{id}, /{id}/events, /{id}/evidence, /{id}/ledger, /{id}/comparison.
    """
    # 1. Run an experiment
    payload = {
        "release_id": "rel-2026-001",
        "variant": "vulnerable",
        "scenario": {
            "scenario_id": "duplicate-idempotency-keys",
            "concurrency": 3,
            "retry_count": 2,
            "delay_ms": 30,
            "failure_rate": 0.0,
            "order_count": 6,
            "seed": 777,
        },
    }
    run_resp = await client.post("/api/v1/experiments/run", json=payload)
    exp_id = run_resp.json()["id"]

    # 2. GET /{id}
    get_resp = await client.get(f"/api/v1/experiments/{exp_id}")
    assert get_resp.status_code == 200
    assert get_resp.json()["id"] == exp_id

    # 3. GET /{id}/events
    events_resp = await client.get(f"/api/v1/experiments/{exp_id}/events")
    assert events_resp.status_code == 200
    events = events_resp.json()
    assert len(events) >= 6
    # Assert events are chronologically sorted
    offsets = [e["timestamp_offset_ms"] for e in events]
    assert offsets == sorted(offsets)

    # 4. GET /{id}/evidence
    evi_resp = await client.get(f"/api/v1/experiments/{exp_id}/evidence")
    assert evi_resp.status_code == 200
    evidences = evi_resp.json()
    assert len(evidences) > 0

    # 5. GET /{id}/ledger (actual persisted transactions)
    ledger_resp = await client.get(f"/api/v1/experiments/{exp_id}/ledger")
    assert ledger_resp.status_code == 200
    txns = ledger_resp.json()
    assert len(txns) > 0
    assert all(t["experiment_id"] == exp_id for t in txns)


@pytest.mark.asyncio
async def test_distinct_legitimate_purchases_not_suppressed(client: AsyncClient):
    """
    Property test: Proves repaired variant does NOT accidentally suppress distinct purchases.
    Two distinct orders with different idempotency keys must both settle successfully.
    """
    payload = {
        "release_id": "rel-2026-001",
        "variant": "repaired",
        "scenario": {
            "scenario_id": "concurrent-checkouts",
            "concurrency": 2,
            "retry_count": 0,
            "delay_ms": 10,
            "failure_rate": 0.0,
            "order_count": 15,
            "seed": 101,
        },
    }
    resp = await client.post("/api/v1/experiments/run", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert data["invariant_status"] == "PASS"
    assert data["transaction_count"] == 30  # 15 orders * 2 concurrent attempts
    assert data["error_count"] == 0
    # Every single one of the 15 distinct orders was settled
    ledger = data["ledger_summary"]
    assert ledger["total_orders_processed"] == 15
    assert ledger["orders_violating_invariant"] == 0
