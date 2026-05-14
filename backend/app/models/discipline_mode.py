from datetime import date, datetime
from decimal import Decimal
from typing import TYPE_CHECKING

from sqlalchemy import (
    CheckConstraint,
    Date,
    DateTime,
    ForeignKey,
    Integer,
    Numeric,
    UniqueConstraint,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base
from app.services.discipline_constants import (
    DEFAULT_EMERGENCY_RESERVE_GOAL,
    DEFAULT_MAX_INSTALLMENT_PCT,
    DEFAULT_MAX_LEISURE_PCT,
)

if TYPE_CHECKING:
    from app.models.user import User


class DisciplineMode(Base):
    __tablename__ = "discipline_mode"
    __table_args__ = (
        UniqueConstraint("user_id", name="uq_discipline_mode_user_id"),
        CheckConstraint(
            "max_leisure_percentage >= 0 AND max_leisure_percentage <= 100",
            name="ck_discipline_mode_leisure_pct_range",
        ),
        CheckConstraint(
            "max_installment_percentage >= 0 AND max_installment_percentage <= 100",
            name="ck_discipline_mode_installment_pct_range",
        ),
        CheckConstraint(
            "emergency_reserve_goal >= 0",
            name="ck_discipline_mode_reserve_non_negative",
        ),
        CheckConstraint(
            "current_discipline_score >= 0 AND current_discipline_score <= 100",
            name="ck_discipline_mode_score_range",
        ),
        CheckConstraint(
            "streak_days >= 0", name="ck_discipline_mode_streak_non_negative"
        ),
    )

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    max_leisure_percentage: Mapped[Decimal] = mapped_column(
        Numeric(5, 2), nullable=False, default=DEFAULT_MAX_LEISURE_PCT
    )
    max_installment_percentage: Mapped[Decimal] = mapped_column(
        Numeric(5, 2), nullable=False, default=DEFAULT_MAX_INSTALLMENT_PCT
    )
    emergency_reserve_goal: Mapped[Decimal] = mapped_column(
        Numeric(12, 2), nullable=False, default=DEFAULT_EMERGENCY_RESERVE_GOAL
    )
    current_discipline_score: Mapped[int] = mapped_column(
        Integer, nullable=False, default=0
    )
    streak_days: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    last_evaluated_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    user: Mapped["User"] = relationship(back_populates="discipline_mode")
