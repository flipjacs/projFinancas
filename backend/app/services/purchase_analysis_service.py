from decimal import Decimal

from sqlalchemy.orm import Session

from app.models.user import User
from app.repositories.expense_repository import ExpenseRepository
from app.repositories.installment_repository import InstallmentRepository
from app.schemas.financial import (
    CanIBuyRequest,
    CanIBuyResponse,
    RiskLevel,
    SafeInstallmentSuggestion,
)
from app.services.financial_calculations import (
    build_recommendation,
    build_warnings,
    classify_risk,
    committed_percentage,
    financial_health_score,
    installment_value,
    monthly_installment_commitment,
    suggest_safe_installments,
)


class PurchaseAnalysisService:
    """
    Evaluates the financial impact of a hypothetical installment purchase
    against the user's salary, recurring expenses and current installments.
    """

    def __init__(self, db: Session) -> None:
        self.expenses = ExpenseRepository(db)
        self.installments = InstallmentRepository(db)

    def can_i_buy(self, user: User, request: CanIBuyRequest) -> CanIBuyResponse:
        salary = Decimal(user.monthly_salary)
        recurring = self.expenses.total_recurring(user.id)
        current_commitment = monthly_installment_commitment(
            self.installments.list_active_by_user(user.id)
        )
        existing_committed = recurring + current_commitment

        new_value = installment_value(request.product_price, request.installments)
        total_committed = existing_committed + new_value
        remaining_after = salary - total_committed
        impact_pct = committed_percentage(total_committed, salary)
        risk = classify_risk(impact_pct)
        approved = (
            salary > 0 and remaining_after >= 0 and risk is not RiskLevel.HIGH
        )

        suggestions = [
            SafeInstallmentSuggestion(
                installments=n,
                installment_value=value,
                monthly_impact_percentage=pct,
                risk_level=risk_level,
            )
            for n, value, pct, risk_level in suggest_safe_installments(
                request.product_price, salary, existing_committed
            )
        ]

        return CanIBuyResponse(
            approved=approved,
            risk_level=risk,
            monthly_impact_percentage=impact_pct,
            new_installment_value=new_value,
            remaining_balance_after_purchase=remaining_after,
            salary=salary,
            recurring_expenses=recurring,
            current_installment_commitment=current_commitment,
            total_committed_after_purchase=total_committed,
            financial_health_score=financial_health_score(
                impact_pct, remaining_after, salary
            ),
            recommendation=build_recommendation(risk, remaining_after, salary),
            warnings=build_warnings(
                salary=salary,
                remaining_after=remaining_after,
                new_installment=new_value,
                monthly_impact_pct=impact_pct,
                existing_committed=existing_committed,
            ),
            safe_installment_suggestions=suggestions,
        )
