from fastapi.testclient import TestClient


def test_register_creates_user(client: TestClient) -> None:
    response = client.post(
        "/auth/register",
        json={
            "name": "Alice",
            "email": "alice@example.com",
            "password": "strongpass1",
            "monthly_salary": 4200.50,
        },
    )
    assert response.status_code == 201
    body = response.json()
    assert body["email"] == "alice@example.com"
    assert body["name"] == "Alice"
    assert "id" in body
    assert "hashed_password" not in body


def test_register_duplicate_email_rejected(client: TestClient) -> None:
    payload = {
        "name": "Bob",
        "email": "bob@example.com",
        "password": "strongpass1",
        "monthly_salary": 1000,
    }
    assert client.post("/auth/register", json=payload).status_code == 201
    response = client.post("/auth/register", json=payload)
    assert response.status_code == 409


def test_login_returns_token(client: TestClient, registered_user: dict) -> None:
    response = client.post(
        "/auth/login",
        json={
            "email": registered_user["email"],
            "password": registered_user["password"],
        },
    )
    assert response.status_code == 200
    body = response.json()
    assert body["token_type"] == "bearer"
    assert body["access_token"]


def test_login_wrong_password(client: TestClient, registered_user: dict) -> None:
    response = client.post(
        "/auth/login",
        json={"email": registered_user["email"], "password": "wrongpassword"},
    )
    assert response.status_code == 401


def test_protected_route_requires_token(client: TestClient) -> None:
    assert client.get("/users/me").status_code == 401


def test_protected_route_with_token(client: TestClient, auth_headers: dict) -> None:
    response = client.get("/users/me", headers=auth_headers)
    assert response.status_code == 200
    assert response.json()["email"] == "test@example.com"
