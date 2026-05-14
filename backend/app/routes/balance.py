from datetime import UTC, datetime

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_user
from app.database.session import get_db
from app.models.user import User
from app.schemas.balance import BalanceResponse, MonthlySummary
from app.services.balance_service import BalanceService

router = APIRouter(prefix="/balance", tags=["balance"])


@router.get("", response_model=BalanceResponse)
def current_balance(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> BalanceResponse:
    return BalanceService(db).current_balance(current_user)


@router.get("/monthly", response_model=MonthlySummary)
def monthly_summary(
    year: int | None = Query(default=None, ge=1970, le=2100),
    month: int | None = Query(default=None, ge=1, le=12),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> MonthlySummary:
    now = datetime.now(UTC)
    return BalanceService(db).monthly_summary(
        current_user,
        year=year or now.year,
        month=month or now.month,
    )
