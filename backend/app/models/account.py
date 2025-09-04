from sqlalchemy import Column, Integer, String, Float, DateTime, Text, Boolean, ForeignKey, Enum
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.core.database import Base
import enum

class AccountType(str, enum.Enum):
    CASH = "cash"
    E_WALLET = "e_wallet"
    SAVINGS = "savings"
    CHECKING = "checking"
    CREDIT = "credit"

class Account(Base):
    __tablename__ = "accounts"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False, index=True)
    account_type = Column(Enum(AccountType), nullable=False)
    balance = Column(Float, default=0.0, nullable=False)
    description = Column(Text, nullable=True)
    
    # Credit card specific fields
    credit_limit = Column(Float, nullable=True)
    due_date = Column(Integer, nullable=True)  # Day of month for due date
    billing_cycle_start = Column(Integer, nullable=True)  # Day of month for billing cycle start
    
    # Account status
    is_active = Column(Boolean, default=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    transactions = relationship("Transaction", back_populates="account")
    allocations = relationship("Allocation", back_populates="account")
