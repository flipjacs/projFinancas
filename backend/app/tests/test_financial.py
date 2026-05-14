from datetime import date
from decimal import Decimal

from fastapi.testclient import TestClient

from app.models.installment import Installment
from app.services.financial_calculations import (
    committed_percentage,
    monthly_installment_commitment,
    projected_commitment_at,
    remaining_salary,
)


def _make(remaining: int, value: str) -> Installment:
    return Installment(
        user_id=1,
        product_name="X",
        total_amount=Decimal("1000"),
        installment_value=Decimal(value),
        total_installments=12,
        remaining_installments=remaining,
        purchase_date=date(2026, 1, 1),
    )


def test_monthly_commitment_sums_only_active() -> None:
    items = [_make(5, "100.00"), _make(0, "50.00"), _make(3, "25.50")]
    assert monthly_installment_commitment(items) == Decimal("125.50")


def test_remaining_salary_subtracts_committed() -> None:
    assert remaining_salary(Decimal("5000"), Decimal("1500")) == Decimal("3500")


def test_committed_percentage_zero_salary_returns_zero() -> None:
    assert committed_percentage(Decimal("100"), Decimal("0")) == Decimal("0")


def test_committed_percentage_rounds_to_two_decimals() -> None:
    assert committed_percentage(Decimal("1500"), Decimal("5000")) == Decimal("30.00")
    assert committed_percentage(Decimal("1234.56"), Decimal("5000")) == Decimal("24.69")


def test_projected_commitment_decays_over_time() -> None:
    items = [_make(3, "100"), _make(6, "200")]
    assert projected_commitment_at(items, 0) == (Decimal("300"), 2)
    assert projected_commitment_at(items, 3) == (Decimal("200"), 1)
    assert projected_commitment_at(items, 6) == (Decimal("0"), 0)


def _post_installment(client: TestClient, headers: dict, **kwargs) -> dict:
    payload = {
        "product_name": "Item",
        "total_amount": 1200,
        "installment_value": 100,
        "total_installments": 12,
        "purchase_date": str(date(2026, 1, 15)),
    }
    payload.update(kwargs)
    response = client.post("/installments", json=payload, headers=headers)
    assert response.status_code == 201, response.text
    return response.json()


def _post_expense(client: TestClient, headers: dict, **kwargs) -> dict:
    payload = {
        "title": "T",
        "amount": 100,
        "category": "food",
        "recurring": False,
    }
    payload.update(kwargs)
    response = client.post("/expenses", json=payload, headers=headers)
    assert response.status_code == 201, response.text
    return response.json()


def test_month_summary_combines_expenses_and_installments(
    client: TestClient, auth_headers: dict
) -> None:
    _post_expense(client, auth_headers, amount=300)
    _post_installment(client, auth_headers, installment_value=200, total_installments=10)
    _post_installment(client, auth_headers, installment_value=150, total_installments=6)

    response = client.get("/financial/month-summary", headers=auth_headers)
    assert response.status_code == 200
    body = response.json()
    assert float(body["salary"]) == 5000.00
    assert float(body["total_expenses"]) == 300.00
    assert float(body["monthly_installment_commitment"]) == 350.00
    assert float(body["total_committed"]) == 650.00
    assert float(body["remaining_balance"]) == 4350.00
    assert body["active_installments"] == 2
    assert float(body["committed_percentage"]) == 13.00


def test_month_summary_ignores_paid_installments(
    client: TestClient, auth_headers: dict
) -> None:
    _post_installment(client, auth_headers, installment_value=200, remaining_installments=0)
    _post_installment(client, auth_headers, installment_value=100)

    response = client.get("/financial/month-summary", headers=auth_headers)
    body = response.json()
    assert float(body["monthly_installment_commitment"]) == 100.00
    assert body["active_installments"] == 1


def test_future_balance_default_horizon(
    client: TestClient, auth_headers: dict
) -> None:
    _post_installment(
        client,
        auth_headers,
        installment_value=200,
        total_installments=12,
        remaining_installments=3,
    )
    response = client.get("/financial/future-balance", headers=auth_headers)
    assert response.status_code == 200
    body = response.json()
    assert len(body["months"]) == 12
    months = body["months"]

    # months_ahead 1 and 2 still owe (remaining=3 > 1 and 3 > 2)
    assert float(months[0]["projected_installment_commitment"]) == 200.00
    assert float(months[1]["projected_installment_commitment"]) == 200.00
    # months_ahead 3 — remaining_installments(3) is NOT > 3, so paid off
    assert float(months[2]["projected_installment_commitment"]) == 0.00
    assert float(months[2]["projected_balance"]) == 5000.00
    assert months[2]["active_installments"] == 0


def test_future_balance_custom_months(
    client: TestClient, auth_headers: dict
) -> None:
    response = client.get(
        "/financial/future-balance", params={"months": 3}, headers=auth_headers
    )
    assert response.status_code == 200
    assert len(response.json()["months"]) == 3


def test_future_balance_rejects_invalid_months(
    client: TestClient, auth_headers: dict
) -> None:
    assert (
        client.get(
            "/financial/future-balance", params={"months": 0}, headers=auth_headers
        ).status_code
        == 422
    )
    assert (
        client.get(
            "/financial/future-balance", params={"months": 999}, headers=auth_headers
        ).status_code
        == 422
    )
