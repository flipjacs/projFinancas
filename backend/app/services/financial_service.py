from datetime import UTC, datetime
from decimal import Decimal

from sqlalchemy.orm import Session

from app.models.user import User
from app.repositories.expense_repository import ExpenseRepository
from app.repositories.installment_repository import InstallmentRepository
from app.schemas.financial import (
    FutureBalanceResponse,
    FutureMonthBalance,
    MonthSummary,
)
from app.services.financial_calculations import (
    committed_percentage,
    monthly_installment_commitment,
    projected_commitment_at,
    remaining_salary,
)
from app.utils.cache import cache


def _month_range(year: int, month: int) -> tuple[datetime, datetime]:
    start = datetime(year, month, 1, tzinfo=UTC)
    if month == 12:
        end = datetime(year + 1, 1, 1, tzinfo=UTC)
    else:
        end = datetime(year, month + 1, 1, tzinfo=UTC)
    return start, end


def _add_months(year: int, month: int, offset: int) -> tuple[int, int]:
    index = (year * 12 + (month - 1)) + offset
    return index // 12, (index % 12) + 1


class FinancialService:
    def __init__(self, db: Session) -> None:
        self.expenses = ExpenseRepository(db)
        self.installments = InstallmentRepository(db)

    def month_summary(
        self, user: User, year: int | None = None, month: int | None = None
    ) -> MonthSummary:
        now = datetime.now(UTC)
        year = year or now.year
        month = month or now.month

        # Past months never change → safe to cache aggressively. The current
        # month is recomputed every call so writes show up immediately.
        is_past_month = (year, month) < (now.year, now.month)
        cache_key = f"month_summary:{user.id}:{year:04d}-{month:02d}"
        if is_past_month:
            hit = cache().get(cache_key)
            if hit is not None:
                return MonthSummary.model_validate(hit)

        start, end = _month_range(year, month)
        total_expenses = self.expenses.total_in_period(user.id, start, end)
        active = self.installments.list_active_by_user(user.id)
        commitment = monthly_installment_commitment(active)
        total_committed = total_expenses + commitment
        salary = Decimal(user.monthly_salary)

        summary = MonthSummary(
            year=year,
            month=month,
            salary=salary,
            total_expenses=total_expenses,
            monthly_installment_commitment=commitment,
            total_committed=total_committed,
            remaining_balance=remaining_salary(salary, total_committed),
            committed_percentage=committed_percentage(total_committed, salary),
            active_installments=len(active),
        )

        if is_past_month:
            cache().set(cache_key, summary.model_dump(mode="json"), ttl_seconds=3600)
        return summary

    def future_balance(self, user: User, months: int = 12) -> FutureBalanceResponse:
        now = datetime.now(UTC)
        active = self.installments.list_active_by_user(user.id)
        salary = Decimal(user.monthly_salary)

        projections: list[FutureMonthBalance] = []
        for offset in range(1, months + 1):
            year, month = _add_months(now.year, now.month, offset)
            commitment, active_count = projected_commitment_at(active, offset)
            projections.append(
                FutureMonthBalance(
                    months_ahead=offset,
                    year=year,
                    month=month,
                    projected_installment_commitment=commitment,
                    projected_balance=remaining_salary(salary, commitment),
                    active_installments=active_count,
                )
            )

        return FutureBalanceResponse(salary=salary, months=projections)
