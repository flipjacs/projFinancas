from decimal import Decimal

from pydantic import BaseModel


class CategoryTotal(BaseModel):
    category: str
    total: Decimal


class MonthlySummary(BaseModel):
    year: int
    month: int
    salary: Decimal
    total_expenses: Decimal
    remaining_balance: Decimal
    expense_count: int
    by_category: list[CategoryTotal]


class BalanceResponse(BaseModel):
    salary: Decimal
    total_expenses_this_month: Decimal
    remaining_balance: Decimal
