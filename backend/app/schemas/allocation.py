from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from app.models.allocation import AllocationType

class AllocationBase(BaseModel):
    account_id: int = Field(..., gt=0)
    name: str = Field(..., min_length=1, max_length=100)
    allocation_type: AllocationType
    description: Optional[str] = None
    
    # Financial details
    target_amount: Optional[float] = Field(None, ge=0)
    current_amount: float = Field(default=0.0, ge=0)
    monthly_target: Optional[float] = Field(None, ge=0)
    
    # Goal settings
    target_date: Optional[datetime] = None
    is_active: bool = True

class AllocationCreate(AllocationBase):
    pass

class AllocationUpdate(BaseModel):
    account_id: Optional[int] = Field(None, gt=0)
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    allocation_type: Optional[AllocationType] = None
    description: Optional[str] = None
    target_amount: Optional[float] = Field(None, ge=0)
    current_amount: Optional[float] = Field(None, ge=0)
    monthly_target: Optional[float] = Field(None, ge=0)
    target_date: Optional[datetime] = None
    is_active: Optional[bool] = None

class AllocationResponse(AllocationBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True
