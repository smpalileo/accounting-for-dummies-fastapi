"""add budget entries table and transaction link

Revision ID: 8c9f3dd8a1c1
Revises: f23f8f325b7b
Create Date: 2025-11-09 08:45:00.000000
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = "8c9f3dd8a1c1"
down_revision = "f23f8f325b7b"
branch_labels = None
depends_on = None


budget_entry_type_def = sa.Enum("income", "expense", name="budgetentrytype")
recurrence_frequency_def = sa.Enum(
    "monthly", "quarterly", "semi_annual", "annual", name="recurrencefrequency"
)
currency_type_def = sa.Enum(
    "PHP",
    "USD",
    "EUR",
    "GBP",
    "JPY",
    "AUD",
    "CAD",
    "CHF",
    "CNY",
    "SGD",
    name="currencytype",
)


def upgrade() -> None:
    op.execute(
        """
        DO $$
        BEGIN
            CREATE TYPE budgetentrytype AS ENUM ('income', 'expense');
        EXCEPTION
            WHEN duplicate_object THEN NULL;
        END $$;
        """
    )
    op.execute(
        """
        DO $$
        BEGIN
            CREATE TYPE recurrencefrequency AS ENUM ('monthly', 'quarterly', 'semi_annual', 'annual');
        EXCEPTION
            WHEN duplicate_object THEN NULL;
        END $$;
        """
    )
    op.execute(
        """
        DO $$
        BEGIN
            CREATE TYPE currencytype AS ENUM ('PHP','USD','EUR','GBP','JPY','AUD','CAD','CHF','CNY','SGD');
        EXCEPTION
            WHEN duplicate_object THEN NULL;
        END $$;
        """
    )

    op.create_table(
        "budget_entries",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column(
            "entry_type",
            postgresql.ENUM(
                "income",
                "expense",
                name="budgetentrytype",
                create_type=False,
            ),
            nullable=False,
        ),
        sa.Column("name", sa.String(length=150), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("amount", sa.Float(), nullable=False),
        sa.Column(
            "currency",
            postgresql.ENUM(
                "PHP",
                "USD",
                "EUR",
                "GBP",
                "JPY",
                "AUD",
                "CAD",
                "CHF",
                "CNY",
                "SGD",
                name="currencytype",
                create_type=False,
            ),
            nullable=False,
        ),
        sa.Column(
            "cadence",
            postgresql.ENUM(
                "monthly",
                "quarterly",
                "semi_annual",
                "annual",
                name="recurrencefrequency",
                create_type=False,
            ),
            nullable=False,
            server_default="monthly",
        ),
        sa.Column("next_occurrence", sa.DateTime(timezone=True), nullable=False),
        sa.Column("lead_time_days", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("account_id", sa.Integer(), sa.ForeignKey("accounts.id"), nullable=True),
        sa.Column(
            "category_id", sa.Integer(), sa.ForeignKey("categories.id"), nullable=True
        ),
        sa.Column(
            "allocation_id", sa.Integer(), sa.ForeignKey("allocations.id"), nullable=True
        ),
        sa.Column("is_autopay", sa.Boolean(), nullable=False, server_default=sa.text("FALSE")),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("TRUE")),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            onupdate=sa.func.now(),
            nullable=True,
        ),
    )

    op.add_column(
        "transactions",
        sa.Column("budget_entry_id", sa.Integer(), nullable=True),
    )
    op.create_foreign_key(
        "transactions_budget_entry_id_fkey",
        "transactions",
        "budget_entries",
        ["budget_entry_id"],
        ["id"],
    )


def downgrade() -> None:
    op.drop_constraint(
        "transactions_budget_entry_id_fkey", "transactions", type_="foreignkey"
    )
    op.drop_column("transactions", "budget_entry_id")
    op.drop_table("budget_entries")
    op.execute(
        """
        DO $$
        BEGIN
            DROP TYPE IF EXISTS budgetentrytype;
        EXCEPTION
            WHEN undefined_object THEN NULL;
        END $$;
        """
    )

