"""Tunable defaults and weights for the Discipline Mode subsystem.

Centralized so that thresholds and weights can be adjusted without touching
business logic. None of these values should be inlined elsewhere.
"""
from decimal import Decimal

from app.utils.enums import ExpenseCategory

# ---- Default user-overridable settings ----

DEFAULT_MAX_LEISURE_PCT = Decimal("15.00")
DEFAULT_MAX_INSTALLMENT_PCT = Decimal("30.00")
DEFAULT_EMERGENCY_RESERVE_GOAL = Decimal("0.00")

# ---- System-level (non-user) tunables ----

# Target share of salary that should go into savings each month.
SAVINGS_TARGET_PCT = Decimal("10.00")

# Total committed share that triggers a "dangerous pattern" warning.
DANGEROUS_TOTAL_COMMITMENT_PCT = Decimal("80.00")

# Categories considered "leisure" spending.
LEISURE_CATEGORIES: frozenset[str] = frozenset(
    {ExpenseCategory.ENTERTAINMENT.value, ExpenseCategory.SHOPPING.value}
)

# Category considered as savings contributions.
SAVINGS_CATEGORY: str = ExpenseCategory.SAVINGS.value

# ---- Discipline score weights (must sum to 1.0) ----

SCORE_WEIGHTS = {
    "savings_consistency": Decimal("0.25"),
    "installment_control": Decimal("0.25"),
    "leisure_moderation": Decimal("0.25"),
    "salary_commitment": Decimal("0.25"),
}
