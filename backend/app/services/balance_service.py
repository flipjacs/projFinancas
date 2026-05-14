from datetime import UTC, datetime
from decimal import Decimal

from sqlalchemy.orm import Session

from app.models.user import User
from app.repositories.expense_repository import ExpenseRepository
from app.schemas.balance import BalanceResponse, CategoryTotal, MonthlySummary


def _month_range(year: int, month: int) -> tuple[datetime, datetime]:
    start = datetime(year, month, 1, tzinfo=UTC)
    if month == 12:
        end = datetime(year + 1, 1, 1, tzinfo=UTC)
    else:
        end = datetime(year, month + 1, 1, tzinfo=UTC)
    return start, end


class BalanceService:
    def __init__(self, db: Session) -> None:
        self.expenses = ExpenseRepository(db)

    def current_balance(self, user: User) -> BalanceResponse:
        now = datetime.now(UTC)
        start, end = _month_range(now.year, now.month)
        total = self.expenses.total_in_period(user.id, start, end)
        return BalanceResponse(
            salary=user.monthly_salary,
            total_expenses_this_month=total,
            remaining_balance=Decimal(user.monthly_salary) - total,
        )

    def monthly_summary(self, user: User, year: int, month: int) -> MonthlySummary:
        start, end = _month_range(year, month)
        total = self.expenses.total_in_period(user.id, start, end)
        items = self.expenses.list_in_period(user.id, start, end)
        by_cat = self.expenses.totals_by_category_in_period(user.id, start, end)
        return MonthlySummary(
            year=year,
            month=month,
            salary=user.monthly_salary,
            total_expenses=total,
            remaining_balance=Decimal(user.monthly_salary) - total,
            expense_count=len(items),
            by_category=[CategoryTotal(category=c, total=t) for c, t in by_cat],
        )
