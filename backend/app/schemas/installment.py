from datetime import date, datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field, model_validator

MAX_INSTALLMENTS = 360


class InstallmentBase(BaseModel):
    product_name: str = Field(min_length=1, max_length=180)
    total_amount: Decimal = Field(gt=0, decimal_places=2)
    installment_value: Decimal = Field(gt=0, decimal_places=2)
    total_installments: int = Field(gt=0, le=MAX_INSTALLMENTS)
    purchase_date: date


class InstallmentCreate(InstallmentBase):
    remaining_installments: int | None = Field(default=None, ge=0, le=MAX_INSTALLMENTS)

    @model_validator(mode="after")
    def _default_and_validate_remaining(self) -> "InstallmentCreate":
        if self.remaining_installments is None:
            self.remaining_installments = self.total_installments
        elif self.remaining_installments > self.total_installments:
            raise ValueError(
                "remaining_installments cannot exceed total_installments"
            )
        return self


class InstallmentUpdate(BaseModel):
    product_name: str | None = Field(default=None, min_length=1, max_length=180)
    total_amount: Decimal | None = Field(default=None, gt=0, decimal_places=2)
    installment_value: Decimal | None = Field(default=None, gt=0, decimal_places=2)
    total_installments: int | None = Field(default=None, gt=0, le=MAX_INSTALLMENTS)
    remaining_installments: int | None = Field(default=None, ge=0, le=MAX_INSTALLMENTS)
    purchase_date: date | None = None


class InstallmentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    product_name: str
    total_amount: Decimal
    installment_value: Decimal
    total_installments: int
    remaining_installments: int
    purchase_date: date
    created_at: datetime
