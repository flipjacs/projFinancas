from datetime import date
from decimal import Decimal

import pytest
from fastapi.testclient import TestClient

from app.schemas.financial import RiskLevel
from app.services.financial_calculations import (
    classify_risk,
    financial_health_score,
    installment_value,
    suggest_safe_installments,
)


# -------------------------- pure calculation tests --------------------------


def test_installment_value_rounds_to_two_decimals() -> None:
    assert installment_value(Decimal("1000"), 3) == Decimal("333.33")
    assert installment_value(Decimal("100"), 4) == Decimal("25.00")


def test_installment_value_rejects_non_positive_count() -> None:
    with pytest.raises(ValueError):
        installment_value(Decimal("100"), 0)


def test_classify_risk_thresholds() -> None:
    assert classify_risk(Decimal("0")) is RiskLevel.LOW
    assert classify_risk(Decimal("19.99")) is RiskLevel.LOW
    assert classify_risk(Decimal("20")) is RiskLevel.MEDIUM
    assert classify_risk(Decimal("39.99")) is RiskLevel.MEDIUM
    assert classify_risk(Decimal("40")) is RiskLevel.HIGH
    assert classify_risk(Decimal("85")) is RiskLevel.HIGH


def test_health_score_drops_with_commitment() -> None:
    high = financial_health_score(Decimal("10"), Decimal("4000"), Decimal("5000"))
    low = financial_health_score(Decimal("60"), Decimal("2000"), Decimal("5000"))
    assert high > low
    assert 0 <= high <= 100
    assert 0 <= low <= 100


def test_health_score_zero_when_no_salary() -> None:
    assert (
        financial_health_score(Decimal("0"), Decimal("0"), Decimal("0")) == 0
    )


def test_health_score_halves_when_negative_remaining() -> None:
    positive = financial_health_score(
        Decimal("50"), Decimal("100"), Decimal("5000")
    )
    negative = financial_health_score(
        Decimal("50"), Decimal("-100"), Decimal("5000")
    )
    assert negative <= positive // 2 + 1


def test_safe_installment_suggestions_keep_total_under_threshold() -> None:
    # salary 5000, no existing commitments → 30% of 5000 = 1500 max safe value
    # price 3000 → min installments ≈ 2 (1500/installment)
    suggestions = suggest_safe_installments(
        Decimal("3000"), Decimal("5000"), Decimal("0")
    )
    assert suggestions
    for n, value, pct, _ in suggestions:
        assert n >= 2
        assert pct < Decimal("31")  # near-threshold tolerated due to rounding
        assert value * n >= Decimal("3000") - Decimal("1")  # covers the price


def test_suggestions_empty_when_no_headroom() -> None:
    # existing commitments already at safe threshold
    assert (
        suggest_safe_installments(
            Decimal("1000"), Decimal("1000"), Decimal("400")
        )
        == []
    )


def test_suggestions_empty_when_zero_salary() -> None:
    assert suggest_safe_installments(Decimal("100"), Decimal("0"), Decimal("0")) == []


# -------------------------- endpoint tests --------------------------


def _make_expense(client: TestClient, headers: dict, **kwargs) -> dict:
    payload = {
        "title": "Recurring",
        "amount": 100,
        "category": "housing",
        "recurring": True,
    }
    payload.update(kwargs)
    response = client.post("/expenses", json=payload, headers=headers)
    assert response.status_code == 201, response.text
    return response.json()


def _make_installment(client: TestClient, headers: dict, **kwargs) -> dict:
    payload = {
        "product_name": "Existing",
        "total_amount": 1200,
        "installment_value": 100,
        "total_installments": 12,
        "purchase_date": str(date(2026, 1, 15)),
    }
    payload.update(kwargs)
    response = client.post("/installments", json=payload, headers=headers)
    assert response.status_code == 201, response.text
    return response.json()


def test_can_i_buy_low_risk_clean_slate(
    client: TestClient, auth_headers: dict
) -> None:
    response = client.post(
        "/financial-analysis/can-i-buy",
        json={"product_price": 1000, "installments": 10},
        headers=auth_headers,
    )
    assert response.status_code == 200
    body = response.json()
    # salary 5000, only this purchase: 100/5000 = 2% → low
    assert body["risk_level"] == "low"
    assert body["approved"] is True
    assert float(body["new_installment_value"]) == 100.00
    assert float(body["monthly_impact_percentage"]) == 2.00
    assert float(body["remaining_balance_after_purchase"]) == 4900.00
    assert body["financial_health_score"] > 80
    assert body["warnings"] == []


