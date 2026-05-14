from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field

from app.utils.enums import ExpenseCategory


class ExpenseBase(BaseModel):
    title: str = Field(min_length=1, max_length=180)
    amount: Decimal = Field(ge=0, decimal_places=2)
    category: ExpenseCategory
    recurring: bool = False


class ExpenseCreate(ExpenseBase):
    pass


class ExpenseUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=180)
    amount: Decimal | None = Field(default=None, ge=0, decimal_places=2)
    category: ExpenseCategory | None = None
    recurring: bool | None = None


class ExpenseResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    title: str
    amount: Decimal
    category: str
    recurring: bool
    created_at: datetime


class CSVImportRowError(BaseModel):
    row_number: int
    error: str


class CSVImportResult(BaseModel):
    received_rows: int
    imported: int
    skipped: int
    errors: list[CSVImportRowError]
