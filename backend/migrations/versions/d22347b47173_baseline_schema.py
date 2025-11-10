"""baseline schema

Revision ID: d22347b47173
Revises: 
Create Date: 2025-11-08 22:02:22.510532
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = "d22347b47173"
down_revision = None
branch_labels = None
depends_on = None

currency_enum = postgresql.ENUM(
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

account_type_enum = postgresql.ENUM(
    "CASH",
    "E_WALLET",
    "SAVINGS",
    "CHECKING",
    "CREDIT",
    name="accounttype",
)

allocation_type_enum = postgresql.ENUM(
    "SAVINGS",
    "BUDGET",
    "GOAL",
    name="allocationtype",
)

transaction_type_enum = postgresql.ENUM(
    "DEBIT",
    "CREDIT",
    name="transactiontype",
)

allocation_period_frequency_enum = postgresql.ENUM(
    "daily",
    "weekly",
    "monthly",
    "quarterly",
    name="allocationperiodfrequency",
)


def upgrade() -> None:
    bind = op.get_bind()

    # Enum types
    currency_enum.create(bind, checkfirst=True)
    account_type_enum.create(bind, checkfirst=True)
    allocation_type_enum.create(bind, checkfirst=True)
    transaction_type_enum.create(bind, checkfirst=True)
    allocation_period_frequency_enum.create(bind, checkfirst=True)

    # Users table
    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("password_hash", sa.String(length=255), nullable=False),
        sa.Column("first_name", sa.String(length=100), nullable=False),
        sa.Column("last_name", sa.String(length=100), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("TRUE")),
        sa.Column("is_verified", sa.Boolean(), nullable=False, server_default=sa.text("FALSE")),
        sa.Column(
            "default_currency",
            postgresql.ENUM(name="currencytype", create_type=False),
            nullable=False,
            server_default="PHP",
        ),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("last_login", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index("ix_users_email", "users", ["email"], unique=True)

    # Accounts table
    op.create_table(
        "accounts",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("name", sa.String(length=100), nullable=False),
        sa.Column(
            "account_type",
            postgresql.ENUM(name="accounttype", create_type=False),
            nullable=False,
        ),
        sa.Column("balance", sa.Float(), nullable=False, server_default="0"),
        sa.Column(
            "currency",
            postgresql.ENUM(name="currencytype", create_type=False),
            nullable=False,
            server_default="PHP",
        ),
        sa.Column(
            "period_frequency",
            postgresql.ENUM(name="allocationperiodfrequency", create_type=False),
            nullable=True,
        ),
        sa.Column("period_start", sa.DateTime(timezone=True), nullable=True),
        sa.Column("period_end", sa.DateTime(timezone=True), nullable=True),
        sa.Column("target_date", sa.DateTime(timezone=True), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("TRUE")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index("ix_accounts_name", "accounts", ["name"], unique=False)

    # Categories table
    op.create_table(
        "categories",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("name", sa.String(length=100), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("color", sa.String(length=7), nullable=True),
        sa.Column("is_expense", sa.Boolean(), nullable=False, server_default=sa.text("TRUE")),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("TRUE")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index("ix_categories_name", "categories", ["name"], unique=False)

    # Allocations table
    op.create_table(
        "allocations",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("account_id", sa.Integer(), sa.ForeignKey("accounts.id"), nullable=False),
        sa.Column("name", sa.String(length=100), nullable=False),
        sa.Column(
            "allocation_type",
            postgresql.ENUM(name="allocationtype", create_type=False),
            nullable=False,
        ),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("target_amount", sa.Float(), nullable=True),
        sa.Column("current_amount", sa.Float(), nullable=False, server_default="0"),
        sa.Column("monthly_target", sa.Float(), nullable=True),
        sa.Column(
            "currency",
            postgresql.ENUM(name="currencytype", create_type=False),
            nullable=False,
            server_default="PHP",
        ),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("TRUE")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index("ix_allocations_name", "allocations", ["name"], unique=False)

    # Transactions table
    op.create_table(
        "transactions",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("account_id", sa.Integer(), sa.ForeignKey("accounts.id"), nullable=False),
        sa.Column("category_id", sa.Integer(), sa.ForeignKey("categories.id"), nullable=True),
        sa.Column("allocation_id", sa.Integer(), sa.ForeignKey("allocations.id"), nullable=True),
        sa.Column("amount", sa.Float(), nullable=False),
        sa.Column(
            "currency",
            postgresql.ENUM(name="currencytype", create_type=False),
            nullable=False,
            server_default="PHP",
        ),
        sa.Column("projected_amount", sa.Float(), nullable=True),
        sa.Column(
            "projected_currency",
            postgresql.ENUM(name="currencytype", create_type=False),
            nullable=True,
        ),
        sa.Column("original_amount", sa.Float(), nullable=True),
        sa.Column(
            "original_currency",
            postgresql.ENUM(name="currencytype", create_type=False),
            nullable=True,
        ),
        sa.Column("exchange_rate", sa.Float(), nullable=True),
        sa.Column("transfer_fee", sa.Float(), nullable=False, server_default="0"),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column(
            "transaction_type",
            postgresql.ENUM(name="transactiontype", create_type=False),
            nullable=False,
        ),
        sa.Column("is_posted", sa.Boolean(), nullable=False, server_default=sa.text("TRUE")),
        sa.Column("transfer_from_account_id", sa.Integer(), sa.ForeignKey("accounts.id"), nullable=True),
        sa.Column("transfer_to_account_id", sa.Integer(), sa.ForeignKey("accounts.id"), nullable=True),
        sa.Column("transaction_date", sa.DateTime(timezone=True), nullable=False),
        sa.Column("posting_date", sa.DateTime(timezone=True), nullable=True),
        sa.Column("receipt_url", sa.String(length=500), nullable=True),
        sa.Column("invoice_url", sa.String(length=500), nullable=True),
        sa.Column("is_reconciled", sa.Boolean(), nullable=False, server_default=sa.text("FALSE")),
        sa.Column("is_recurring", sa.Boolean(), nullable=False, server_default=sa.text("FALSE")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index("ix_transactions_transaction_date", "transactions", ["transaction_date"], unique=False)


def downgrade() -> None:
    bind = op.get_bind()

    op.drop_index("ix_transactions_transaction_date", table_name="transactions")
    op.drop_table("transactions")

    op.drop_index("ix_allocations_name", table_name="allocations")
    op.drop_table("allocations")

    op.drop_index("ix_categories_name", table_name="categories")
    op.drop_table("categories")

    op.drop_index("ix_accounts_name", table_name="accounts")
    op.drop_table("accounts")

    op.drop_index("ix_users_email", table_name="users")
    op.drop_table("users")

    transaction_type_enum.drop(bind, checkfirst=True)
    allocation_type_enum.drop(bind, checkfirst=True)
    account_type_enum.drop(bind, checkfirst=True)
    currency_enum.drop(bind, checkfirst=True)
    allocation_period_frequency_enum.drop(bind, checkfirst=True)

