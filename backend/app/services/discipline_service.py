from datetime import UTC, date, datetime
from decimal import Decimal

from sqlalchemy.orm import Session

from app.models.discipline_mode import DisciplineMode
from app.models.user import User
from app.repositories.discipline_repository import DisciplineRepository
from app.repositories.expense_repository import ExpenseRepository
from app.repositories.installment_repository import InstallmentRepository
from app.schemas.discipline import (
    DisciplineMetrics,
    DisciplineSettings,
    DisciplineSettingsUpdate,
    DisciplineStatusResponse,
)
from app.services.discipline_calculations import (
    DisciplineThresholds,
    SpendingMetrics,
    compute_discipline_score,
    derive_percentages,
    generate_warnings,
    is_compliant,
    next_streak,
)
from app.services.discipline_constants import (
    LEISURE_CATEGORIES,
    SAVINGS_CATEGORY,
)
from app.services.financial_calculations import monthly_installment_commitment


def _month_range(today: date) -> tuple[datetime, datetime]:
    start = datetime(today.year, today.month, 1, tzinfo=UTC)
    if today.month == 12:
        end = datetime(today.year + 1, 1, 1, tzinfo=UTC)
    else:
        end = datetime(today.year, today.month + 1, 1, tzinfo=UTC)
    return start, end


class DisciplineService:
    def __init__(self, db: Session) -> None:
        self.discipline = DisciplineRepository(db)
        self.expenses = ExpenseRepository(db)
        self.installments = InstallmentRepository(db)

    def _collect_metrics(self, user: User, today: date) -> SpendingMetrics:
        start, end = _month_range(today)
        salary = Decimal(user.monthly_salary)
        recurring = self.expenses.total_recurring(user.id)
        installment_commitment = monthly_installment_commitment(
            self.installments.list_active_by_user(user.id)
        )
        # Agora a leitura de "lazer" usa a categoria comportamental — um
        # McDonald's marcado como lazer entra aqui mesmo sendo `food`. A
        # base continua sendo o fallback (entertainment/shopping).
        gastos = self.expenses.list_period_with_behavior(user.id, start, end)
        leisure = Decimal("0")
        savings = Decimal("0")
        for exp in gastos:
            comp = exp.categoria_comportamental
            if comp == "lazer" or comp == "emocional":
                leisure += Decimal(exp.amount)
            elif (
                comp is None
                and exp.category in LEISURE_CATEGORIES
            ):
                # Sem comportamental marcado, caímos no comportamento legado.
                leisure += Decimal(exp.amount)
            if exp.category == SAVINGS_CATEGORY:
                savings += Decimal(exp.amount)
        return SpendingMetrics(
            salary=salary,
            leisure_spending=leisure,
            savings_amount=savings,
            installment_commitment=installment_commitment,
            recurring_expenses=recurring,
        )

    def _evaluate(
        self, user: User, mode: DisciplineMode, today: date
    ) -> tuple[DisciplineMode, SpendingMetrics, dict[str, Decimal], list[str]]:
        metrics = self._collect_metrics(user, today)
        thresholds = DisciplineThresholds(
            max_leisure_pct=Decimal(mode.max_leisure_percentage),
            max_installment_pct=Decimal(mode.max_installment_percentage),
        )
        percentages = derive_percentages(metrics)
        warnings = generate_warnings(percentages, thresholds, metrics.salary)
        score = compute_discipline_score(percentages, thresholds)
        streak = next_streak(
            today=today,
            last_evaluated_date=mode.last_evaluated_date,
            previous_streak=mode.streak_days,
            compliant_today=is_compliant(warnings),
        )
        mode = self.discipline.update_evaluation(
            mode, score=score, streak_days=streak, evaluated_on=today
        )
        return mode, metrics, percentages, warnings

    def _today(self) -> date:
        return datetime.now(UTC).date()

    def get_status(self, user: User) -> DisciplineStatusResponse:
        mode = self.discipline.get_or_create(user.id)
        mode, metrics, percentages, warnings = self._evaluate(
            user, mode, self._today()
        )
        return DisciplineStatusResponse(
            score=mode.current_discipline_score,
            streak_days=mode.streak_days,
            last_evaluated_date=mode.last_evaluated_date,
            settings=DisciplineSettings.model_validate(mode),
            metrics=DisciplineMetrics(
                salary=metrics.salary,
                leisure_spending=metrics.leisure_spending,
                leisure_percentage=percentages["leisure_pct"],
                savings_amount=metrics.savings_amount,
                savings_percentage=percentages["savings_pct"],
                installment_commitment=metrics.installment_commitment,
                installment_percentage=percentages["installment_pct"],
                total_committed_percentage=percentages["total_committed_pct"],
            ),
            warnings=warnings,
            updated_at=mode.updated_at,
        )

    def get_warnings(self, user: User) -> list[str]:
        mode = self.discipline.get_or_create(user.id)
        _, _, _, warnings = self._evaluate(user, mode, self._today())
        return warnings

    def get_score(self, user: User) -> DisciplineMode:
        mode = self.discipline.get_or_create(user.id)
        mode, _, _, _ = self._evaluate(user, mode, self._today())
        return mode

    def update_settings(
        self, user: User, payload: DisciplineSettingsUpdate
    ) -> DisciplineStatusResponse:
        mode = self.discipline.get_or_create(user.id)
        mode = self.discipline.update_settings(
            mode,
            max_leisure_percentage=payload.max_leisure_percentage,
            max_installment_percentage=payload.max_installment_percentage,
            emergency_reserve_goal=payload.emergency_reserve_goal,
        )
        return self.get_status(user)
