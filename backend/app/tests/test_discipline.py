from datetime import date, timedelta
from decimal import Decimal

from fastapi.testclient import TestClient

from app.services.discipline_calculations import (
    DisciplineThresholds,
    SpendingMetrics,
    compute_discipline_score,
    derive_percentages,
    generate_warnings,
    is_compliant,
    next_streak,
)
from app.services.discipline_constants import (
    DEFAULT_MAX_INSTALLMENT_PCT,
    DEFAULT_MAX_LEISURE_PCT,
    SAVINGS_TARGET_PCT,
)


# -------------------------- pure calculation tests --------------------------


def _thresholds() -> DisciplineThresholds:
    return DisciplineThresholds(
        max_leisure_pct=DEFAULT_MAX_LEISURE_PCT,
        max_installment_pct=DEFAULT_MAX_INSTALLMENT_PCT,
    )


def _metrics(
    salary: str = "5000",
    leisure: str = "0",
    savings: str = "500",
    installments: str = "0",
    recurring: str = "0",
) -> SpendingMetrics:
    return SpendingMetrics(
        salary=Decimal(salary),
        leisure_spending=Decimal(leisure),
        savings_amount=Decimal(savings),
        installment_commitment=Decimal(installments),
        recurring_expenses=Decimal(recurring),
    )


def test_derive_percentages_handles_zero_salary() -> None:
    pct = derive_percentages(_metrics(salary="0", leisure="100"))
    assert pct["leisure_pct"] == Decimal("0")
    assert pct["savings_pct"] == Decimal("0")


def test_score_perfect_when_savings_target_met_and_no_burdens() -> None:
    pct = derive_percentages(_metrics(savings="500"))  # 10% of 5000
    score = compute_discipline_score(pct, _thresholds())
    assert score == 100


def test_score_zero_when_everything_maxed_out() -> None:
    # leisure 100% of salary, installments 100%, savings 0%, total committed 200%
    pct = derive_percentages(
        _metrics(leisure="5000", installments="5000", savings="0")
    )
    score = compute_discipline_score(pct, _thresholds())
    assert score == 0


def test_score_decreases_when_leisure_exceeds_threshold() -> None:
    baseline = compute_discipline_score(
        derive_percentages(_metrics(leisure="0", savings="500")), _thresholds()
    )
    over = compute_discipline_score(
        derive_percentages(_metrics(leisure="2000", savings="500")), _thresholds()
    )
    assert over < baseline


def test_warnings_leisure_overspend() -> None:
    pct = derive_percentages(_metrics(leisure="2000", savings="500"))
    warnings = generate_warnings(pct, _thresholds(), Decimal("5000"))
    assert "You are spending too much on leisure." in warnings


def test_warnings_installment_overuse() -> None:
    pct = derive_percentages(_metrics(installments="2000", savings="500"))
    warnings = generate_warnings(pct, _thresholds(), Decimal("5000"))
    assert "Your installment commitments are unhealthy." in warnings


def test_warnings_dangerous_pattern() -> None:
    # 80% total committed
    pct = derive_percentages(
        _metrics(leisure="1000", installments="2000", recurring="1000", savings="500")
    )
    warnings = generate_warnings(pct, _thresholds(), Decimal("5000"))
    assert any("dangerous" in w for w in warnings)


def test_warnings_low_savings() -> None:
    pct = derive_percentages(_metrics(savings="100"))  # 2% < target
    warnings = generate_warnings(pct, _thresholds(), Decimal("5000"))
    assert any("saving less" in w for w in warnings)


def test_warnings_no_salary_set() -> None:
    pct = derive_percentages(_metrics(salary="0"))
    warnings = generate_warnings(pct, _thresholds(), Decimal("0"))
    assert warnings == ["Set your monthly salary to enable discipline tracking."]


def test_compliant_when_all_thresholds_met() -> None:
    pct = derive_percentages(_metrics(savings="500"))
    warnings = generate_warnings(pct, _thresholds(), Decimal("5000"))
    assert is_compliant(warnings) is True


# -------------------------- streak tests --------------------------


def test_streak_first_evaluation_compliant() -> None:
    today = date(2026, 5, 13)
    assert next_streak(today, None, 0, True) == 1


def test_streak_first_evaluation_non_compliant() -> None:
    today = date(2026, 5, 13)
    assert next_streak(today, None, 0, False) == 0


def test_streak_increments_on_consecutive_days() -> None:
    today = date(2026, 5, 13)
    yesterday = today - timedelta(days=1)
    assert next_streak(today, yesterday, 5, True) == 6


def test_streak_resets_on_violation() -> None:
    today = date(2026, 5, 13)
    yesterday = today - timedelta(days=1)
    assert next_streak(today, yesterday, 10, False) == 0


def test_streak_restarts_after_gap() -> None:
    today = date(2026, 5, 13)
    long_ago = today - timedelta(days=5)
    assert next_streak(today, long_ago, 7, True) == 1


def test_streak_unchanged_on_same_day_evaluation() -> None:
    today = date(2026, 5, 13)
    assert next_streak(today, today, 4, True) == 4
    assert next_streak(today, today, 4, False) == 4


# -------------------------- endpoint tests --------------------------


