"""Rate limiting wired through slowapi.

Limits are configurable via environment variables:
- RATE_LIMIT_DEFAULT  — global default applied to every route (e.g. "120/minute")
- RATE_LIMIT_AUTH     — applied via `auth_limit` decorator on /auth routes
- RATE_LIMIT_WRITE    — applied via `write_limit` decorator on POST/PUT/DELETE
- RATE_LIMIT_ENABLED  — set to false to disable in tests/local
"""
from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse
from slowapi import Limiter
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from slowapi.util import get_remote_address

from app.core.config import settings


def _key_func(request: Request) -> str:
    """Per-IP key. If a trusted reverse proxy sets X-Forwarded-For we honor it."""
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return get_remote_address(request)


limiter = Limiter(
    key_func=_key_func,
    default_limits=[settings.rate_limit_default] if settings.rate_limit_enabled else [],
    enabled=settings.rate_limit_enabled,
)


def auth_limit():
    """Decorator factory for auth endpoints (login, register)."""
    return limiter.limit(settings.rate_limit_auth)


def write_limit():
    """Decorator factory for write-heavy endpoints."""
    return limiter.limit(settings.rate_limit_write)


def _rate_limit_handler(request: Request, exc: RateLimitExceeded) -> JSONResponse:
    return JSONResponse(
        status_code=status.HTTP_429_TOO_MANY_REQUESTS,
        content={
            "error": {
                "message": "Rate limit exceeded. Please try again later.",
                "details": str(exc.detail),
            }
        },
        headers={"Retry-After": "60"},
    )


def install_rate_limiting(app: FastAPI) -> None:
    app.state.limiter = limiter
    app.add_exception_handler(RateLimitExceeded, _rate_limit_handler)
    app.add_middleware(SlowAPIMiddleware)
