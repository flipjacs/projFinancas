"""installments table

Revision ID: 0002_installments
Revises: 0001_initial
Create Date: 2026-05-13

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "0002_installments"
down_revision: Union[str, None] = "0001_initial"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "installments",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("product_name", sa.String(length=180), nullable=False),
        sa.Column("total_amount", sa.Numeric(12, 2), nullable=False),
        sa.Column("installment_value", sa.Numeric(12, 2), nullable=False),
        sa.Column("total_installments", sa.Integer(), nullable=False),
        sa.Column("remaining_installments", sa.Integer(), nullable=False),
        sa.Column("purchase_date", sa.Date(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
        sa.ForeignKeyConstraint(
            ["user_id"], ["users.id"], ondelete="CASCADE", name="fk_installments_user_id"
        ),
        sa.CheckConstraint(
            "total_amount > 0", name="ck_installments_total_amount_positive"
        ),
        sa.CheckConstraint(
            "installment_value > 0",
            name="ck_installments_installment_value_positive",
        ),
        sa.CheckConstraint(
            "total_installments > 0",
            name="ck_installments_total_installments_positive",
        ),
        sa.CheckConstraint(
            "remaining_installments >= 0",
            name="ck_installments_remaining_non_negative",
        ),
        sa.CheckConstraint(
            "remaining_installments <= total_installments",
            name="ck_installments_remaining_within_total",
        ),
    )
    op.create_index("ix_installments_user_id", "installments", ["user_id"])
    op.create_index(
        "ix_installments_purchase_date", "installments", ["purchase_date"]
    )


def downgrade() -> None:
    op.drop_index("ix_installments_purchase_date", table_name="installments")
    op.drop_index("ix_installments_user_id", table_name="installments")
    op.drop_table("installments")
