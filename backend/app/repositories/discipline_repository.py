from datetime import date
from decimal import Decimal

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.discipline_mode import DisciplineMode


class DisciplineRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def get_by_user(self, user_id: int) -> DisciplineMode | None:
        stmt = select(DisciplineMode).where(DisciplineMode.user_id == user_id)
        return self.db.execute(stmt).scalar_one_or_none()

    def get_or_create(self, user_id: int) -> DisciplineMode:
        existing = self.get_by_user(user_id)
        if existing is not None:
            return existing
        mode = DisciplineMode(user_id=user_id)
        self.db.add(mode)
        self.db.commit()
        self.db.refresh(mode)
        return mode

    def update_settings(
        self,
        mode: DisciplineMode,
        max_leisure_percentage: Decimal | None = None,
        max_installment_percentage: Decimal | None = None,
        emergency_reserve_goal: Decimal | None = None,
    ) -> DisciplineMode:
        if max_leisure_percentage is not None:
            mode.max_leisure_percentage = max_leisure_percentage
        if max_installment_percentage is not None:
            mode.max_installment_percentage = max_installment_percentage
        if emergency_reserve_goal is not None:
            mode.emergency_reserve_goal = emergency_reserve_goal
        self.db.commit()
        self.db.refresh(mode)
        return mode

    def update_evaluation(
        self,
        mode: DisciplineMode,
        score: int,
        streak_days: int,
        evaluated_on: date,
    ) -> DisciplineMode:
        mode.current_discipline_score = score
        mode.streak_days = streak_days
        mode.last_evaluated_date = evaluated_on
        self.db.commit()
        self.db.refresh(mode)
        return mode
