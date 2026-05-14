import time
from decimal import Decimal

from fastapi.testclient import TestClient

from app.utils.cache import InMemoryCache, cache


def test_in_memory_cache_set_get() -> None:
    backend = InMemoryCache()
    backend.set("key", {"value": 1}, ttl_seconds=60)
    assert backend.get("key") == {"value": 1}


def test_in_memory_cache_expires() -> None:
    backend = InMemoryCache()
    backend.set("key", "x", ttl_seconds=0)
    time.sleep(0.01)
    assert backend.get("key") is None


def test_in_memory_cache_delete_clear() -> None:
    backend = InMemoryCache()
    backend.set("a", 1, ttl_seconds=60)
    backend.set("b", 2, ttl_seconds=60)
    backend.delete("a")
    assert backend.get("a") is None
    assert backend.get("b") == 2
    backend.clear()
    assert backend.get("b") is None


def test_past_month_summary_is_cached(
    client: TestClient, auth_headers: dict
) -> None:
    response = client.get(
        "/financial/month-summary",
        params={"year": 2020, "month": 1},
        headers=auth_headers,
    )
    assert response.status_code == 200
    cached_value = cache().get("month_summary:1:2020-01")
    assert cached_value is not None
    assert Decimal(cached_value["salary"]) == Decimal("5000.00")


def test_current_month_summary_is_not_cached(
    client: TestClient, auth_headers: dict
) -> None:
    from datetime import UTC, datetime

    now = datetime.now(UTC)
    response = client.get(
        "/financial/month-summary",
        params={"year": now.year, "month": now.month},
        headers=auth_headers,
    )
    assert response.status_code == 200
    assert cache().get(f"month_summary:1:{now.year:04d}-{now.month:02d}") is None
