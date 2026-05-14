from datetime import datetime
from decimal import Decimal
from typing import TYPE_CHECKING

from sqlalchemy import (
    CheckConstraint,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    Numeric,
    String,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base

if TYPE_CHECKING:
    from app.models.user import User


class DistribuicaoFinanceira(Base):
    """Categoria do plano de distribuição de renda do usuário.

    Cada linha representa um "envelope" do orçamento — Fixo, Lazer, Reserva,
    Objetivos Tech, etc. — e diz quanto da renda mensal vai para ele, seja
    como um valor fixo (R$) ou como porcentagem do salário.
    """

    __tablename__ = "distribuicao_financeira"
    __table_args__ = (
        CheckConstraint(
            "tipo_distribuicao IN ('valor_fixo', 'porcentagem')",
            name="ck_distribuicao_tipo_valido",
        ),
        CheckConstraint("valor >= 0", name="ck_distribuicao_valor_non_negative"),
        CheckConstraint(
            "porcentagem >= 0 AND porcentagem <= 100",
            name="ck_distribuicao_porcentagem_range",
        ),
        CheckConstraint(
            "limite_mensal >= 0", name="ck_distribuicao_limite_non_negative"
        ),
        Index("ix_distribuicao_usuario_id", "usuario_id"),
    )

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    usuario_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    categoria: Mapped[str] = mapped_column(String(80), nullable=False)
    tipo_categoria: Mapped[str] = mapped_column(String(40), nullable=False)
    tipo_distribuicao: Mapped[str] = mapped_column(String(20), nullable=False)
    valor: Mapped[Decimal] = mapped_column(
        Numeric(12, 2), nullable=False, default=Decimal("0")
    )
    porcentagem: Mapped[Decimal] = mapped_column(
        Numeric(5, 2), nullable=False, default=Decimal("0")
    )
    limite_mensal: Mapped[Decimal] = mapped_column(
        Numeric(12, 2), nullable=False, default=Decimal("0")
    )
    criado_em: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    user: Mapped["User"] = relationship(back_populates="distribuicoes")


class ObjetivoFinanceiro(Base):
    """Meta de poupança do usuário (ex.: iPhone 15 Pro, R$4000 em 6 meses)."""

    __tablename__ = "objetivos_financeiros"
    __table_args__ = (
        CheckConstraint("valor_meta > 0", name="ck_objetivo_meta_positivo"),
        CheckConstraint("valor_atual >= 0", name="ck_objetivo_atual_non_negative"),
        CheckConstraint("prazo_meses > 0", name="ck_objetivo_prazo_positivo"),
        Index("ix_objetivos_usuario_id", "usuario_id"),
    )

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    usuario_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    nome: Mapped[str] = mapped_column(String(120), nullable=False)
    valor_meta: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    valor_atual: Mapped[Decimal] = mapped_column(
        Numeric(12, 2), nullable=False, default=Decimal("0")
    )
    prazo_meses: Mapped[int] = mapped_column(Integer, nullable=False)
    criado_em: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    user: Mapped["User"] = relationship(back_populates="objetivos")
