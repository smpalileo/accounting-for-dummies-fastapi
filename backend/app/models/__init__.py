# Database models
from sqlalchemy.orm import relationship
from app.models.user import User, CurrencyType
from app.models.account import Account, AccountType
from app.models.transaction import Transaction, TransactionType
from app.models.category import Category
from app.models.allocation import Allocation, AllocationType
from app.models.budget_entry import BudgetEntry, BudgetEntryType
from app.models.email_token import EmailToken, EmailTokenType

# Update relationships
Account.transactions = relationship(
    "Transaction",
    back_populates="account",
    foreign_keys=[Transaction.account_id],
)
Account.allocations = relationship(
    "Allocation",
    back_populates="account",
    foreign_keys=[Allocation.account_id],
)
Transaction.account = relationship(
    "Account",
    back_populates="transactions",
    foreign_keys=[Transaction.account_id],
)
Transaction.category = relationship("Category", back_populates="transactions")
Transaction.allocation = relationship("Allocation", back_populates="transactions")
# Additional transfer relationships
Transaction.transfer_from_account = relationship(
    "Account",
    foreign_keys=[Transaction.transfer_from_account_id],
    backref="transfer_out_transactions"
)
Transaction.transfer_to_account = relationship(
    "Account",
    foreign_keys=[Transaction.transfer_to_account_id],
    backref="transfer_in_transactions"
)
Category.transactions = relationship("Transaction", back_populates="category")
Allocation.account = relationship("Account", back_populates="allocations")
Allocation.transactions = relationship("Transaction", back_populates="allocation")
User.budget_entries = relationship("BudgetEntry", back_populates="user")
User.email_tokens = relationship("EmailToken", back_populates="user", cascade="all, delete-orphan")
Account.budget_entries = relationship("BudgetEntry", back_populates="account")
Category.budget_entries = relationship("BudgetEntry", back_populates="category")
Allocation.budget_entries = relationship("BudgetEntry", back_populates="allocation")
Transaction.budget_entry = relationship(
    "BudgetEntry",
    back_populates="transactions",
    foreign_keys=[Transaction.budget_entry_id],
)
BudgetEntry.transactions = relationship(
    "Transaction",
    back_populates="budget_entry",
    foreign_keys=[Transaction.budget_entry_id],
)
EmailToken.user = relationship("User", back_populates="email_tokens")