def test_can_i_buy_medium_risk_with_existing_load(
    client: TestClient, auth_headers: dict
) -> None:
    # salary 5000. Existing recurring 800 + installment 200 = 1000 (20%).
    # New purchase 3500 over 10 months → 350/month.
    # Total committed = 1350 → 27% → medium.
    _make_expense(client, auth_headers, amount=800, recurring=True)
    _make_installment(
        client, auth_headers, installment_value=200, total_installments=12
    )
    response = client.post(
        "/financial-analysis/can-i-buy",
        json={"product_price": 3500, "installments": 10},
        headers=auth_headers,
    )
    assert response.status_code == 200
    body = response.json()
    assert body["risk_level"] == "medium"
    assert body["approved"] is True
    assert float(body["new_installment_value"]) == 350.00
    assert float(body["monthly_impact_percentage"]) == 27.00
    assert float(body["remaining_balance_after_purchase"]) == 3650.00
    assert "acceptable" in body["recommendation"].lower()


def test_can_i_buy_high_risk_rejected(
    client: TestClient, auth_headers: dict
) -> None:
    # Force high commitment: 2000 over 1 month = 40% → high.
    response = client.post(
        "/financial-analysis/can-i-buy",
        json={"product_price": 2000, "installments": 1},
        headers=auth_headers,
    )
    body = response.json()
    assert body["risk_level"] == "high"
    assert body["approved"] is False
    assert "not recommended" in body["recommendation"].lower()
    assert any("high-risk" in w for w in body["warnings"])


def test_can_i_buy_negative_remaining_warns_and_rejects(
    client: TestClient, auth_headers: dict
) -> None:
    response = client.post(
        "/financial-analysis/can-i-buy",
        json={"product_price": 10000, "installments": 1},
        headers=auth_headers,
    )
    body = response.json()
    assert body["approved"] is False
    assert float(body["remaining_balance_after_purchase"]) < 0
    assert any("negative" in w for w in body["warnings"])
    assert any("exceed your monthly salary" in w for w in body["warnings"])


def test_can_i_buy_returns_safe_suggestions_when_high_risk(
    client: TestClient, auth_headers: dict
) -> None:
    response = client.post(
        "/financial-analysis/can-i-buy",
        json={"product_price": 3000, "installments": 2},  # 1500/mo = 30%
        headers=auth_headers,
    )
    body = response.json()
    suggestions = body["safe_installment_suggestions"]
    assert suggestions
    for s in suggestions:
        assert s["installments"] >= 2
        assert float(s["monthly_impact_percentage"]) < 31


def test_can_i_buy_rejects_invalid_input(
    client: TestClient, auth_headers: dict
) -> None:
    assert (
        client.post(
            "/financial-analysis/can-i-buy",
            json={"product_price": 0, "installments": 5},
            headers=auth_headers,
        ).status_code
        == 422
    )
    assert (
        client.post(
            "/financial-analysis/can-i-buy",
            json={"product_price": 100, "installments": 0},
            headers=auth_headers,
        ).status_code
        == 422
    )
    assert (
        client.post(
            "/financial-analysis/can-i-buy",
            json={"product_price": -100, "installments": 5},
            headers=auth_headers,
        ).status_code
        == 422
    )


def test_can_i_buy_requires_authentication(client: TestClient) -> None:
    response = client.post(
        "/financial-analysis/can-i-buy",
        json={"product_price": 100, "installments": 5},
    )
    assert response.status_code == 401


def test_can_i_buy_consistency_balance_matches_components(
    client: TestClient, auth_headers: dict
) -> None:
    _make_expense(client, auth_headers, amount=500, recurring=True)
    _make_installment(client, auth_headers, installment_value=300)
    response = client.post(
        "/financial-analysis/can-i-buy",
        json={"product_price": 1200, "installments": 12},
        headers=auth_headers,
    )
    body = response.json()
    salary = Decimal(body["salary"])
    recurring = Decimal(body["recurring_expenses"])
    current = Decimal(body["current_installment_commitment"])
    new_value = Decimal(body["new_installment_value"])
    total = Decimal(body["total_committed_after_purchase"])
    remaining = Decimal(body["remaining_balance_after_purchase"])

    assert recurring == Decimal("500.00")
    assert current == Decimal("300.00")
    assert new_value == Decimal("100.00")
    assert total == recurring + current + new_value
    assert remaining == salary - total


def test_can_i_buy_excludes_non_recurring_expenses(
    client: TestClient, auth_headers: dict
) -> None:
    # Non-recurring expense should not appear in recurring_expenses.
    _make_expense(client, auth_headers, amount=999, recurring=False)
    response = client.post(
        "/financial-analysis/can-i-buy",
        json={"product_price": 100, "installments": 10},
        headers=auth_headers,
    )
    body = response.json()
    assert float(body["recurring_expenses"]) == 0.00


def test_can_i_buy_excludes_paid_off_installments(
    client: TestClient, auth_headers: dict
) -> None:
    _make_installment(client, auth_headers, installment_value=400, remaining_installments=0)
    response = client.post(
        "/financial-analysis/can-i-buy",
        json={"product_price": 100, "installments": 10},
        headers=auth_headers,
    )
    body = response.json()
    assert float(body["current_installment_commitment"]) == 0.00
