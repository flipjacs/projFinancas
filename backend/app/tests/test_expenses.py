from fastapi.testclient import TestClient


def _create_expense(client: TestClient, headers: dict, **overrides) -> dict:
    payload = {
        "title": "Groceries",
        "amount": 150.00,
        "category": "food",
        "recurring": False,
    }
    payload.update(overrides)
    response = client.post("/expenses", json=payload, headers=headers)
    assert response.status_code == 201, response.text
    return response.json()


def test_create_expense(client: TestClient, auth_headers: dict) -> None:
    expense = _create_expense(client, auth_headers)
    assert expense["title"] == "Groceries"
    assert float(expense["amount"]) == 150.00
    assert expense["category"] == "food"
    assert expense["recurring"] is False


def test_list_expenses(client: TestClient, auth_headers: dict) -> None:
    _create_expense(client, auth_headers, title="Rent", amount=1500, category="housing")
    _create_expense(client, auth_headers, title="Bus", amount=80, category="transport")
    response = client.get("/expenses", headers=auth_headers)
    assert response.status_code == 200
    items = response.json()
    assert len(items) == 2


def test_update_expense(client: TestClient, auth_headers: dict) -> None:
    expense = _create_expense(client, auth_headers)
    response = client.patch(
        f"/expenses/{expense['id']}",
        json={"amount": 200.00, "recurring": True},
        headers=auth_headers,
    )
    assert response.status_code == 200
    body = response.json()
    assert float(body["amount"]) == 200.00
    assert body["recurring"] is True


def test_delete_expense(client: TestClient, auth_headers: dict) -> None:
    expense = _create_expense(client, auth_headers)
    response = client.delete(f"/expenses/{expense['id']}", headers=auth_headers)
    assert response.status_code == 204
    assert client.get(f"/expenses/{expense['id']}", headers=auth_headers).status_code == 404


def test_cannot_access_other_users_expense(client: TestClient, auth_headers: dict) -> None:
    expense = _create_expense(client, auth_headers)

    other = {
        "name": "Other",
        "email": "other@example.com",
        "password": "anotherpass1",
        "monthly_salary": 1000,
    }
    assert client.post("/auth/register", json=other).status_code == 201
    token = client.post(
        "/auth/login",
        json={"email": other["email"], "password": other["password"]},
    ).json()["access_token"]
    other_headers = {"Authorization": f"Bearer {token}"}

    assert (
        client.get(f"/expenses/{expense['id']}", headers=other_headers).status_code == 404
    )


def test_invalid_category_rejected(client: TestClient, auth_headers: dict) -> None:
    response = client.post(
        "/expenses",
        json={
            "title": "Bad",
            "amount": 10,
            "category": "not-a-category",
            "recurring": False,
        },
        headers=auth_headers,
    )
    assert response.status_code == 422


def test_balance_endpoint(client: TestClient, auth_headers: dict) -> None:
    _create_expense(client, auth_headers, amount=100)
    _create_expense(client, auth_headers, amount=50, category="transport")
    response = client.get("/balance", headers=auth_headers)
    assert response.status_code == 200
    body = response.json()
    assert float(body["salary"]) == 5000.00
    assert float(body["total_expenses_this_month"]) == 150.00
    assert float(body["remaining_balance"]) == 4850.00


def test_monthly_summary_groups_by_category(client: TestClient, auth_headers: dict) -> None:
    _create_expense(client, auth_headers, amount=100, category="food")
    _create_expense(client, auth_headers, amount=50, category="food")
    _create_expense(client, auth_headers, amount=200, category="housing")
    response = client.get("/balance/monthly", headers=auth_headers)
    assert response.status_code == 200
    body = response.json()
    assert body["expense_count"] == 3
    by_cat = {row["category"]: float(row["total"]) for row in body["by_category"]}
    assert by_cat["food"] == 150.00
    assert by_cat["housing"] == 200.00
