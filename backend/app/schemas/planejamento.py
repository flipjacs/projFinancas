from datetime import datetime
from decimal import Decimal
from enum import StrEnum

from pydantic import BaseModel, ConfigDict, Field, model_validator


class TipoDistribuicao(StrEnum):
    VALOR_FIXO = "valor_fixo"
    PORCENTAGEM = "porcentagem"


class TipoCategoria(StrEnum):
    FIXO = "Fixo"
    RESERVA = "Reserva"
    FUNDO_VIAGEM = "Fundo Viagem"
    OBJETIVOS_TECH = "Objetivos Tech"
    LAZER = "Lazer"
    TRANSPORTE = "Transporte"
    EDUCACAO = "Educacao"
    SAUDE = "Saude"
    OUTROS = "Outros"


# ---------- Distribuição ----------


class DistribuicaoBase(BaseModel):
    categoria: str = Field(min_length=1, max_length=80)
    tipo_categoria: TipoCategoria
    tipo_distribuicao: TipoDistribuicao
    valor: Decimal = Field(default=Decimal("0"), ge=0, decimal_places=2)
    porcentagem: Decimal = Field(default=Decimal("0"), ge=0, le=100, decimal_places=2)
    limite_mensal: Decimal = Field(default=Decimal("0"), ge=0, decimal_places=2)

    @model_validator(mode="after")
    def _checa_coerencia(self) -> "DistribuicaoBase":
        # Garante que o campo correspondente ao tipo escolhido foi preenchido.
        if self.tipo_distribuicao == TipoDistribuicao.VALOR_FIXO and self.valor <= 0:
            raise ValueError(
                "Para tipo 'valor_fixo' o campo 'valor' precisa ser maior que zero."
            )
        if (
            self.tipo_distribuicao == TipoDistribuicao.PORCENTAGEM
            and self.porcentagem <= 0
        ):
            raise ValueError(
                "Para tipo 'porcentagem' o campo 'porcentagem' precisa ser maior que zero."
            )
        return self


class DistribuicaoCreate(DistribuicaoBase):
    pass


class DistribuicaoUpdate(BaseModel):
    categoria: str | None = Field(default=None, min_length=1, max_length=80)
    tipo_categoria: TipoCategoria | None = None
    tipo_distribuicao: TipoDistribuicao | None = None
    valor: Decimal | None = Field(default=None, ge=0, decimal_places=2)
    porcentagem: Decimal | None = Field(default=None, ge=0, le=100, decimal_places=2)
    limite_mensal: Decimal | None = Field(default=None, ge=0, decimal_places=2)


class DistribuicaoResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    usuario_id: int
    categoria: str
    tipo_categoria: str
    tipo_distribuicao: str
    valor: Decimal
    porcentagem: Decimal
    limite_mensal: Decimal
    criado_em: datetime


# ---------- Objetivos ----------


class ObjetivoBase(BaseModel):
    nome: str = Field(min_length=1, max_length=120)
    valor_meta: Decimal = Field(gt=0, decimal_places=2)
    valor_atual: Decimal = Field(default=Decimal("0"), ge=0, decimal_places=2)
    prazo_meses: int = Field(gt=0, le=600)


class ObjetivoCreate(ObjetivoBase):
    pass


class ObjetivoUpdate(BaseModel):
    nome: str | None = Field(default=None, min_length=1, max_length=120)
    valor_meta: Decimal | None = Field(default=None, gt=0, decimal_places=2)
    valor_atual: Decimal | None = Field(default=None, ge=0, decimal_places=2)
    prazo_meses: int | None = Field(default=None, gt=0, le=600)


class ObjetivoResponse(BaseModel):
    """Representa um objetivo já com os cálculos derivados."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    usuario_id: int
    nome: str
    valor_meta: Decimal
    valor_atual: Decimal
    prazo_meses: int
    valor_necessario_por_mes: Decimal
    progresso_percentual: Decimal
    criado_em: datetime


# ---------- Resumo / Análise ----------


class CategoriaResumo(BaseModel):
    """Mostra como cada categoria está se comportando neste mês."""

    distribuicao_id: int
    categoria: str
    tipo_categoria: str
    tipo_distribuicao: str
    valor_planejado: Decimal
    porcentagem_planejada: Decimal
    limite_mensal: Decimal
    gasto_atual: Decimal
    percentual_utilizado: Decimal
    excedido: bool
    proximo_do_limite: bool


class PlanejamentoResumo(BaseModel):
    salario: Decimal
    total_distribuido: Decimal
    porcentagem_comprometida: Decimal
    saldo_restante: Decimal
    total_gasto_mes: Decimal
    categorias: list[CategoriaResumo]


class AlertaFinanceiro(BaseModel):
    categoria: str
    tipo: str  # "excedido" | "proximo_limite" | "reserva_baixa"
    mensagem: str


class AlertasResponse(BaseModel):
    alertas: list[AlertaFinanceiro]
