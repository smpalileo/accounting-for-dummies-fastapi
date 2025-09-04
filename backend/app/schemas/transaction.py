from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from app.models.transaction import TransactionType

class TransactionBase(BaseModel):
    account_id: int = Field(..., gt=0)
    category_id: Optional[int] = Field(None, gt=0)
    allocation_id: Optional[int] = Field(None, gt=0)
    amount: float = Field(..., gt=0)
    description: Optional[str] = None
    transaction_type: TransactionType
    transaction_date: datetime
    posting_date: Optional[datetime] = None
    
    # File attachments
    receipt_url: Optional[str] = None
    invoice_url: Optional[str] = None
    
    # Transaction status
    is_reconciled: bool = False
    is_recurring: bool = False

class TransactionCreate(TransactionBase):
    pass

class TransactionUpdate(BaseModel):
    account_id: Optional[int] = Field(None, gt=0)
    category_id: Optional[int] = Field(None, gt=0)
    allocation_id: Optional[int] = Field(None, gt=0)
    amount: Optional[float] = Field(None, gt=0)
    description: Optional[str] = None
    transaction_type: Optional[TransactionType] = None
    transaction_date: Optional[datetime] = None
    posting_date: Optional[datetime] = None
    receipt_url: Optional[str] = None
    invoice_url: Optional[str] = None
    is_reconciled: Optional[bool] = None
    is_recurring: Optional[bool] = None

class TransactionResponse(TransactionBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True
