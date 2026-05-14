"""planejamento financeiro: distribuicao e objetivos

Revision ID: 0004_planejamento
Revises: 0003_discipline_mode
Create Date: 2026-05-14

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "0004_planejamento"
down_revision: Union[str, None] = "0003_discipline_mode"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "distribuicao_financeira",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("usuario_id", sa.Integer(), nullable=False),
        sa.Column("categoria", sa.String(length=80), nullable=False),
        sa.Column("tipo_categoria", sa.String(length=40), nullable=False),
        sa.Column("tipo_distribuicao", sa.String(length=20), nullable=False),
        sa.Column(
            "valor", sa.Numeric(12, 2), nullable=False, server_default="0.00"
        ),
        sa.Column(
            "porcentagem", sa.Numeric(5, 2), nullable=False, server_default="0.00"
        ),
        sa.Column(
            "limite_mensal",
            sa.Numeric(12, 2),
            nullable=False,
            server_default="0.00",
        ),
        sa.Column(
            "criado_em",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
        sa.ForeignKeyConstraint(
            ["usuario_id"],
            ["users.id"],
            ondelete="CASCADE",
            name="fk_distribuicao_usuario_id",
        ),
        sa.CheckConstraint(
            "tipo_distribuicao IN ('valor_fixo', 'porcentagem')",
            name="ck_distribuicao_tipo_valido",
        ),
        sa.CheckConstraint("valor >= 0", name="ck_distribuicao_valor_non_negative"),
        sa.CheckConstraint(
            "porcentagem >= 0 AND porcentagem <= 100",
            name="ck_distribuicao_porcentagem_range",
        ),
        sa.CheckConstraint(
            "limite_mensal >= 0", name="ck_distribuicao_limite_non_negative"
        ),
    )
    op.create_index(
        "ix_distribuicao_usuario_id",
        "distribuicao_financeira",
        ["usuario_id"],
    )

    op.create_table(
        "objetivos_financeiros",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("usuario_id", sa.Integer(), nullable=False),
        sa.Column("nome", sa.String(length=120), nullable=False),
        sa.Column("valor_meta", sa.Numeric(12, 2), nullable=False),
        sa.Column(
            "valor_atual", sa.Numeric(12, 2), nullable=False, server_default="0.00"
        ),
        sa.Column("prazo_meses", sa.Integer(), nullable=False),
        sa.Column(
            "criado_em",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
        sa.ForeignKeyConstraint(
            ["usuario_id"],
            ["users.id"],
            ondelete="CASCADE",
            name="fk_objetivos_usuario_id",
        ),
        sa.CheckConstraint("valor_meta > 0", name="ck_objetivo_meta_positivo"),
        sa.CheckConstraint("valor_atual >= 0", name="ck_objetivo_atual_non_negative"),
        sa.CheckConstraint("prazo_meses > 0", name="ck_objetivo_prazo_positivo"),
    )
    op.create_index(
        "ix_objetivos_usuario_id",
        "objetivos_financeiros",
        ["usuario_id"],
    )


def downgrade() -> None:
    op.drop_index("ix_objetivos_usuario_id", table_name="objetivos_financeiros")
    op.drop_table("objetivos_financeiros")
    op.drop_index("ix_distribuicao_usuario_id", table_name="distribuicao_financeira")
    op.drop_table("distribuicao_financeira")
