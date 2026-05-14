"""initial schema: users and expenses

Revision ID: 0001_initial
Revises:
Create Date: 2026-05-13

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "0001_initial"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("name", sa.String(length=120), nullable=False),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("hashed_password", sa.String(length=255), nullable=False),
        sa.Column("monthly_salary", sa.Numeric(12, 2), nullable=False, server_default="0"),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
        sa.UniqueConstraint("email", name="uq_users_email"),
    )
    op.create_index("ix_users_email", "users", ["email"], unique=True)

    op.create_table(
        "expenses",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("title", sa.String(length=180), nullable=False),
        sa.Column("amount", sa.Numeric(12, 2), nullable=False),
        sa.Column("category", sa.String(length=60), nullable=False),
        sa.Column("recurring", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
        sa.ForeignKeyConstraint(
            ["user_id"], ["users.id"], ondelete="CASCADE", name="fk_expenses_user_id"
        ),
        sa.CheckConstraint("amount >= 0", name="ck_expenses_amount_non_negative"),
    )
    op.create_index("ix_expenses_user_id", "expenses", ["user_id"])
    op.create_index("ix_expenses_category", "expenses", ["category"])
    op.create_index("ix_expenses_created_at", "expenses", ["created_at"])


def downgrade() -> None:
    op.drop_index("ix_expenses_created_at", table_name="expenses")
    op.drop_index("ix_expenses_category", table_name="expenses")
    op.drop_index("ix_expenses_user_id", table_name="expenses")
    op.drop_table("expenses")
    op.drop_index("ix_users_email", table_name="users")
    op.drop_table("users")
