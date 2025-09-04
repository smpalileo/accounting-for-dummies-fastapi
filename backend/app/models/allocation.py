from sqlalchemy import Column, Integer, String, Float, DateTime, Text, ForeignKey, Enum, Boolean
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.core.database import Base
import enum

class AllocationType(str, enum.Enum):
    SAVINGS = "savings"
    BUDGET = "budget"
    GOAL = "goal"

class Allocation(Base):
    __tablename__ = "allocations"
    
    id = Column(Integer, primary_key=True, index=True)
    account_id = Column(Integer, ForeignKey("accounts.id"), nullable=False)
    
    name = Column(String(100), nullable=False, index=True)
    allocation_type = Column(Enum(AllocationType), nullable=False)
    description = Column(Text, nullable=True)
    
    # Financial details
    target_amount = Column(Float, nullable=True)
    current_amount = Column(Float, default=0.0, nullable=False)
    monthly_target = Column(Float, nullable=True)
    
    # Goal settings
    target_date = Column(DateTime, nullable=True)
    is_active = Column(Boolean, default=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    account = relationship("Account", back_populates="allocations")
    transactions = relationship("Transaction", back_populates="allocation")
