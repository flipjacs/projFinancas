"""earmark de gasto para uma distribuicao específica

Revision ID: 0006_expense_distribuicao_link
Revises: 0005_categoria_comportamental
Create Date: 2026-05-14

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "0006_expense_distribuicao_link"
down_revision: Union[str, None] = "0005_categoria_comportamental"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    with op.batch_alter_table("expenses") as batch:
        batch.add_column(
            sa.Column("distribuicao_id", sa.Integer(), nullable=True)
        )
        batch.create_foreign_key(
            "fk_expenses_distribuicao_id",
            "distribuicao_financeira",
            ["distribuicao_id"],
            ["id"],
            ondelete="SET NULL",
        )


def downgrade() -> None:
    with op.batch_alter_table("expenses") as batch:
        batch.drop_constraint("fk_expenses_distribuicao_id", type_="foreignkey")
        batch.drop_column("distribuicao_id")
