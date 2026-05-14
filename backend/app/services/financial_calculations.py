from decimal import ROUND_HALF_UP, Decimal
from typing import Iterable

from app.models.installment import Installment
from app.schemas.financial import RiskLevel

ZERO = Decimal("0")
ONE_HUNDRED = Decimal("100")

LOW_RISK_THRESHOLD = Decimal("20")
MEDIUM_RISK_THRESHOLD = Decimal("40")
SAFE_COMMITMENT_THRESHOLD = Decimal("30")
MAX_SUGGESTION_INSTALLMENTS = 60


def monthly_installment_commitment(installments: Iterable[Installment]) -> Decimal:
    """Sum of installment_value for entries with remaining_installments > 0."""
    total = ZERO
    for item in installments:
        if item.remaining_installments > 0:
            total += Decimal(item.installment_value)
    return total


def remaining_salary(salary: Decimal, total_committed: Decimal) -> Decimal:
    return Decimal(salary) - Decimal(total_committed)


def committed_percentage(committed: Decimal, salary: Decimal) -> Decimal:
    """Percentage of salary committed. Returns 0 when salary is 0."""
    salary = Decimal(salary)
    if salary <= ZERO:
        return ZERO
    pct = (Decimal(committed) / salary) * ONE_HUNDRED
    return pct.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)


def projected_commitment_at(
    installments: Iterable[Installment], months_ahead: int
) -> tuple[Decimal, int]:
    """
    Projected installment commitment `months_ahead` months from now.

    An installment still contributes its installment_value at month N
    when remaining_installments > N (months_ahead is 0-based for "this month").
    Returns (commitment, active_count).
    """
    total = ZERO
    active = 0
    for item in installments:
        if item.remaining_installments > months_ahead:
            total += Decimal(item.installment_value)
            active += 1
    return total, active


def installment_value(price: Decimal, installments: int) -> Decimal:
    """Per-month installment value, rounded to two decimal places."""
    if installments <= 0:
        raise ValueError("installments must be positive")
    return (Decimal(price) / Decimal(installments)).quantize(
        Decimal("0.01"), rounding=ROUND_HALF_UP
    )


def classify_risk(committed_pct: Decimal) -> RiskLevel:
    """Map a committed-income percentage to a risk level."""
    pct = Decimal(committed_pct)
    if pct < LOW_RISK_THRESHOLD:
        return RiskLevel.LOW
    if pct < MEDIUM_RISK_THRESHOLD:
        return RiskLevel.MEDIUM
    return RiskLevel.HIGH


def financial_health_score(
    committed_pct: Decimal, remaining_after: Decimal, salary: Decimal
) -> int:
    """
    0-100 score combining commitment ratio and absolute remaining balance.

    Heuristic: start at 100, subtract 1.5 points per percent committed,
    halve the score if remaining balance goes negative.
    """
    pct = Decimal(committed_pct)
    score = ONE_HUNDRED - (pct * Decimal("1.5"))
    if Decimal(remaining_after) < ZERO:
        score = score / Decimal("2")
    if Decimal(salary) <= ZERO:
        score = ZERO
    score = max(ZERO, min(ONE_HUNDRED, score))
    return int(score.quantize(Decimal("1"), rounding=ROUND_HALF_UP))


def suggest_safe_installments(
    price: Decimal,
    salary: Decimal,
    existing_committed: Decimal,
    max_count: int = MAX_SUGGESTION_INSTALLMENTS,
    safe_threshold: Decimal = SAFE_COMMITMENT_THRESHOLD,
) -> list[tuple[int, Decimal, Decimal, RiskLevel]]:
    """
    Suggest installment counts that keep total commitment under safe_threshold.

    Returns up to three options as (installments, value, total_committed_pct, risk).
    Empty list if salary is non-positive (cannot reason about ratios).
    """
    salary = Decimal(salary)
    if salary <= ZERO:
        return []

    existing_pct = (Decimal(existing_committed) / salary) * ONE_HUNDRED
    headroom = safe_threshold - existing_pct
    if headroom <= ZERO:
        return []

    max_safe_value = (salary * headroom) / ONE_HUNDRED
    if max_safe_value <= ZERO:
        return []

    min_installments = int(
        (Decimal(price) / max_safe_value).to_integral_value(rounding=ROUND_HALF_UP)
    )
    min_installments = max(min_installments, 1)
    if min_installments > max_count:
        return []

    suggestions: list[tuple[int, Decimal, Decimal, RiskLevel]] = []
    seen: set[int] = set()
    for n in (min_installments, min_installments * 2, min_installments * 3):
        if n in seen or n > max_count:
            continue
        seen.add(n)
        value = installment_value(price, n)
        total_pct = ((Decimal(existing_committed) + value) / salary) * ONE_HUNDRED
        total_pct = total_pct.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
        suggestions.append((n, value, total_pct, classify_risk(total_pct)))
    return suggestions


def build_recommendation(
    risk: RiskLevel, remaining_after: Decimal, salary: Decimal
) -> str:
    if Decimal(salary) <= ZERO:
        return "Não dá pra avaliar a compra: o salário mensal ainda não foi definido."
    if Decimal(remaining_after) < ZERO:
        return (
            "Melhor não fazer essa compra: o compromisso passa da sua renda "
            "mensal e te deixaria no negativo."
        )
    if risk is RiskLevel.LOW:
        return "A compra cabe tranquilamente no seu orçamento."
    if risk is RiskLevel.MEDIUM:
        return "A compra é viável, mas chega perto do limite seguro."
    return (
        "Não é uma boa hora: a compra tomaria uma fatia grande do seu salário "
        "e deixaria pouca margem para imprevistos."
    )


def build_warnings(
    salary: Decimal,
    remaining_after: Decimal,
    new_installment: Decimal,
    monthly_impact_pct: Decimal,
    existing_committed: Decimal,
) -> list[str]:
    warnings: list[str] = []
    if Decimal(salary) <= ZERO:
        warnings.append("Seu salário está zerado — defina um valor para receber uma análise útil.")
        return warnings
    if Decimal(remaining_after) < ZERO:
        warnings.append("O saldo do mês ficaria negativo depois desta compra.")
    if Decimal(new_installment) > Decimal(salary):
        warnings.append("Uma única parcela já passa do seu salário mensal.")
    if (
        Decimal(existing_committed) / Decimal(salary)
    ) * ONE_HUNDRED >= SAFE_COMMITMENT_THRESHOLD:
        warnings.append(
            "Seus compromissos atuais já comprometem uma fatia grande do salário."
        )
    if Decimal(monthly_impact_pct) >= MEDIUM_RISK_THRESHOLD:
        warnings.append("O compromisso mensal total ficaria em zona de risco alto.")
    return warnings
