"""normalize enum casing and add transfer transaction type

Revision ID: 9d3d0b21c6e4
Revises: 8c9f3dd8a1c1
Create Date: 2025-11-09 10:25:00.000000
"""

from alembic import op

# revision identifiers, used by Alembic.
revision = "9d3d0b21c6e4"
down_revision = "8c9f3dd8a1c1"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Account type enum -> lowercase
    op.execute("ALTER TYPE accounttype RENAME TO accounttype_old;")
    op.execute(
        "CREATE TYPE accounttype AS ENUM ('cash', 'e_wallet', 'savings', 'checking', 'credit');"
    )
    op.execute(
        """
        ALTER TABLE accounts
        ALTER COLUMN account_type
        TYPE accounttype
        USING lower(account_type::text)::accounttype;
        """
    )
    op.execute("DROP TYPE accounttype_old;")

    # Allocation type enum -> lowercase
    op.execute("ALTER TYPE allocationtype RENAME TO allocationtype_old;")
    op.execute(
        "CREATE TYPE allocationtype AS ENUM ('savings', 'budget', 'goal');"
    )
    op.execute(
        """
        ALTER TABLE allocations
        ALTER COLUMN allocation_type
        TYPE allocationtype
        USING lower(allocation_type::text)::allocationtype;
        """
    )
    op.execute("DROP TYPE allocationtype_old;")

    # Transaction type enum -> lowercase with transfer
    op.execute("ALTER TYPE transactiontype RENAME TO transactiontype_old;")
    op.execute(
        "CREATE TYPE transactiontype AS ENUM ('debit', 'credit', 'transfer');"
    )
    op.execute(
        """
        ALTER TABLE transactions
        ALTER COLUMN transaction_type
        TYPE transactiontype
        USING lower(transaction_type::text)::transactiontype;
        """
    )
    op.execute("DROP TYPE transactiontype_old;")


def downgrade() -> None:
    # Transaction type back to original uppercase values (transfer downgraded to CREDIT)
    op.execute("ALTER TYPE transactiontype RENAME TO transactiontype_new;")
    op.execute(
        "CREATE TYPE transactiontype AS ENUM ('DEBIT', 'CREDIT');"
    )
    op.execute(
        """
        ALTER TABLE transactions
        ALTER COLUMN transaction_type
        TYPE transactiontype
        USING (
            CASE
                WHEN transaction_type::text = 'transfer' THEN 'CREDIT'
                WHEN transaction_type::text = 'debit' THEN 'DEBIT'
                ELSE upper(transaction_type::text)
            END
        )::transactiontype;
        """
    )
    op.execute("DROP TYPE transactiontype_new;")

    # Allocation type back to uppercase
    op.execute("ALTER TYPE allocationtype RENAME TO allocationtype_new;")
    op.execute(
        "CREATE TYPE allocationtype AS ENUM ('SAVINGS', 'BUDGET', 'GOAL');"
    )
    op.execute(
        """
        ALTER TABLE allocations
        ALTER COLUMN allocation_type
        TYPE allocationtype
        USING upper(allocation_type::text)::allocationtype;
        """
    )
    op.execute("DROP TYPE allocationtype_new;")

    # Account type back to uppercase
    op.execute("ALTER TYPE accounttype RENAME TO accounttype_new;")
    op.execute(
        "CREATE TYPE accounttype AS ENUM ('CASH', 'E_WALLET', 'SAVINGS', 'CHECKING', 'CREDIT');"
    )
    op.execute(
        """
        ALTER TABLE accounts
        ALTER COLUMN account_type
        TYPE accounttype
        USING upper(account_type::text)::accounttype;
        """
    )
    op.execute("DROP TYPE accounttype_new;")

