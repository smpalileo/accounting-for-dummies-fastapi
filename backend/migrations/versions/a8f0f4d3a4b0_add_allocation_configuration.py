"""add allocation configuration json column

Revision ID: a8f0f4d3a4b0
Revises: 9d3d0b21c6e4
Create Date: 2025-11-09 19:05:00.000000
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = "a8f0f4d3a4b0"
down_revision = "9d3d0b21c6e4"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "allocations",
        sa.Column("configuration", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("allocations", "configuration")

