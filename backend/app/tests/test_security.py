from datetime import UTC, datetime, timedelta

import pytest
from fastapi.testclient import TestClient
from jose import jwt

from app.auth.jwt_handler import JWTError_, decode_access_token
from app.core.config import Settings, settings


def test_jwt_rejects_alg_none(client: TestClient) -> None:
    # Hand-craft an unsigned token (header={"alg":"none","typ":"JWT"}, no signature).
    # This bypasses python-jose's encode-side block on alg=none and proves
    # decode_access_token rejects it via its `algorithms=[...]` pin.
    import base64
    import json

    def b64(data: bytes) -> str:
        return base64.urlsafe_b64encode(data).rstrip(b"=").decode()

    header = b64(json.dumps({"alg": "none", "typ": "JWT"}).encode())
    payload = b64(
        json.dumps(
            {
                "sub": "1",
                "exp": int((datetime.now(UTC) + timedelta(minutes=5)).timestamp()),
                "type": "access",
            }
        ).encode()
    )
    forged = f"{header}.{payload}."
    headers = {"Authorization": f"Bearer {forged}"}
    assert client.get("/users/me", headers=headers).status_code == 401


def test_jwt_rejects_wrong_secret() -> None:
    payload = {
        "sub": "1",
        "exp": int((datetime.now(UTC) + timedelta(minutes=5)).timestamp()),
        "type": "access",
    }
    token = jwt.encode(payload, "different-secret-totally", algorithm="HS256")
    with pytest.raises(JWTError_):
        decode_access_token(token)


def test_jwt_rejects_expired_token() -> None:
    payload = {
        "sub": "1",
        "exp": int((datetime.now(UTC) - timedelta(minutes=1)).timestamp()),
        "type": "access",
    }
    token = jwt.encode(
        payload, settings.jwt_secret_key, algorithm=settings.jwt_algorithm
    )
    with pytest.raises(JWTError_):
        decode_access_token(token)


def test_jwt_rejects_missing_required_claims() -> None:
    token = jwt.encode(
        {"sub": "1", "type": "access"},  # no exp
        settings.jwt_secret_key,
        algorithm=settings.jwt_algorithm,
    )
    with pytest.raises(JWTError_):
        decode_access_token(token)


def test_jwt_rejects_wrong_token_type() -> None:
    payload = {
        "sub": "1",
        "exp": int((datetime.now(UTC) + timedelta(minutes=5)).timestamp()),
        "type": "refresh",
    }
    token = jwt.encode(
        payload, settings.jwt_secret_key, algorithm=settings.jwt_algorithm
    )
    with pytest.raises(JWTError_):
        decode_access_token(token)


def test_settings_blocks_insecure_production_secret() -> None:
    with pytest.raises(ValueError, match="JWT_SECRET_KEY"):
        Settings(
            app_env="production",
            jwt_secret_key="change-me",
            cors_origins="https://example.com",
        )


def test_settings_blocks_short_production_secret() -> None:
    with pytest.raises(ValueError, match="32 characters"):
        Settings(
            app_env="production",
            jwt_secret_key="short",
            cors_origins="https://example.com",
        )


def test_settings_blocks_wildcard_cors_in_production() -> None:
    with pytest.raises(ValueError, match="CORS_ORIGINS"):
        Settings(
            app_env="production",
            jwt_secret_key="x" * 64,
            cors_origins="*",
            debug=False,
        )


def test_settings_blocks_debug_in_production() -> None:
    with pytest.raises(ValueError, match="DEBUG"):
        Settings(
            app_env="production",
            jwt_secret_key="x" * 64,
            cors_origins="https://example.com",
            debug=True,
        )


def test_settings_rejects_unknown_jwt_algorithm() -> None:
    with pytest.raises(ValueError, match="jwt_algorithm"):
        Settings(jwt_algorithm="none")
