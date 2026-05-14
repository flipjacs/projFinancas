"""Tiny TTL cache with Redis + in-memory backends.

Choosing Redis over the in-memory store is purely a matter of whether
`REDIS_URL` is set and reachable. If Redis pings fail at startup we silently
degrade to the in-memory backend so the app still boots in dev/test.

Values are JSON-serialized; keep payloads small and serialisable.
"""
import json
import logging
import threading
import time
from typing import Any, Callable, Protocol

from app.core.config import settings

logger = logging.getLogger(__name__)


class CacheBackend(Protocol):
    def get(self, key: str) -> Any | None: ...

    def set(self, key: str, value: Any, ttl_seconds: int) -> None: ...

    def delete(self, key: str) -> None: ...

    def clear(self) -> None: ...


class InMemoryCache:
    def __init__(self) -> None:
        self._store: dict[str, tuple[float, Any]] = {}
        self._lock = threading.Lock()

    def get(self, key: str) -> Any | None:
        with self._lock:
            entry = self._store.get(key)
            if entry is None:
                return None
            expires_at, value = entry
            if expires_at < time.monotonic():
                self._store.pop(key, None)
                return None
            return value

    def set(self, key: str, value: Any, ttl_seconds: int) -> None:
        with self._lock:
            self._store[key] = (time.monotonic() + ttl_seconds, value)

    def delete(self, key: str) -> None:
        with self._lock:
            self._store.pop(key, None)

    def clear(self) -> None:
        with self._lock:
            self._store.clear()


class RedisCache:
    def __init__(self, url: str) -> None:
        # Imported lazily so the dependency isn't required when REDIS_URL is unset.
        import redis  # type: ignore[import-untyped]

        self._client = redis.Redis.from_url(url, decode_responses=True)
        self._client.ping()  # raises if Redis is unreachable

    def get(self, key: str) -> Any | None:
        raw = self._client.get(key)
        if raw is None:
            return None
        try:
            return json.loads(raw)
        except json.JSONDecodeError:
            return None

    def set(self, key: str, value: Any, ttl_seconds: int) -> None:
        self._client.setex(key, ttl_seconds, json.dumps(value, default=str))

    def delete(self, key: str) -> None:
        self._client.delete(key)

    def clear(self) -> None:
        self._client.flushdb()


def _build_backend() -> CacheBackend:
    if settings.redis_url:
        try:
            backend = RedisCache(settings.redis_url)
            logger.info("cache backend=redis")
            return backend
        except Exception as exc:  # pragma: no cover — environment dependent
            logger.warning(
                "Redis unavailable (%s); falling back to in-memory cache", exc
            )
    logger.info("cache backend=in-memory")
    return InMemoryCache()


_backend: CacheBackend = _build_backend()


def cache() -> CacheBackend:
    return _backend


def reset_cache_backend(backend: CacheBackend | None = None) -> None:
    """Test hook: replace the singleton backend."""
    global _backend
    _backend = backend or InMemoryCache()


def cached(key_fn: Callable[..., str], ttl: int | None = None):
    """
    Decorator that caches the return value of a function under the key
    produced by `key_fn(*args, **kwargs)`. TTL defaults to the configured
    `cache_default_ttl_seconds`.
    """
    effective_ttl = ttl if ttl is not None else settings.cache_default_ttl_seconds

    def wrapper(fn):
        def inner(*args, **kwargs):
            key = key_fn(*args, **kwargs)
            hit = _backend.get(key)
            if hit is not None:
                return hit
            value = fn(*args, **kwargs)
            _backend.set(key, value, effective_ttl)
            return value

        inner.__wrapped__ = fn  # type: ignore[attr-defined]
        return inner

    return wrapper
