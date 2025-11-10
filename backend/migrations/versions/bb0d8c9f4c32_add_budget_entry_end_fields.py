"""add end controls to budget entries

Revision ID: bb0d8c9f4c32
Revises: a8f0f4d3a4b0
Create Date: 2025-11-09 19:25:00.000000
"""

from alembic import op
import sqlalchemy as sa


revision = "bb0d8c9f4c32"
down_revision = "a8f0f4d3a4b0"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "budget_entries",
        sa.Column("end_date", sa.DateTime(timezone=True), nullable=True),
    )
    op.add_column(
        "budget_entries",
        sa.Column("max_occurrences", sa.Integer(), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("budget_entries", "max_occurrences")
    op.drop_column("budget_entries", "end_date")

