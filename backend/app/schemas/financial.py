from decimal import Decimal
from enum import StrEnum

from pydantic import BaseModel, Field


class RiskLevel(StrEnum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"


class MonthSummary(BaseModel):
    year: int
    month: int
    salary: Decimal
    total_expenses: Decimal
    monthly_installment_commitment: Decimal
    total_committed: Decimal
    remaining_balance: Decimal
    committed_percentage: Decimal
    active_installments: int


class FutureMonthBalance(BaseModel):
    months_ahead: int
    year: int
    month: int
    projected_installment_commitment: Decimal
    projected_balance: Decimal
    active_installments: int


class FutureBalanceResponse(BaseModel):
    salary: Decimal
    months: list[FutureMonthBalance]


class CanIBuyRequest(BaseModel):
    model_config = {
        "json_schema_extra": {
            "example": {
                "product_price": 3500,
                "installments": 10,
                "product_name": "New laptop",
            }
        }
    }

    product_price: Decimal = Field(gt=0, decimal_places=2)
    installments: int = Field(gt=0, le=360)
    product_name: str | None = Field(default=None, max_length=180)


class SafeInstallmentSuggestion(BaseModel):
    installments: int
    installment_value: Decimal
    monthly_impact_percentage: Decimal
    risk_level: RiskLevel


class CanIBuyResponse(BaseModel):
    approved: bool
    risk_level: RiskLevel
    monthly_impact_percentage: Decimal
    new_installment_value: Decimal
    remaining_balance_after_purchase: Decimal
    salary: Decimal
    recurring_expenses: Decimal
    current_installment_commitment: Decimal
    total_committed_after_purchase: Decimal
    financial_health_score: int
    recommendation: str
    warnings: list[str]
    safe_installment_suggestions: list[SafeInstallmentSuggestion]
