# Database models
from sqlalchemy.orm import relationship
from app.models.user import User, CurrencyType
from app.models.account import Account, AccountType
from app.models.transaction import Transaction, TransactionType
from app.models.category import Category
from app.models.allocation import Allocation, AllocationType

# Update relationships
Account.transactions = relationship(
    "Transaction",
    back_populates="account",
    foreign_keys=[Transaction.account_id],
)
Account.allocations = relationship("Allocation", back_populates="account")
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
