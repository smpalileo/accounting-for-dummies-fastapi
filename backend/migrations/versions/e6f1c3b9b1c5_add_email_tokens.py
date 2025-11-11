"""add email tokens for verification and password reset

Revision ID: e6f1c3b9b1c5
Revises: d6f1f740e12c
Create Date: 2025-11-11 12:00:00.000000
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision = "e6f1c3b9b1c5"
down_revision = "d6f1f740e12c"
branch_labels = None
depends_on = None


email_token_type_enum = postgresql.ENUM(
    "verify_email",
    "reset_password",
    name="emailtokentype",
)


def upgrade() -> None:
    bind = op.get_bind()
    email_token_type_enum.create(bind, checkfirst=True)

    op.create_table(
        "email_tokens",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("token", sa.String(length=128), nullable=False),
        sa.Column(
            "token_type",
            postgresql.ENUM(name="emailtokentype", create_type=False),
            nullable=False,
        ),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_email_tokens_id"), "email_tokens", ["id"], unique=False)
    op.create_index(op.f("ix_email_tokens_token"), "email_tokens", ["token"], unique=True)
    op.create_index(op.f("ix_email_tokens_token_type"), "email_tokens", ["token_type"], unique=False)
    op.create_index(op.f("ix_email_tokens_user_id"), "email_tokens", ["user_id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_email_tokens_user_id"), table_name="email_tokens")
    op.drop_index(op.f("ix_email_tokens_token_type"), table_name="email_tokens")
    op.drop_index(op.f("ix_email_tokens_token"), table_name="email_tokens")
    op.drop_index(op.f("ix_email_tokens_id"), table_name="email_tokens")
    op.drop_table("email_tokens")
    email_token_type_enum.drop(op.get_bind(), checkfirst=True)

