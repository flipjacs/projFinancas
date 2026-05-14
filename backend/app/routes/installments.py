from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_user
from app.database.session import get_db
from app.models.user import User
from app.schemas.installment import (
    InstallmentCreate,
    InstallmentResponse,
    InstallmentUpdate,
)
from app.services.installment_service import InstallmentService

router = APIRouter(prefix="/installments", tags=["parcelamentos"])


@router.get("", response_model=list[InstallmentResponse])
def list_installments(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, gt=0, le=500),
    active_only: bool = Query(False),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[InstallmentResponse]:
    items = InstallmentService(db).list_for_user(
        current_user.id, skip=skip, limit=limit, active_only=active_only
    )
    return [InstallmentResponse.model_validate(item) for item in items]


@router.post("", response_model=InstallmentResponse, status_code=status.HTTP_201_CREATED)
def create_installment(
    payload: InstallmentCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> InstallmentResponse:
    item = InstallmentService(db).create(current_user.id, payload)
    return InstallmentResponse.model_validate(item)


@router.get("/{installment_id}", response_model=InstallmentResponse)
def get_installment(
    installment_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> InstallmentResponse:
    item = InstallmentService(db).get_owned(current_user.id, installment_id)
    return InstallmentResponse.model_validate(item)


@router.put("/{installment_id}", response_model=InstallmentResponse)
def update_installment(
    installment_id: int,
    payload: InstallmentUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> InstallmentResponse:
    item = InstallmentService(db).update(current_user.id, installment_id, payload)
    return InstallmentResponse.model_validate(item)


@router.delete("/{installment_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_installment(
    installment_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> None:
    InstallmentService(db).delete(current_user.id, installment_id)
