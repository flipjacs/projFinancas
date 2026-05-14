from datetime import date, datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field


class DisciplineSettingsUpdate(BaseModel):
    max_leisure_percentage: Decimal | None = Field(
        default=None, ge=0, le=100, decimal_places=2
    )
    max_installment_percentage: Decimal | None = Field(
        default=None, ge=0, le=100, decimal_places=2
    )
    emergency_reserve_goal: Decimal | None = Field(
        default=None, ge=0, decimal_places=2
    )


class DisciplineSettings(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    max_leisure_percentage: Decimal
    max_installment_percentage: Decimal
    emergency_reserve_goal: Decimal


class DisciplineMetrics(BaseModel):
    salary: Decimal
    leisure_spending: Decimal
    leisure_percentage: Decimal
    savings_amount: Decimal
    savings_percentage: Decimal
    installment_commitment: Decimal
    installment_percentage: Decimal
    total_committed_percentage: Decimal


class DisciplineScoreResponse(BaseModel):
    score: int
    streak_days: int
    last_evaluated_date: date | None


class DisciplineWarningsResponse(BaseModel):
    warnings: list[str]


class DisciplineStatusResponse(BaseModel):
    score: int
    streak_days: int
    last_evaluated_date: date | None
    settings: DisciplineSettings
    metrics: DisciplineMetrics
    warnings: list[str]
    updated_at: datetime
