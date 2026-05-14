"""categoria comportamental e hierarquia de distribuicao

Revision ID: 0005_categoria_comportamental
Revises: 0004_planejamento
Create Date: 2026-05-14

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "0005_categoria_comportamental"
down_revision: Union[str, None] = "0004_planejamento"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    with op.batch_alter_table("expenses") as batch:
        batch.add_column(
            sa.Column("categoria_comportamental", sa.String(length=20), nullable=True)
        )
        batch.add_column(
            sa.Column("impacto_financeiro", sa.String(length=10), nullable=True)
        )

    with op.batch_alter_table("distribuicao_financeira") as batch:
        batch.add_column(sa.Column("subcategoria", sa.String(length=80), nullable=True))
        batch.add_column(
            sa.Column("objetivo_relacionado_id", sa.Integer(), nullable=True)
        )
        batch.create_foreign_key(
            "fk_distribuicao_objetivo_id",
            "objetivos_financeiros",
            ["objetivo_relacionado_id"],
            ["id"],
            ondelete="SET NULL",
        )


def downgrade() -> None:
    with op.batch_alter_table("distribuicao_financeira") as batch:
        batch.drop_constraint("fk_distribuicao_objetivo_id", type_="foreignkey")
        batch.drop_column("objetivo_relacionado_id")
        batch.drop_column("subcategoria")

    with op.batch_alter_table("expenses") as batch:
        batch.drop_column("impacto_financeiro")
        batch.drop_column("categoria_comportamental")
