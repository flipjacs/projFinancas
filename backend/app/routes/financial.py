from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_user
from app.database.session import get_db
from app.models.user import User
from app.schemas.financial import FutureBalanceResponse, MonthSummary
from app.services.financial_service import FinancialService

router = APIRouter(prefix="/financial", tags=["financial"])


@router.get("/month-summary", response_model=MonthSummary)
def month_summary(
    year: int | None = Query(default=None, ge=1970, le=2100),
    month: int | None = Query(default=None, ge=1, le=12),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> MonthSummary:
    return FinancialService(db).month_summary(current_user, year=year, month=month)


@router.get("/future-balance", response_model=FutureBalanceResponse)
def future_balance(
    months: int = Query(default=12, ge=1, le=120),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> FutureBalanceResponse:
    return FinancialService(db).future_balance(current_user, months=months)
