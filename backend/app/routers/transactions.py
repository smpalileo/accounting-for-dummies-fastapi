from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File
from sqlalchemy.orm import Session
from typing import List, Optional
from app.core.database import get_db
from app.models.transaction import Transaction, TransactionType
from app.schemas.transaction import TransactionCreate, TransactionResponse, TransactionUpdate
from app.models.account import Account
from datetime import datetime, timedelta
import os
from app.core.config import settings

router = APIRouter()

@router.get("/", response_model=List[TransactionResponse])
def get_transactions(
    db: Session = Depends(get_db),
    account_id: Optional[int] = Query(None, description="Filter by account ID"),
    category_id: Optional[int] = Query(None, description="Filter by category ID"),
    allocation_id: Optional[int] = Query(None, description="Filter by allocation ID"),
    transaction_type: Optional[TransactionType] = Query(None, description="Filter by transaction type"),
    start_date: Optional[datetime] = Query(None, description="Start date for filtering"),
    end_date: Optional[datetime] = Query(None, description="End date for filtering"),
    is_reconciled: Optional[bool] = Query(None, description="Filter by reconciliation status")
):
    """Get all transactions with optional filtering"""
    query = db.query(Transaction)
    
    if account_id:
        query = query.filter(Transaction.account_id == account_id)
    if category_id:
        query = query.filter(Transaction.category_id == category_id)
    if allocation_id:
        query = query.filter(Transaction.allocation_id == allocation_id)
    if transaction_type:
        query = query.filter(Transaction.transaction_type == transaction_type)
    if start_date:
        query = query.filter(Transaction.transaction_date >= start_date)
    if end_date:
        query = query.filter(Transaction.transaction_date <= end_date)
    if is_reconciled is not None:
        query = query.filter(Transaction.is_reconciled == is_reconciled)
    
    transactions = query.order_by(Transaction.transaction_date.desc()).all()
    return transactions

@router.post("/", response_model=TransactionResponse)
def create_transaction(transaction: TransactionCreate, db: Session = Depends(get_db)):
    """Create a new transaction and update account balance"""
    # Verify account exists
    account = db.query(Account).filter(Account.id == transaction.account_id).first()
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")
    
    # Create transaction
    db_transaction = Transaction(**transaction.dict())
    db.add(db_transaction)
    
    # Update account balance
    if transaction.transaction_type == TransactionType.CREDIT:
        account.balance += transaction.amount
    else:
        account.balance -= transaction.amount
    
    db.commit()
    db.refresh(db_transaction)
    return db_transaction

@router.get("/{transaction_id}", response_model=TransactionResponse)
def get_transaction(transaction_id: int, db: Session = Depends(get_db)):
    """Get a specific transaction by ID"""
    transaction = db.query(Transaction).filter(Transaction.id == transaction_id).first()
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")
    return transaction

@router.put("/{transaction_id}", response_model=TransactionResponse)
def update_transaction(transaction_id: int, transaction_update: TransactionUpdate, db: Session = Depends(get_db)):
    """Update an existing transaction and recalculate account balance"""
    db_transaction = db.query(Transaction).filter(Transaction.id == transaction_id).first()
    if not db_transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")
    
    # Store old values for balance recalculation
    old_amount = db_transaction.amount
    old_type = db_transaction.transaction_type
    old_account_id = db_transaction.account_id
    
    # Update transaction
    update_data = transaction_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_transaction, field, value)
    
    db_transaction.updated_at = datetime.utcnow()
    
    # Recalculate account balance
    account = db.query(Account).filter(Account.id == old_account_id).first()
    if account:
        # Reverse old transaction
        if old_type == TransactionType.CREDIT:
            account.balance -= old_amount
        else:
            account.balance += old_amount
        
        # Apply new transaction
        if db_transaction.transaction_type == TransactionType.CREDIT:
            account.balance += db_transaction.amount
        else:
            account.balance -= db_transaction.amount
    
    db.commit()
    db.refresh(db_transaction)
    return db_transaction

@router.delete("/{transaction_id}")
def delete_transaction(transaction_id: int, db: Session = Depends(get_db)):
    """Delete a transaction and update account balance"""
    db_transaction = db.query(Transaction).filter(Transaction.id == transaction_id).first()
    if not db_transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")
    
    # Update account balance
    account = db.query(Account).filter(Account.id == db_transaction.account_id).first()
    if account:
        if db_transaction.transaction_type == TransactionType.CREDIT:
            account.balance -= db_transaction.amount
        else:
            account.balance += db_transaction.amount
    
    db.delete(db_transaction)
    db.commit()
    return {"message": "Transaction deleted successfully"}

@router.post("/{transaction_id}/upload-receipt")
async def upload_receipt(
    transaction_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """Upload a receipt for a transaction"""
    db_transaction = db.query(Transaction).filter(Transaction.id == transaction_id).first()
    if not db_transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")
    
    # Validate file type
    file_extension = file.filename.split(".")[-1].lower()
    if file_extension not in settings.ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400, 
            detail=f"File type not allowed. Allowed types: {', '.join(settings.ALLOWED_EXTENSIONS)}"
        )
    
    # Create upload directory if it doesn't exist
    upload_dir = os.path.join(settings.UPLOAD_DIR, "receipts")
    os.makedirs(upload_dir, exist_ok=True)
    
    # Save file
    filename = f"receipt_{transaction_id}_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.{file_extension}"
    file_path = os.path.join(upload_dir, filename)
    
    with open(file_path, "wb") as buffer:
        content = await file.read()
        buffer.write(content)
    
    # Update transaction with receipt URL
    db_transaction.receipt_url = f"/uploads/receipts/{filename}"
    db.commit()
    
    return {"message": "Receipt uploaded successfully", "file_url": db_transaction.receipt_url}

@router.get("/summary/period")
def get_transaction_summary(
    db: Session = Depends(get_db),
    start_date: datetime = Query(..., description="Start date for summary"),
    end_date: datetime = Query(..., description="End date for summary"),
    account_id: Optional[int] = Query(None, description="Filter by account ID")
):
    """Get transaction summary for a specific period"""
    query = db.query(Transaction).filter(
        Transaction.transaction_date >= start_date,
        Transaction.transaction_date <= end_date
    )
    
    if account_id:
        query = query.filter(Transaction.account_id == account_id)
    
    transactions = query.all()
    
    total_income = sum(t.amount for t in transactions if t.transaction_type == TransactionType.CREDIT)
    total_expenses = sum(t.amount for t in transactions if t.transaction_type == TransactionType.DEBIT)
    net_flow = total_income - total_expenses
    
    # Group by category
    category_summary = {}
    for transaction in transactions:
        if transaction.category_id:
            category_name = db.query(Transaction.category).first().name if transaction.category else "Uncategorized"
            if category_name not in category_summary:
                category_summary[category_name] = {"income": 0, "expenses": 0}
            
            if transaction.transaction_type == TransactionType.CREDIT:
                category_summary[category_name]["income"] += transaction.amount
            else:
                category_summary[category_name]["expenses"] += transaction.amount
    
    return {
        "period": {
            "start_date": start_date,
            "end_date": end_date
        },
        "summary": {
            "total_income": total_income,
            "total_expenses": total_expenses,
            "net_flow": net_flow,
            "transaction_count": len(transactions)
        },
        "category_breakdown": category_summary
    }
