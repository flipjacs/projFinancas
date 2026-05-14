from datetime import datetime
from decimal import Decimal
from typing import TYPE_CHECKING

from sqlalchemy import (
    Boolean,
    CheckConstraint,
    DateTime,
    ForeignKey,
    Index,
    Numeric,
    String,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base

if TYPE_CHECKING:
    from app.models.user import User


class Expense(Base):
    __tablename__ = "expenses"
    __table_args__ = (
        CheckConstraint("amount >= 0", name="ck_expenses_amount_non_negative"),
        Index("ix_expenses_user_id", "user_id"),
        Index("ix_expenses_category", "category"),
        Index("ix_expenses_created_at", "created_at"),
    )

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    title: Mapped[str] = mapped_column(String(180), nullable=False)
    amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    # `category` é a categoria BASE (alimentação, transporte, ...). A leitura
    # financeira refinada vem de `categoria_comportamental`.
    category: Mapped[str] = mapped_column(String(60), nullable=False)
    categoria_comportamental: Mapped[str | None] = mapped_column(
        String(20), nullable=True
    )
    impacto_financeiro: Mapped[str | None] = mapped_column(String(10), nullable=True)
    # "Earmark": quando o usuário direciona explicitamente esse gasto para um
    # envelope (ex.: aporte que pertence só à "Reserva de Emergência" e a mais
    # ninguém). Para envelopes de Reserva/Objetivos, isolation é mandatório —
    # SEM esse vínculo, o gasto não cai em nenhuma reserva. Isso evita que
    # uma "Poupança" genérica seja contada em todos os fundos ao mesmo tempo.
    distribuicao_id: Mapped[int | None] = mapped_column(
        ForeignKey("distribuicao_financeira.id", ondelete="SET NULL"),
        nullable=True,
    )
    recurring: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    user: Mapped["User"] = relationship(back_populates="expenses")
