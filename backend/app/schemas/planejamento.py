from datetime import datetime
from decimal import Decimal
from enum import StrEnum

from pydantic import BaseModel, ConfigDict, Field, model_validator


class TipoDistribuicao(StrEnum):
    VALOR_FIXO = "valor_fixo"
    PORCENTAGEM = "porcentagem"


class TipoCategoria(StrEnum):
    """Categoria PRINCIPAL do orçamento.

    "Fundo Viagem" e "Objetivos Tech" não aparecem mais aqui — viraram
    *subcategoria* de `OBJETIVOS`, com um `ObjetivoFinanceiro` linkado.
    Mantemos os valores antigos por compat. com bases já populadas.
    """

    FIXO = "Fixo"
    RESERVA = "Reserva"
    ALIMENTACAO = "Alimentacao"
    LAZER = "Lazer"
    TRANSPORTE = "Transporte"
    EDUCACAO = "Educacao"
    SAUDE = "Saude"
    OBJETIVOS = "Objetivos"
    OUTROS = "Outros"
    # Valores legados (não devem ser oferecidos na UI nova)
    FUNDO_VIAGEM = "Fundo Viagem"
    OBJETIVOS_TECH = "Objetivos Tech"


# ---------- Distribuição ----------


class ObjetivoInline(BaseModel):
    """Payload usado para criar um objetivo junto com a distribuição."""

    nome: str = Field(min_length=1, max_length=120)
    valor_meta: Decimal = Field(gt=0, decimal_places=2)
    valor_atual: Decimal = Field(default=Decimal("0"), ge=0, decimal_places=2)
    prazo_meses: int = Field(gt=0, le=600)


class DistribuicaoBase(BaseModel):
    categoria: str = Field(min_length=1, max_length=80)
    tipo_categoria: TipoCategoria
    subcategoria: str | None = Field(default=None, max_length=80)
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
    # Quando `tipo_categoria == Objetivos`, o sistema espera ou um
    # `objetivo_relacionado_id` apontando para um objetivo existente, ou um
    # `objetivo` inline com os dados pra criar um novo.
    objetivo_relacionado_id: int | None = None
    objetivo: ObjetivoInline | None = None


class DistribuicaoUpdate(BaseModel):
    categoria: str | None = Field(default=None, min_length=1, max_length=80)
    tipo_categoria: TipoCategoria | None = None
    subcategoria: str | None = Field(default=None, max_length=80)
    tipo_distribuicao: TipoDistribuicao | None = None
    valor: Decimal | None = Field(default=None, ge=0, decimal_places=2)
    porcentagem: Decimal | None = Field(default=None, ge=0, le=100, decimal_places=2)
    limite_mensal: Decimal | None = Field(default=None, ge=0, decimal_places=2)
    objetivo_relacionado_id: int | None = None


class DistribuicaoResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    usuario_id: int
    categoria: str
    tipo_categoria: str
    subcategoria: str | None
    tipo_distribuicao: str
    valor: Decimal
    porcentagem: Decimal
    limite_mensal: Decimal
    objetivo_relacionado_id: int | None
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
    subcategoria: str | None = None
    tipo_distribuicao: str
    valor_planejado: Decimal
    porcentagem_planejada: Decimal
    limite_mensal: Decimal
    gasto_atual: Decimal
    percentual_utilizado: Decimal
    excedido: bool
    proximo_do_limite: bool
    objetivo_relacionado_id: int | None = None


class ResumoComportamental(BaseModel):
    """Agrega o gasto por categoria comportamental (essencial, lazer, ...)."""

    essencial: Decimal
    lazer: Decimal
    crescimento: Decimal
    sobrevivencia: Decimal
    emocional: Decimal


class GastoFixoItem(BaseModel):
    """Item da composição automática da categoria 'Fixo'."""

    id: int
    title: str
    category: str
    amount: Decimal


class PlanejamentoResumo(BaseModel):
    salario: Decimal
    total_distribuido: Decimal
    porcentagem_comprometida: Decimal
    saldo_restante: Decimal
    total_gasto_mes: Decimal
    # Total absoluto dos gastos marcados como recorrentes — alimenta o
    # envelope "Fixo" independentemente da categoria base de cada um.
    total_gastos_fixos: Decimal
    composicao_fixos: list[GastoFixoItem]
    categorias: list[CategoriaResumo]
    comportamental: ResumoComportamental


class AlertaFinanceiro(BaseModel):
    categoria: str
    tipo: str  # "excedido" | "proximo_limite" | "reserva_baixa"
    mensagem: str


class AlertasResponse(BaseModel):
    alertas: list[AlertaFinanceiro]
