from datetime import date
from decimal import Decimal

from sqlalchemy import desc, func, select
from sqlalchemy.orm import Session

from app.models.installment import Installment


class InstallmentRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def get_by_id(self, installment_id: int) -> Installment | None:
        return self.db.get(Installment, installment_id)

    def list_by_user(
        self,
        user_id: int,
        skip: int = 0,
        limit: int = 100,
        active_only: bool = False,
    ) -> list[Installment]:
        stmt = select(Installment).where(Installment.user_id == user_id)
        if active_only:
            stmt = stmt.where(Installment.remaining_installments > 0)
        stmt = stmt.order_by(desc(Installment.purchase_date)).offset(skip).limit(limit)
        return list(self.db.execute(stmt).scalars().all())

    def list_active_by_user(self, user_id: int) -> list[Installment]:
        stmt = select(Installment).where(
            Installment.user_id == user_id,
            Installment.remaining_installments > 0,
        )
        return list(self.db.execute(stmt).scalars().all())

    def monthly_commitment(self, user_id: int) -> Decimal:
        stmt = select(
            func.coalesce(func.sum(Installment.installment_value), 0)
        ).where(
            Installment.user_id == user_id,
            Installment.remaining_installments > 0,
        )
        return Decimal(self.db.execute(stmt).scalar_one())

    def create(
        self,
        user_id: int,
        product_name: str,
        total_amount: Decimal,
        installment_value: Decimal,
        total_installments: int,
        remaining_installments: int,
        purchase_date: date,
    ) -> Installment:
        installment = Installment(
            user_id=user_id,
            product_name=product_name,
            total_amount=total_amount,
            installment_value=installment_value,
            total_installments=total_installments,
            remaining_installments=remaining_installments,
            purchase_date=purchase_date,
        )
        self.db.add(installment)
        self.db.commit()
        self.db.refresh(installment)
        return installment

    def update(
        self,
        installment: Installment,
        product_name: str | None = None,
        total_amount: Decimal | None = None,
        installment_value: Decimal | None = None,
        total_installments: int | None = None,
        remaining_installments: int | None = None,
        purchase_date: date | None = None,
    ) -> Installment:
        if product_name is not None:
            installment.product_name = product_name
        if total_amount is not None:
            installment.total_amount = total_amount
        if installment_value is not None:
            installment.installment_value = installment_value
        if total_installments is not None:
            installment.total_installments = total_installments
        if remaining_installments is not None:
            installment.remaining_installments = remaining_installments
        if purchase_date is not None:
            installment.purchase_date = purchase_date
        self.db.commit()
        self.db.refresh(installment)
        return installment

    def delete(self, installment: Installment) -> None:
        self.db.delete(installment)
        self.db.commit()
