# Database models
from sqlalchemy.orm import relationship
from app.models.user import User, CurrencyType
from app.models.account import Account, AccountType
from app.models.transaction import Transaction, TransactionType
from app.models.category import Category
from app.models.allocation import Allocation, AllocationType

# Update relationships
Account.transactions = relationship("Transaction", back_populates="account")
Account.allocations = relationship("Allocation", back_populates="account")
Transaction.account = relationship("Account", back_populates="transactions")
Transaction.category = relationship("Category", back_populates="transactions")
Transaction.allocation = relationship("Allocation", back_populates="transactions")
Category.transactions = relationship("Transaction", back_populates="category")
Allocation.account = relationship("Account", back_populates="allocations")
Allocation.transactions = relationship("Transaction", back_populates="allocation")
