"""
Minimal access boundary for state-changing API operations.

This is NOT a user-authentication system. It only decides who may call POST/PUT/PATCH/DELETE:

* If WRITE_API_KEY is set, a request must send a matching `X-API-Key` header.
* If it is not set (local demo), only direct loopback clients are accepted. Requests that
  carry proxy-forwarding headers, or a browser `Origin` outside CORS_ORIGINS, are refused so a
  reverse proxy or a malicious web page cannot reach the API through localhost.

Read-only requests (GET/HEAD/OPTIONS) are not restricted. Do not expose this API publicly
without setting WRITE_API_KEY and putting it behind TLS and real authentication.
"""
import hmac
import ipaddress
import json
from typing import Optional

from app.config import settings

SAFE_METHODS = {"GET", "HEAD", "OPTIONS"}
FORWARD_HEADERS = {b"x-forwarded-for", b"forwarded", b"x-real-ip"}
LOOPBACK_NAMES = {"localhost", "testclient"}


def _is_loopback(host: Optional[str]) -> bool:
    if not host:
        return False
    if host in LOOPBACK_NAMES:
        return True
    try:
        return ipaddress.ip_address(host).is_loopback
    except ValueError:
        return False


class WriteAccessMiddleware:
    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        if scope["type"] != "http" or scope["method"] in SAFE_METHODS:
            return await self.app(scope, receive, send)

        headers = {k.lower(): v for k, v in scope.get("headers", [])}
        key = (settings.WRITE_API_KEY or "").strip()

        if key:
            supplied = headers.get(b"x-api-key", b"").decode("latin-1")
            if hmac.compare_digest(supplied.encode(), key.encode()):
                return await self.app(scope, receive, send)
            return await self._deny(send, 401, "A valid X-API-Key header is required for this operation.")

        client = scope.get("client")
        origin = headers.get(b"origin", b"").decode("latin-1")
        if (
            not _is_loopback(client[0] if client else None)
            or any(h in headers for h in FORWARD_HEADERS)
            or (origin and origin not in settings.CORS_ORIGINS)
        ):
            return await self._deny(
                send,
                403,
                "State-changing requests are limited to local callers. Set WRITE_API_KEY and send X-API-Key to allow others.",
            )
        return await self.app(scope, receive, send)

    @staticmethod
    async def _deny(send, status_code: int, detail: str):
        body = json.dumps({"detail": detail}).encode()
        await send(
            {
                "type": "http.response.start",
                "status": status_code,
                "headers": [(b"content-type", b"application/json"), (b"content-length", str(len(body)).encode())],
            }
        )
        await send({"type": "http.response.body", "body": body})
