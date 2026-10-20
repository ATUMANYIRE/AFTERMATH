"""
Tests for Isolated Synthetic Payment Service.
Verifies failure mode injection in vulnerable releases vs deduplication in repaired releases.
"""
import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_synthetic_payment_vulnerable_double_charge(client: AsyncClient):
    # First transaction with key idem_test_vuln_1
    req1 = {
        "customer_id": "cust_test_99",
        "amount_cents": 5000,
        "currency": "USD",
        "idempotency_key": "idem_test_vuln_1",
        "release_variant": "vulnerable",
    }
    resp1 = await client.post("/api/v1/synthetic-payment/execute", json=req1)
    assert resp1.status_code == 200
    d1 = resp1.json()
    assert d1["status"] == "settled"
    assert d1["is_duplicate"] is False
    assert d1["has_anomaly"] is False

    # Second transaction with identical key under vulnerable variant
    resp2 = await client.post("/api/v1/synthetic-payment/execute", json=req1)
    assert resp2.status_code == 200
    d2 = resp2.json()
    assert d2["status"] == "race_corrupted"
    assert d2["is_duplicate"] is True
    assert d2["has_anomaly"] is True
    assert "Double debit occurred" in d2["error_detail"]


@pytest.mark.asyncio
async def test_synthetic_payment_repaired_deduplication(client: AsyncClient):
    req_rep = {
        "customer_id": "cust_test_100",
        "amount_cents": 7500,
        "currency": "USD",
        "idempotency_key": "idem_test_rep_1",
        "release_variant": "repaired",
    }
    resp1 = await client.post("/api/v1/synthetic-payment/execute", json=req_rep)
    assert resp1.status_code == 200
    d1 = resp1.json()
    assert d1["status"] == "settled"
    assert d1["has_anomaly"] is False

    # Second transaction under repaired variant: safely deduped without anomaly
    resp2 = await client.post("/api/v1/synthetic-payment/execute", json=req_rep)
    assert resp2.status_code == 200
    d2 = resp2.json()
    assert d2["status"] == "duplicate_detected"
    assert d2["is_duplicate"] is True
    assert d2["has_anomaly"] is False


@pytest.mark.asyncio
async def test_synthetic_payment_stats(client: AsyncClient):
    resp = await client.get("/api/v1/synthetic-payment/stats")
    assert resp.status_code == 200
    data = resp.json()
    assert "total_transactions" in data
    assert "status_breakdown" in data