def _make_expense(client: TestClient, headers: dict, **kwargs) -> dict:
    payload = {
        "title": "Item",
        "amount": 100,
        "category": "food",
        "recurring": False,
    }
    payload.update(kwargs)
    response = client.post("/expenses", json=payload, headers=headers)
    assert response.status_code == 201, response.text
    return response.json()


def test_status_initialized_on_first_request(
    client: TestClient, auth_headers: dict
) -> None:
    response = client.get("/discipline/status", headers=auth_headers)
    assert response.status_code == 200
    body = response.json()
    assert "warnings" in body
    assert body["last_evaluated_date"] is not None
    assert float(body["settings"]["max_leisure_percentage"]) == float(
        DEFAULT_MAX_LEISURE_PCT
    )
    assert float(body["settings"]["max_installment_percentage"]) == float(
        DEFAULT_MAX_INSTALLMENT_PCT
    )


def test_status_streak_starts_when_compliant(
    client: TestClient, auth_headers: dict
) -> None:
    # Meet savings target → compliant on a clean slate.
    _make_expense(client, auth_headers, amount=500, category="savings")
    body = client.get("/discipline/status", headers=auth_headers).json()
    assert body["warnings"] == []
    assert body["streak_days"] == 1


def test_status_warns_on_leisure_overspend(
    client: TestClient, auth_headers: dict
) -> None:
    _make_expense(client, auth_headers, amount=2000, category="entertainment")
    _make_expense(client, auth_headers, amount=500, category="savings")
    response = client.get("/discipline/status", headers=auth_headers)
    body = response.json()
    assert "You are spending too much on leisure." in body["warnings"]
    # leisure overspend should reset streak to 0
    assert body["streak_days"] == 0


def test_score_endpoint_returns_score_and_streak(
    client: TestClient, auth_headers: dict
) -> None:
    response = client.get("/discipline/score", headers=auth_headers)
    assert response.status_code == 200
    body = response.json()
    assert 0 <= body["score"] <= 100
    assert body["streak_days"] >= 0


def test_warnings_endpoint(client: TestClient, auth_headers: dict) -> None:
    _make_expense(client, auth_headers, amount=2500, category="shopping")
    response = client.get("/discipline/warnings", headers=auth_headers)
    assert response.status_code == 200
    assert any(
        "leisure" in w.lower() for w in response.json()["warnings"]
    )


def test_settings_can_be_updated(client: TestClient, auth_headers: dict) -> None:
    response = client.put(
        "/discipline/settings",
        json={
            "max_leisure_percentage": 25.00,
            "max_installment_percentage": 35.00,
            "emergency_reserve_goal": 10000.00,
        },
        headers=auth_headers,
    )
    assert response.status_code == 200
    body = response.json()
    assert float(body["settings"]["max_leisure_percentage"]) == 25.00
    assert float(body["settings"]["max_installment_percentage"]) == 35.00
    assert float(body["settings"]["emergency_reserve_goal"]) == 10000.00


def test_settings_partial_update_preserves_other_fields(
    client: TestClient, auth_headers: dict
) -> None:
    client.put(
        "/discipline/settings",
        json={"emergency_reserve_goal": 5000},
        headers=auth_headers,
    )
    body = client.get("/discipline/status", headers=auth_headers).json()
    assert float(body["settings"]["emergency_reserve_goal"]) == 5000.00
    assert float(body["settings"]["max_leisure_percentage"]) == float(
        DEFAULT_MAX_LEISURE_PCT
    )


def test_settings_rejects_out_of_range_percentage(
    client: TestClient, auth_headers: dict
) -> None:
    response = client.put(
        "/discipline/settings",
        json={"max_leisure_percentage": 150},
        headers=auth_headers,
    )
    assert response.status_code == 422


def test_relaxing_threshold_clears_related_warning(
    client: TestClient, auth_headers: dict
) -> None:
    _make_expense(client, auth_headers, amount=1000, category="entertainment")
    _make_expense(client, auth_headers, amount=500, category="savings")
    before = client.get("/discipline/warnings", headers=auth_headers).json()
    assert any("leisure" in w.lower() for w in before["warnings"])

    client.put(
        "/discipline/settings",
        json={"max_leisure_percentage": 50},
        headers=auth_headers,
    )
    after = client.get("/discipline/warnings", headers=auth_headers).json()
    assert not any(
        "leisure" in w.lower() and "too much" in w.lower()
        for w in after["warnings"]
    )


def test_endpoints_require_authentication(client: TestClient) -> None:
    assert client.get("/discipline/status").status_code == 401
    assert client.get("/discipline/score").status_code == 401
    assert client.get("/discipline/warnings").status_code == 401
    assert client.put("/discipline/settings", json={}).status_code == 401


def test_savings_consistency_pillar_uses_target(
    client: TestClient, auth_headers: dict
) -> None:
    # Savings exactly meets target — should be flagged as compliant (no savings warning).
    target_amount = (Decimal("5000") * SAVINGS_TARGET_PCT) / Decimal("100")
    _make_expense(
        client, auth_headers, amount=float(target_amount), category="savings"
    )
    body = client.get("/discipline/warnings", headers=auth_headers).json()
    assert not any("saving less" in w for w in body["warnings"])
