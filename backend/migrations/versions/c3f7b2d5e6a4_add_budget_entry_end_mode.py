"""add end mode column to budget entries

Revision ID: c3f7b2d5e6a4
Revises: bb0d8c9f4c32
Create Date: 2025-11-09 20:05:00.000000
"""

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "c3f7b2d5e6a4"
down_revision = "bb0d8c9f4c32"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "budget_entries",
        sa.Column("end_mode", sa.String(length=20), nullable=False, server_default="indefinite"),
    )
    op.alter_column("budget_entries", "end_mode", server_default=None)


def downgrade() -> None:
    op.drop_column("budget_entries", "end_mode")

