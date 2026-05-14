from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_user
from app.database.session import get_db
from app.models.user import User
from app.schemas.discipline import (
    DisciplineScoreResponse,
    DisciplineSettingsUpdate,
    DisciplineStatusResponse,
    DisciplineWarningsResponse,
)
from app.services.discipline_service import DisciplineService

router = APIRouter(prefix="/discipline", tags=["discipline"])


@router.get("/status", response_model=DisciplineStatusResponse)
def get_discipline_status(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> DisciplineStatusResponse:
    return DisciplineService(db).get_status(current_user)


@router.get("/score", response_model=DisciplineScoreResponse)
def get_discipline_score(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> DisciplineScoreResponse:
    mode = DisciplineService(db).get_score(current_user)
    return DisciplineScoreResponse(
        score=mode.current_discipline_score,
        streak_days=mode.streak_days,
        last_evaluated_date=mode.last_evaluated_date,
    )


@router.get("/warnings", response_model=DisciplineWarningsResponse)
def get_discipline_warnings(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> DisciplineWarningsResponse:
    warnings = DisciplineService(db).get_warnings(current_user)
    return DisciplineWarningsResponse(warnings=warnings)


@router.put("/settings", response_model=DisciplineStatusResponse)
def update_discipline_settings(
    payload: DisciplineSettingsUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> DisciplineStatusResponse:
    return DisciplineService(db).update_settings(current_user, payload)
