"""
Access boundary for state-changing endpoints (see app/security.py).
"""
import pytest
from httpx import AsyncClient, ASGITransport

from app.config import settings
from app.main import app

APPROVE = "/api/v1/remediations/workflows/does-not-exist/approve"
BODY = {"approver_name": "Test Approver", "approver_email": "qa@example.com"}


def make_client(host: str = "127.0.0.1"):
    return AsyncClient(transport=ASGITransport(app=app, client=(host, 5000)), base_url="http://testserver")


@pytest.fixture(autouse=True)
def _isolated(monkeypatch, test_db):
    """No API key by default, and every request hits the in-memory test DB, never the real one."""
    from app.database import get_db

    async def override_get_db():
        yield test_db

    monkeypatch.setattr(settings, "WRITE_API_KEY", "")
    app.dependency_overrides[get_db] = override_get_db
    yield
    app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_loopback_write_allowed_without_key(client):
    # Reaches the route (404 for the unknown workflow), proving the guard let it through.
    r = await client.post(APPROVE, json=BODY)
    assert r.status_code == 404


@pytest.mark.asyncio
async def test_remote_write_denied_without_key():
    async with make_client("203.0.113.9") as c:
        for path in [APPROVE, "/api/v1/experiments/run-pair", "/api/experiments/run-pair", "/api/v1/remediations/trigger"]:
            r = await c.post(path, json=BODY)
            assert r.status_code == 403, path


@pytest.mark.asyncio
async def test_forwarded_requests_denied_without_key():
    async with make_client() as c:
        r = await c.post(APPROVE, json=BODY, headers={"X-Forwarded-For": "198.51.100.4"})
        assert r.status_code == 403


@pytest.mark.asyncio
async def test_foreign_browser_origin_denied():
    async with make_client() as c:
        r = await c.post(APPROVE, json=BODY, headers={"Origin": "https://evil.example"})
        assert r.status_code == 403
        r = await c.post(APPROVE, json=BODY, headers={"Origin": settings.CORS_ORIGINS[0]})
        assert r.status_code != 403


@pytest.mark.asyncio
async def test_reads_are_not_restricted():
    async with make_client("203.0.113.9") as c:
        r = await c.get("/healthz")
        assert r.status_code == 200


@pytest.mark.asyncio
async def test_api_key_required_when_configured(monkeypatch):
    monkeypatch.setattr(settings, "WRITE_API_KEY", "s3cret-test-key")
    async with make_client("203.0.113.9") as c:
        assert (await c.post(APPROVE, json=BODY)).status_code == 401
        assert (await c.post(APPROVE, json=BODY, headers={"X-API-Key": "wrong"})).status_code == 401
        ok = await c.post(APPROVE, json=BODY, headers={"X-API-Key": "s3cret-test-key"})
        assert ok.status_code != 401 and ok.status_code != 403
    # Loopback callers need the key too once one is configured.
    async with make_client() as c:
        assert (await c.post(APPROVE, json=BODY)).status_code == 401
