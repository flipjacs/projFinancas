from collections.abc import Generator

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from app.database.base import Base
from app.database.session import get_db
from app.main import app
from app.middleware.rate_limit import limiter
from app.models import (  # noqa: F401  (register metadata)
    DisciplineMode,
    DistribuicaoFinanceira,
    Expense,
    Installment,
    ObjetivoFinanceiro,
    User,
)
from app.utils.cache import reset_cache_backend

# Anything not in this set is treated as a business endpoint and silently
# prefixed with /api/v1 so existing tests keep working after API versioning.
_UNPREFIXED_PATHS = ("/health", "/docs", "/redoc", "/openapi.json", "/api")


class _APITestClient(TestClient):
    """TestClient that auto-prefixes business endpoints with /api/v1."""

    def request(self, method, url, *args, **kwargs):
        if isinstance(url, str) and url.startswith("/") and not url.startswith(
            _UNPREFIXED_PATHS
        ):
            url = "/api/v1" + url
        return super().request(method, url, *args, **kwargs)


@pytest.fixture(autouse=True)
def _isolate_test_state() -> Generator[None, None, None]:
    """Reset cross-test state: disable rate limiting and clear cache."""
    limiter.enabled = False
    reset_cache_backend()
    yield
    limiter.reset()


@pytest.fixture()
def db_session() -> Generator[Session, None, None]:
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(bind=engine)
    TestingSessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)
        engine.dispose()


@pytest.fixture()
def client(db_session: Session) -> Generator[TestClient, None, None]:
    def _override_get_db() -> Generator[Session, None, None]:
        yield db_session

    app.dependency_overrides[get_db] = _override_get_db
    with _APITestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture()
def registered_user(client: TestClient) -> dict[str, str | float]:
    payload = {
        "name": "Test User",
        "email": "test@example.com",
        "password": "supersecret123",
        "monthly_salary": 5000.00,
    }
    response = client.post("/auth/register", json=payload)
    assert response.status_code == 201, response.text
    return payload


@pytest.fixture()
def auth_headers(client: TestClient, registered_user: dict[str, str | float]) -> dict[str, str]:
    response = client.post(
        "/auth/login",
        json={
            "email": registered_user["email"],
            "password": registered_user["password"],
        },
    )
    assert response.status_code == 200, response.text
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}
