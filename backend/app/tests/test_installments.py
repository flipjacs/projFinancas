from datetime import date

from fastapi.testclient import TestClient


def _create_installment(client: TestClient, headers: dict, **overrides) -> dict:
    payload = {
        "product_name": "Laptop",
        "total_amount": 3000.00,
        "installment_value": 250.00,
        "total_installments": 12,
        "purchase_date": str(date(2026, 1, 15)),
    }
    payload.update(overrides)
    response = client.post("/installments", json=payload, headers=headers)
    assert response.status_code == 201, response.text
    return response.json()


def test_create_installment_defaults_remaining(
    client: TestClient, auth_headers: dict
) -> None:
    item = _create_installment(client, auth_headers)
    assert item["product_name"] == "Laptop"
    assert item["total_installments"] == 12
    assert item["remaining_installments"] == 12
    assert float(item["installment_value"]) == 250.00


def test_create_installment_with_explicit_remaining(
    client: TestClient, auth_headers: dict
) -> None:
    item = _create_installment(client, auth_headers, remaining_installments=4)
    assert item["remaining_installments"] == 4


def test_list_installments(client: TestClient, auth_headers: dict) -> None:
    _create_installment(client, auth_headers, product_name="Laptop")
    _create_installment(client, auth_headers, product_name="Phone", installment_value=100)
    response = client.get("/installments", headers=auth_headers)
    assert response.status_code == 200
    assert len(response.json()) == 2


def test_list_installments_active_only(client: TestClient, auth_headers: dict) -> None:
    _create_installment(client, auth_headers, product_name="Active")
    _create_installment(
        client, auth_headers, product_name="Paid", remaining_installments=0
    )
    response = client.get(
        "/installments", params={"active_only": True}, headers=auth_headers
    )
    assert response.status_code == 200
    items = response.json()
    assert len(items) == 1
    assert items[0]["product_name"] == "Active"


def test_update_installment(client: TestClient, auth_headers: dict) -> None:
    item = _create_installment(client, auth_headers)
    response = client.put(
        f"/installments/{item['id']}",
        json={"remaining_installments": 8, "installment_value": 300.00},
        headers=auth_headers,
    )
    assert response.status_code == 200
    body = response.json()
    assert body["remaining_installments"] == 8
    assert float(body["installment_value"]) == 300.00


def test_delete_installment(client: TestClient, auth_headers: dict) -> None:
    item = _create_installment(client, auth_headers)
    response = client.delete(f"/installments/{item['id']}", headers=auth_headers)
    assert response.status_code == 204
    assert (
        client.get(f"/installments/{item['id']}", headers=auth_headers).status_code
        == 404
    )


def test_cannot_access_other_users_installment(
    client: TestClient, auth_headers: dict
) -> None:
    item = _create_installment(client, auth_headers)
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
        client.get(f"/installments/{item['id']}", headers=other_headers).status_code
        == 404
    )


def test_negative_total_amount_rejected(
    client: TestClient, auth_headers: dict
) -> None:
    response = client.post(
        "/installments",
        json={
            "product_name": "Bad",
            "total_amount": -100,
            "installment_value": 50,
            "total_installments": 2,
            "purchase_date": str(date(2026, 1, 1)),
        },
        headers=auth_headers,
    )
    assert response.status_code == 422


def test_zero_installment_value_rejected(
    client: TestClient, auth_headers: dict
) -> None:
    response = client.post(
        "/installments",
        json={
            "product_name": "Bad",
            "total_amount": 100,
            "installment_value": 0,
            "total_installments": 2,
            "purchase_date": str(date(2026, 1, 1)),
        },
        headers=auth_headers,
    )
    assert response.status_code == 422


def test_zero_total_installments_rejected(
    client: TestClient, auth_headers: dict
) -> None:
    response = client.post(
        "/installments",
        json={
            "product_name": "Bad",
            "total_amount": 100,
            "installment_value": 50,
            "total_installments": 0,
            "purchase_date": str(date(2026, 1, 1)),
        },
        headers=auth_headers,
    )
    assert response.status_code == 422


def test_remaining_exceeds_total_rejected_on_create(
    client: TestClient, auth_headers: dict
) -> None:
    response = client.post(
        "/installments",
        json={
            "product_name": "Bad",
            "total_amount": 1200,
            "installment_value": 100,
            "total_installments": 12,
            "remaining_installments": 20,
            "purchase_date": str(date(2026, 1, 1)),
        },
        headers=auth_headers,
    )
    assert response.status_code == 422


def test_remaining_exceeds_total_rejected_on_update(
    client: TestClient, auth_headers: dict
) -> None:
    item = _create_installment(client, auth_headers, total_installments=10)
    response = client.put(
        f"/installments/{item['id']}",
        json={"remaining_installments": 99},
        headers=auth_headers,
    )
    assert response.status_code == 422
