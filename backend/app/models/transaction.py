from sqlalchemy import Column, Integer, String, Float, DateTime, Text, ForeignKey, Enum, Boolean
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.models.user import CurrencyType
import enum

class TransactionType(str, enum.Enum):
    DEBIT = "debit"
    CREDIT = "credit"

class Transaction(Base):
    __tablename__ = "transactions"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    account_id = Column(Integer, ForeignKey("accounts.id"), nullable=False)
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=True)
    allocation_id = Column(Integer, ForeignKey("allocations.id"), nullable=True)
    
    amount = Column(Float, nullable=False)
    currency = Column(Enum(CurrencyType), default=CurrencyType.PHP)
    description = Column(Text, nullable=True)
    transaction_type = Column(Enum(TransactionType), nullable=False)
    
    # Transaction dates
    transaction_date = Column(DateTime, nullable=False)
    posting_date = Column(DateTime, nullable=True)  # For credit card transactions
    
    # File attachments
    receipt_url = Column(String(500), nullable=True)
    invoice_url = Column(String(500), nullable=True)
    
    # Transaction status
    is_reconciled = Column(Boolean, default=False)
    is_recurring = Column(Boolean, default=False)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    user = relationship("User", back_populates="transactions")
    account = relationship("Account", back_populates="transactions")
    category = relationship("Category", back_populates="transactions")
    allocation = relationship("Allocation", back_populates="transactions")
