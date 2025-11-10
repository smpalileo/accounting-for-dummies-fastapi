"""add budget period fields to allocations

Revision ID: d6f1f740e12c
Revises: c3f7b2d5e6a4
Create Date: 2025-11-10 11:30:00.000000
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = "d6f1f740e12c"
down_revision = "c3f7b2d5e6a4"
branch_labels = None
depends_on = None


allocation_period_frequency_enum = postgresql.ENUM(
    "daily",
    "weekly",
    "monthly",
    "quarterly",
    name="allocationperiodfrequency",
)


def upgrade() -> None:
    bind = op.get_bind()
    allocation_period_frequency_enum.create(bind, checkfirst=True)
    op.add_column(
        "allocations",
        sa.Column(
            "period_frequency",
            postgresql.ENUM(name="allocationperiodfrequency", create_type=False),
            nullable=True,
        ),
    )
    op.add_column("allocations", sa.Column("period_start", sa.DateTime(), nullable=True))
    op.add_column("allocations", sa.Column("period_end", sa.DateTime(), nullable=True))
    op.add_column("allocations", sa.Column("target_date", sa.DateTime(), nullable=True))


def downgrade() -> None:
    bind = op.get_bind()
    op.drop_column("allocations", "target_date")
    op.drop_column("allocations", "period_end")
    op.drop_column("allocations", "period_start")
    op.drop_column("allocations", "period_frequency")
    allocation_period_frequency_enum.drop(bind, checkfirst=True)
