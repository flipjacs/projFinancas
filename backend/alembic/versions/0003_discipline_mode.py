"""discipline_mode table

Revision ID: 0003_discipline_mode
Revises: 0002_installments
Create Date: 2026-05-13

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "0003_discipline_mode"
down_revision: Union[str, None] = "0002_installments"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "discipline_mode",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column(
            "max_leisure_percentage",
            sa.Numeric(5, 2),
            nullable=False,
            server_default="15.00",
        ),
        sa.Column(
            "max_installment_percentage",
            sa.Numeric(5, 2),
            nullable=False,
            server_default="30.00",
        ),
        sa.Column(
            "emergency_reserve_goal",
            sa.Numeric(12, 2),
            nullable=False,
            server_default="0.00",
        ),
        sa.Column(
            "current_discipline_score",
            sa.Integer(),
            nullable=False,
            server_default="0",
        ),
        sa.Column("streak_days", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("last_evaluated_date", sa.Date(), nullable=True),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
        sa.ForeignKeyConstraint(
            ["user_id"],
            ["users.id"],
            ondelete="CASCADE",
            name="fk_discipline_mode_user_id",
        ),
        sa.UniqueConstraint("user_id", name="uq_discipline_mode_user_id"),
        sa.CheckConstraint(
            "max_leisure_percentage >= 0 AND max_leisure_percentage <= 100",
            name="ck_discipline_mode_leisure_pct_range",
        ),
        sa.CheckConstraint(
            "max_installment_percentage >= 0 AND max_installment_percentage <= 100",
            name="ck_discipline_mode_installment_pct_range",
        ),
        sa.CheckConstraint(
            "emergency_reserve_goal >= 0",
            name="ck_discipline_mode_reserve_non_negative",
        ),
        sa.CheckConstraint(
            "current_discipline_score >= 0 AND current_discipline_score <= 100",
            name="ck_discipline_mode_score_range",
        ),
        sa.CheckConstraint(
            "streak_days >= 0", name="ck_discipline_mode_streak_non_negative"
        ),
    )


def downgrade() -> None:
    op.drop_table("discipline_mode")
