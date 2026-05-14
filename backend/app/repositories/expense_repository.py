from datetime import datetime
from decimal import Decimal

from sqlalchemy import desc, func, select
from sqlalchemy.orm import Session

from app.models.expense import Expense


class ExpenseRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def get_by_id(self, expense_id: int) -> Expense | None:
        return self.db.get(Expense, expense_id)

    def list_by_user(
        self,
        user_id: int,
        skip: int = 0,
        limit: int = 100,
    ) -> list[Expense]:
        stmt = (
            select(Expense)
            .where(Expense.user_id == user_id)
            .order_by(desc(Expense.created_at))
            .offset(skip)
            .limit(limit)
        )
        return list(self.db.execute(stmt).scalars().all())

    def list_in_period(
        self,
        user_id: int,
        start: datetime,
        end: datetime,
    ) -> list[Expense]:
        stmt = (
            select(Expense)
            .where(
                Expense.user_id == user_id,
                Expense.created_at >= start,
                Expense.created_at < end,
            )
            .order_by(desc(Expense.created_at))
        )
        return list(self.db.execute(stmt).scalars().all())

    def total_recurring(self, user_id: int) -> Decimal:
        stmt = select(func.coalesce(func.sum(Expense.amount), 0)).where(
            Expense.user_id == user_id,
            Expense.recurring.is_(True),
        )
        return Decimal(self.db.execute(stmt).scalar_one())

    def list_recurring(self, user_id: int) -> list[Expense]:
        """Lista os gastos marcados como recorrentes — compromisso mensal
        independente da data de criação. Ordenado por maior valor primeiro
        para o agregador de "Fixo" mostrar os itens mais pesados em cima."""
        stmt = (
            select(Expense)
            .where(Expense.user_id == user_id, Expense.recurring.is_(True))
            .order_by(desc(Expense.amount))
        )
        return list(self.db.execute(stmt).scalars().all())

    def total_in_period(
        self,
        user_id: int,
        start: datetime,
        end: datetime,
    ) -> Decimal:
        stmt = select(func.coalesce(func.sum(Expense.amount), 0)).where(
            Expense.user_id == user_id,
            Expense.created_at >= start,
            Expense.created_at < end,
        )
        return Decimal(self.db.execute(stmt).scalar_one())

    def totals_by_category_in_period(
        self,
        user_id: int,
        start: datetime,
        end: datetime,
    ) -> list[tuple[str, Decimal]]:
        stmt = (
            select(Expense.category, func.coalesce(func.sum(Expense.amount), 0))
            .where(
                Expense.user_id == user_id,
                Expense.created_at >= start,
                Expense.created_at < end,
            )
            .group_by(Expense.category)
        )
        return [(row[0], Decimal(row[1])) for row in self.db.execute(stmt).all()]

    def list_period_with_behavior(
        self,
        user_id: int,
        start: datetime,
        end: datetime,
    ) -> list[Expense]:
        """Lista crua dos gastos do período — útil quando o agregador precisa
        olhar simultaneamente para `category` e `categoria_comportamental`."""
        stmt = select(Expense).where(
            Expense.user_id == user_id,
            Expense.created_at >= start,
            Expense.created_at < end,
        )
        return list(self.db.execute(stmt).scalars().all())

    def create(
        self,
        user_id: int,
        title: str,
        amount: Decimal,
        category: str,
        recurring: bool,
        categoria_comportamental: str | None = None,
        impacto_financeiro: str | None = None,
        distribuicao_id: int | None = None,
    ) -> Expense:
        expense = Expense(
            user_id=user_id,
            title=title,
            amount=amount,
            category=category,
            recurring=recurring,
            categoria_comportamental=categoria_comportamental,
            impacto_financeiro=impacto_financeiro,
            distribuicao_id=distribuicao_id,
        )
        self.db.add(expense)
        self.db.commit()
        self.db.refresh(expense)
        return expense

    def update(
        self,
        expense: Expense,
        title: str | None = None,
        amount: Decimal | None = None,
        category: str | None = None,
        recurring: bool | None = None,
        categoria_comportamental: str | None = None,
        impacto_financeiro: str | None = None,
        distribuicao_id: int | None = None,
        clear_distribuicao: bool = False,
    ) -> Expense:
        if title is not None:
            expense.title = title
        if amount is not None:
            expense.amount = amount
        if category is not None:
            expense.category = category
        if recurring is not None:
            expense.recurring = recurring
        if categoria_comportamental is not None:
            expense.categoria_comportamental = categoria_comportamental
        if impacto_financeiro is not None:
            expense.impacto_financeiro = impacto_financeiro
        if clear_distribuicao:
            expense.distribuicao_id = None
        elif distribuicao_id is not None:
            expense.distribuicao_id = distribuicao_id
        self.db.commit()
        self.db.refresh(expense)
        return expense

    def delete(self, expense: Expense) -> None:
        self.db.delete(expense)
        self.db.commit()
