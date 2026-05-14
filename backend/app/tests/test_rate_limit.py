from fastapi import Request
from fastapi.testclient import TestClient

from app.main import app
from app.middleware.rate_limit import limiter


def _register_probe(path: str, rate: str):
    @app.get(path, include_in_schema=False)
    @limiter.limit(rate)
    def _probe(request: Request):  # pragma: no cover — driven by client below
        return {"ok": True}

    return _probe


def _unregister_probe(path: str) -> None:
    app.router.routes = [
        r for r in app.router.routes if getattr(r, "path", "") != path
    ]


def test_rate_limit_returns_429_when_exceeded(client: TestClient) -> None:
    # Path begins with /api so the conftest prefix wrapper leaves it alone.
    path = "/api/__rate_limit_probe"
    _register_probe(path, "3/minute")
    limiter.enabled = True
    limiter.reset()
    try:
        statuses = [client.get(path).status_code for _ in range(6)]
    finally:
        limiter.enabled = False
        limiter.reset()
        _unregister_probe(path)

    assert statuses[:3] == [200, 200, 200]
    assert 429 in statuses[3:]


def test_rate_limit_429_response_shape(client: TestClient) -> None:
    path = "/api/__rate_limit_probe2"
    _register_probe(path, "1/minute")
    limiter.enabled = True
    limiter.reset()
    try:
        client.get(path)
        blocked = client.get(path)
    finally:
        limiter.enabled = False
        limiter.reset()
        _unregister_probe(path)

    assert blocked.status_code == 429
    assert blocked.headers.get("Retry-After") == "60"
    assert "Rate limit exceeded" in blocked.json()["error"]["message"]


def test_request_id_header_present(client: TestClient) -> None:
    response = client.get("/health")
    assert response.headers.get("X-Request-ID")


def test_request_id_propagates_when_supplied(client: TestClient) -> None:
    response = client.get("/health", headers={"X-Request-ID": "abc-123"})
    assert response.headers.get("X-Request-ID") == "abc-123"
