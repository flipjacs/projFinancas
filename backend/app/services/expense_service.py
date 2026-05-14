from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.expense import Expense
from app.repositories.expense_repository import ExpenseRepository
from app.repositories.planejamento_repository import DistribuicaoRepository
from app.schemas.expense import ExpenseCreate, ExpenseUpdate
from app.utils.enums import (
    CategoriaComportamental,
    default_comportamental,
    default_impacto,
)


def _derive_behavior(
    base_category: str,
    comportamental: CategoriaComportamental | None,
    impacto,
) -> tuple[str, str]:
    """Preenche campos comportamentais quando o usuário não informa."""
    cat = comportamental or default_comportamental(base_category)
    imp = impacto or default_impacto(cat)
    return cat.value, imp.value


class ExpenseService:
    def __init__(self, db: Session) -> None:
        self.expenses = ExpenseRepository(db)
        self.distribuicoes = DistribuicaoRepository(db)

    def _validate_distribuicao_owner(
        self, user_id: int, distribuicao_id: int
    ) -> None:
        """Não dá pra earmark um gasto pra um envelope que não é seu."""
        item = self.distribuicoes.get_by_id(distribuicao_id)
        if item is None or item.usuario_id != user_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Distribuição informada não existe ou não pertence ao usuário",
            )

    def list_for_user(self, user_id: int, skip: int = 0, limit: int = 100) -> list[Expense]:
        return self.expenses.list_by_user(user_id, skip=skip, limit=limit)

    def get_owned(self, user_id: int, expense_id: int) -> Expense:
        expense = self.expenses.get_by_id(expense_id)
        if expense is None or expense.user_id != user_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Gasto não encontrado",
            )
        return expense

    def create(self, user_id: int, data: ExpenseCreate) -> Expense:
        comportamental, impacto = _derive_behavior(
            data.category.value,
            data.categoria_comportamental,
            data.impacto_financeiro,
        )
        if data.distribuicao_id is not None:
            self._validate_distribuicao_owner(user_id, data.distribuicao_id)
        return self.expenses.create(
            user_id=user_id,
            title=data.title,
            amount=data.amount,
            category=data.category.value,
            recurring=data.recurring,
            categoria_comportamental=comportamental,
            impacto_financeiro=impacto,
            distribuicao_id=data.distribuicao_id,
        )

    def update(self, user_id: int, expense_id: int, data: ExpenseUpdate) -> Expense:
        expense = self.get_owned(user_id, expense_id)

        # Quando o usuário trocou a categoria base sem mexer no lado
        # comportamental, recalculamos o default — caso contrário a UI
        # mostraria "alimentação + lazer" pra um gasto que virou compras.
        nova_base = data.category.value if data.category is not None else None
        novo_comportamental = data.categoria_comportamental
        novo_impacto = data.impacto_financeiro
        if (
            nova_base is not None
            and novo_comportamental is None
            and expense.categoria_comportamental is None
        ):
            comportamental, impacto = _derive_behavior(
                nova_base, None, None
            )
            novo_comportamental_value = comportamental
            novo_impacto_value = impacto
        else:
            novo_comportamental_value = (
                novo_comportamental.value
                if novo_comportamental is not None
                else None
            )
            novo_impacto_value = (
                novo_impacto.value if novo_impacto is not None else None
            )

        if data.distribuicao_id is not None and not data.desvincular_distribuicao:
            self._validate_distribuicao_owner(user_id, data.distribuicao_id)

        return self.expenses.update(
            expense,
            title=data.title,
            amount=data.amount,
            category=nova_base,
            recurring=data.recurring,
            categoria_comportamental=novo_comportamental_value,
            impacto_financeiro=novo_impacto_value,
            distribuicao_id=data.distribuicao_id,
            clear_distribuicao=data.desvincular_distribuicao,
        )

    def delete(self, user_id: int, expense_id: int) -> None:
        expense = self.get_owned(user_id, expense_id)
        self.expenses.delete(expense)
