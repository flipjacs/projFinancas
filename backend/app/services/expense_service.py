from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.expense import Expense
from app.repositories.expense_repository import ExpenseRepository
from app.schemas.expense import ExpenseCreate, ExpenseUpdate


class ExpenseService:
    def __init__(self, db: Session) -> None:
        self.expenses = ExpenseRepository(db)

    def list_for_user(self, user_id: int, skip: int = 0, limit: int = 100) -> list[Expense]:
        return self.expenses.list_by_user(user_id, skip=skip, limit=limit)

    def get_owned(self, user_id: int, expense_id: int) -> Expense:
        expense = self.expenses.get_by_id(expense_id)
        if expense is None or expense.user_id != user_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Expense not found",
            )
        return expense

    def create(self, user_id: int, data: ExpenseCreate) -> Expense:
        return self.expenses.create(
            user_id=user_id,
            title=data.title,
            amount=data.amount,
            category=data.category.value,
            recurring=data.recurring,
        )

    def update(self, user_id: int, expense_id: int, data: ExpenseUpdate) -> Expense:
        expense = self.get_owned(user_id, expense_id)
        return self.expenses.update(
            expense,
            title=data.title,
            amount=data.amount,
            category=data.category.value if data.category is not None else None,
            recurring=data.recurring,
        )

    def delete(self, user_id: int, expense_id: int) -> None:
        expense = self.get_owned(user_id, expense_id)
        self.expenses.delete(expense)
