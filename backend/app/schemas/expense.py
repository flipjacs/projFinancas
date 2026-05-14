from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field

from app.utils.enums import CategoriaComportamental, ExpenseCategory, ImpactoFinanceiro


class ExpenseBase(BaseModel):
    title: str = Field(min_length=1, max_length=180)
    amount: Decimal = Field(ge=0, decimal_places=2)
    category: ExpenseCategory
    # Quando o usuário não informa o lado comportamental, o service deriva
    # a partir da categoria base (food → essencial, entertainment → lazer…).
    categoria_comportamental: CategoriaComportamental | None = None
    impacto_financeiro: ImpactoFinanceiro | None = None
    # Earmark: ID da distribuição que esse gasto especificamente alimenta.
    # Indispensável para Reserva/Objetivos — sem ele, o sistema não tem como
    # decidir QUAL reserva está sendo contribuída.
    distribuicao_id: int | None = None
    recurring: bool = False


class ExpenseCreate(ExpenseBase):
    pass


class ExpenseUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=180)
    amount: Decimal | None = Field(default=None, ge=0, decimal_places=2)
    category: ExpenseCategory | None = None
    categoria_comportamental: CategoriaComportamental | None = None
    impacto_financeiro: ImpactoFinanceiro | None = None
    distribuicao_id: int | None = None
    # Quando precisar limpar o earmark, mande "true" — distinção necessária
    # porque `distribuicao_id = None` no PATCH significa "não mexer".
    desvincular_distribuicao: bool = False
    recurring: bool | None = None


class ExpenseResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    title: str
    amount: Decimal
    category: str
    categoria_comportamental: str | None
    impacto_financeiro: str | None
    distribuicao_id: int | None
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
