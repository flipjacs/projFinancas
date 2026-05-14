"""Pure functions backing Discipline Mode.

No DB / SQLAlchemy / FastAPI imports here on purpose, so the logic is
testable and reusable in isolation.
"""
from datetime import date, timedelta
from decimal import ROUND_HALF_UP, Decimal
from typing import NamedTuple

from app.services.discipline_constants import (
    DANGEROUS_TOTAL_COMMITMENT_PCT,
    SAVINGS_TARGET_PCT,
    SCORE_WEIGHTS,
)

ZERO = Decimal("0")
ONE = Decimal("1")
ONE_HUNDRED = Decimal("100")


class DisciplineThresholds(NamedTuple):
    max_leisure_pct: Decimal
    max_installment_pct: Decimal


class SpendingMetrics(NamedTuple):
    salary: Decimal
    leisure_spending: Decimal
    savings_amount: Decimal
    installment_commitment: Decimal
    recurring_expenses: Decimal


def _ratio_pct(part: Decimal, whole: Decimal) -> Decimal:
    if whole <= ZERO:
        return ZERO
    pct = (Decimal(part) / Decimal(whole)) * ONE_HUNDRED
    return pct.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)


def derive_percentages(metrics: SpendingMetrics) -> dict[str, Decimal]:
    """Convert raw spending metrics into percentages of salary."""
    return {
        "leisure_pct": _ratio_pct(metrics.leisure_spending, metrics.salary),
        "savings_pct": _ratio_pct(metrics.savings_amount, metrics.salary),
        "installment_pct": _ratio_pct(
            metrics.installment_commitment, metrics.salary
        ),
        "total_committed_pct": _ratio_pct(
            metrics.recurring_expenses
            + metrics.installment_commitment
            + metrics.leisure_spending,
            metrics.salary,
        ),
    }


def _clamp01(value: Decimal) -> Decimal:
    if value < ZERO:
        return ZERO
    if value > ONE:
        return ONE
    return value


def _savings_component(savings_pct: Decimal) -> Decimal:
    """1.0 once savings_pct meets target, scales linearly below it."""
    if SAVINGS_TARGET_PCT <= ZERO:
        return ONE
    return _clamp01(Decimal(savings_pct) / SAVINGS_TARGET_PCT)


def _under_threshold_component(actual_pct: Decimal, max_pct: Decimal) -> Decimal:
    """
    1.0 when actual is 0, 0.0 when actual is at or above the threshold.
    Linear in between.
    """
    if max_pct <= ZERO:
        return ZERO if actual_pct > ZERO else ONE
    return _clamp01(ONE - (Decimal(actual_pct) / Decimal(max_pct)))


def _commitment_component(total_committed_pct: Decimal) -> Decimal:
    """1.0 at 0% committed, 0.0 at the dangerous threshold."""
    if DANGEROUS_TOTAL_COMMITMENT_PCT <= ZERO:
        return ZERO
    return _clamp01(
        ONE - (Decimal(total_committed_pct) / DANGEROUS_TOTAL_COMMITMENT_PCT)
    )


def compute_discipline_score(
    percentages: dict[str, Decimal], thresholds: DisciplineThresholds
) -> int:
    """
    Weighted score in [0, 100] built from four pillars:
    savings consistency, installment control, leisure moderation,
    and overall salary commitment.
    """
    components = {
        "savings_consistency": _savings_component(percentages["savings_pct"]),
        "installment_control": _under_threshold_component(
            percentages["installment_pct"], thresholds.max_installment_pct
        ),
        "leisure_moderation": _under_threshold_component(
            percentages["leisure_pct"], thresholds.max_leisure_pct
        ),
        "salary_commitment": _commitment_component(
            percentages["total_committed_pct"]
        ),
    }
    total = sum(
        (components[key] * SCORE_WEIGHTS[key] for key in SCORE_WEIGHTS),
        start=ZERO,
    )
    score = (total * ONE_HUNDRED).quantize(Decimal("1"), rounding=ROUND_HALF_UP)
    return int(max(ZERO, min(ONE_HUNDRED, score)))


def generate_warnings(
    percentages: dict[str, Decimal],
    thresholds: DisciplineThresholds,
    salary: Decimal,
) -> list[str]:
    warnings: list[str] = []
    if Decimal(salary) <= ZERO:
        warnings.append("Set your monthly salary to enable discipline tracking.")
        return warnings
    if percentages["leisure_pct"] > thresholds.max_leisure_pct:
        warnings.append("You are spending too much on leisure.")
    if percentages["installment_pct"] > thresholds.max_installment_pct:
        warnings.append("Your installment commitments are unhealthy.")
    if percentages["savings_pct"] < SAVINGS_TARGET_PCT:
        warnings.append(
            "You are saving less than the recommended share of your income."
        )
    if percentages["total_committed_pct"] >= DANGEROUS_TOTAL_COMMITMENT_PCT:
        warnings.append("Your spending pattern may become dangerous.")
    return warnings


def is_compliant(warnings: list[str]) -> bool:
    return len(warnings) == 0


def next_streak(
    today: date,
    last_evaluated_date: date | None,
    previous_streak: int,
    compliant_today: bool,
) -> int:
    """
    Streak rules:
    - same day re-evaluation: streak unchanged
    - non-compliant today: streak resets to 0
    - first evaluation ever, compliant: streak = 1
    - compliant + last evaluation was yesterday and was a non-zero streak: +1
    - compliant + gap > 1 day: streak restarts at 1
    """
    if last_evaluated_date == today:
        return previous_streak
    if not compliant_today:
        return 0
    if last_evaluated_date is None:
        return 1
    if last_evaluated_date == today - timedelta(days=1) and previous_streak > 0:
        return previous_streak + 1
    return 1
