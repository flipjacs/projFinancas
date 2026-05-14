from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.installment import Installment
from app.repositories.installment_repository import InstallmentRepository
from app.schemas.installment import InstallmentCreate, InstallmentUpdate


class InstallmentService:
    def __init__(self, db: Session) -> None:
        self.installments = InstallmentRepository(db)

    def list_for_user(
        self,
        user_id: int,
        skip: int = 0,
        limit: int = 100,
        active_only: bool = False,
    ) -> list[Installment]:
        return self.installments.list_by_user(
            user_id, skip=skip, limit=limit, active_only=active_only
        )

    def get_owned(self, user_id: int, installment_id: int) -> Installment:
        installment = self.installments.get_by_id(installment_id)
        if installment is None or installment.user_id != user_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Parcelamento não encontrado",
            )
        return installment

    def create(self, user_id: int, data: InstallmentCreate) -> Installment:
        remaining = (
            data.remaining_installments
            if data.remaining_installments is not None
            else data.total_installments
        )
        return self.installments.create(
            user_id=user_id,
            product_name=data.product_name,
            total_amount=data.total_amount,
            installment_value=data.installment_value,
            total_installments=data.total_installments,
            remaining_installments=remaining,
            purchase_date=data.purchase_date,
        )

    def update(
        self, user_id: int, installment_id: int, data: InstallmentUpdate
    ) -> Installment:
        installment = self.get_owned(user_id, installment_id)

        new_total = (
            data.total_installments
            if data.total_installments is not None
            else installment.total_installments
        )
        new_remaining = (
            data.remaining_installments
            if data.remaining_installments is not None
            else installment.remaining_installments
        )
        if new_remaining > new_total:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Parcelas restantes não podem ser maiores que o total",
            )

        return self.installments.update(
            installment,
            product_name=data.product_name,
            total_amount=data.total_amount,
            installment_value=data.installment_value,
            total_installments=data.total_installments,
            remaining_installments=data.remaining_installments,
            purchase_date=data.purchase_date,
        )

    def delete(self, user_id: int, installment_id: int) -> None:
        installment = self.get_owned(user_id, installment_id)
        self.installments.delete(installment)
