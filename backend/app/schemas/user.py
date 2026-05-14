from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class UserBase(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    email: EmailStr
    monthly_salary: Decimal = Field(ge=0)


class UserUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=120)
    monthly_salary: Decimal | None = Field(default=None, ge=0)


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    email: EmailStr
    monthly_salary: Decimal
    created_at: datetime
