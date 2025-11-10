"""add recurrence frequency to transactions

Revision ID: f23f8f325b7b
Revises: d22347b47173
Create Date: 2025-11-09 04:50:00.000000
"""

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "f23f8f325b7b"
down_revision = "d22347b47173"
branch_labels = None
depends_on = None


recurrence_frequency_enum = sa.Enum(
    "monthly", "quarterly", "semi_annual", "annual", name="recurrencefrequency"
)


def upgrade() -> None:
    bind = op.get_bind()
    recurrence_frequency_enum.create(bind, checkfirst=True)
    op.add_column(
        "transactions",
        sa.Column("recurrence_frequency", recurrence_frequency_enum, nullable=True),
    )


def downgrade() -> None:
    op.drop_column("transactions", "recurrence_frequency")
    bind = op.get_bind()
    recurrence_frequency_enum.drop(bind, checkfirst=True)


