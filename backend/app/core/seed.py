import json
import os
from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.models import Account, Category, Transaction, Allocation
from app.models.account import AccountType
from app.models.transaction import TransactionType
from app.models.allocation import AllocationType
from datetime import datetime

def seed_database():
    """Seed the database with initial data if it's empty"""
    db = SessionLocal()
    
    try:
        # Check if data already exists
        existing_accounts = db.query(Account).count()
        if existing_accounts > 0:
            print("Database already has data, skipping seed...")
            return
        
        # Load seed data
        seed_file_path = os.path.join(os.path.dirname(__file__), "constants", "seed_data.json")
        with open(seed_file_path, "r") as f:
            seed_data = json.load(f)
        
        # Create accounts
        accounts = []
        for account_data in seed_data["accounts"]:
            # Convert account_type string to enum
            account_data["account_type"] = AccountType(account_data["account_type"])
            account = Account(**account_data)
            db.add(account)
            accounts.append(account)
        db.commit()
        
        # Refresh to get IDs
        for account in accounts:
            db.refresh(account)
        
        # Create categories
        categories = []
        for category_data in seed_data["categories"]:
            category = Category(**category_data)
            db.add(category)
            categories.append(category)
        db.commit()
        
        # Refresh to get IDs
        for category in categories:
            db.refresh(category)
        
        # Create allocations
        allocations = []
        for allocation_data in seed_data["allocations"]:
            # Convert allocation_type string to enum
            allocation_data["allocation_type"] = AllocationType(allocation_data["allocation_type"])
            # Convert target_date string to datetime
            if allocation_data.get("target_date"):
                allocation_data["target_date"] = datetime.fromisoformat(allocation_data["target_date"])
            allocation = Allocation(**allocation_data)
            db.add(allocation)
            allocations.append(allocation)
        db.commit()
        
        # Refresh to get IDs
        for allocation in allocations:
            db.refresh(allocation)
        
        # Create transactions
        for transaction_data in seed_data["transactions"]:
            # Convert transaction_type string to enum
            transaction_data["transaction_type"] = TransactionType(transaction_data["transaction_type"])
            # Convert date strings to datetime
            transaction_data["transaction_date"] = datetime.fromisoformat(transaction_data["transaction_date"])
            if transaction_data.get("posting_date"):
                transaction_data["posting_date"] = datetime.fromisoformat(transaction_data["posting_date"])
            transaction = Transaction(**transaction_data)
            db.add(transaction)
        db.commit()
        
        print("Database seeded successfully!")
        
    except Exception as e:
        print(f"Error seeding database: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
