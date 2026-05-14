from datetime import UTC, datetime, timedelta

from jose import JWTError, jwt

from app.core.config import settings


class JWTError_(Exception):
    """Application-level JWT error so callers don't depend on python-jose."""


def create_access_token(
    subject: str | int, expires_minutes: int | None = None
) -> str:
    expire_minutes = expires_minutes or settings.jwt_expire_minutes
    now = datetime.now(UTC)
    expire = now + timedelta(minutes=expire_minutes)
    payload = {
        "sub": str(subject),
        "iat": int(now.timestamp()),
        "exp": int(expire.timestamp()),
        "type": "access",
    }
    return jwt.encode(
        payload, settings.jwt_secret_key, algorithm=settings.jwt_algorithm
    )


def decode_access_token(token: str) -> dict:
    try:
        payload = jwt.decode(
            token,
            settings.jwt_secret_key,
            # Pin to the configured algorithm only — defense in depth against
            # algorithm-confusion attacks (e.g. forged "alg=none" tokens).
            algorithms=[settings.jwt_algorithm],
        )
    except JWTError as exc:
        raise JWTError_(str(exc)) from exc

    # Manual claim presence check — python-jose's `options.require` only
    # validates claims it recognises, so we enforce ours explicitly.
    if "sub" not in payload or "exp" not in payload:
        raise JWTError_("Token is missing required claims")
    if payload.get("type") != "access":
        raise JWTError_("Invalid token type")
    return payload
