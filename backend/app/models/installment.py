from datetime import date, datetime
from decimal import Decimal
from typing import TYPE_CHECKING

from sqlalchemy import (
    CheckConstraint,
    Date,
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


class Installment(Base):
    __tablename__ = "installments"
    __table_args__ = (
        CheckConstraint("total_amount > 0", name="ck_installments_total_amount_positive"),
        CheckConstraint(
            "installment_value > 0", name="ck_installments_installment_value_positive"
        ),
        CheckConstraint(
            "total_installments > 0", name="ck_installments_total_installments_positive"
        ),
        CheckConstraint(
            "remaining_installments >= 0",
            name="ck_installments_remaining_non_negative",
        ),
        CheckConstraint(
            "remaining_installments <= total_installments",
            name="ck_installments_remaining_within_total",
        ),
        Index("ix_installments_user_id", "user_id"),
        Index("ix_installments_purchase_date", "purchase_date"),
    )

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    product_name: Mapped[str] = mapped_column(String(180), nullable=False)
    total_amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    installment_value: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    total_installments: Mapped[int] = mapped_column(Integer, nullable=False)
    remaining_installments: Mapped[int] = mapped_column(Integer, nullable=False)
    purchase_date: Mapped[date] = mapped_column(Date, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    user: Mapped["User"] = relationship(back_populates="installments")
