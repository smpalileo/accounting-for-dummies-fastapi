import json
import os
from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.models import Account, Category, Transaction, Allocation, User
from app.models.account import AccountType
from app.models.transaction import TransactionType
from app.models.allocation import AllocationType
from app.models.user import CurrencyType
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
        seed_file_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "constants", "seed_data.json")
        with open(seed_file_path, "r") as f:
            seed_data = json.load(f)
        
        # Create a default user first
        from app.core.auth import get_password_hash
        default_user = User(
            email="demo@example.com",
            password_hash=get_password_hash("password123"),
            first_name="Demo",
            last_name="User",
            is_active=True,
            is_verified=True,
            default_currency=CurrencyType.PHP
        )
        db.add(default_user)
        db.commit()
        db.refresh(default_user)
        
        # Create accounts associated with the default user
        accounts = []
        account_id_mapping = {}  # Map original index to actual ID
        account_obj_mapping = {}
        for i, account_data in enumerate(seed_data["accounts"]):
            # Convert account_type string to enum (convert uppercase to lowercase)
            account_type_str = account_data["account_type"].lower()
            account_data["account_type"] = AccountType(account_type_str)
            # Add user_id to account data
            account_data["user_id"] = default_user.id
            account_data.setdefault("currency", default_user.default_currency)
            if account_data.get("days_until_due_date") is None:
                account_data["days_until_due_date"] = 21
            account = Account(**account_data)
            db.add(account)
            accounts.append(account)
        db.commit()
        
        # Refresh to get IDs and create mapping
        for i, account in enumerate(accounts):
            db.refresh(account)
            account_id_mapping[i + 1] = account.id  # Original seed data uses 1-based indexing
            account_obj_mapping[i + 1] = account
        
        # Create categories associated with the default user
        categories = []
        category_id_mapping = {}  # Map original index to actual ID
        for i, category_data in enumerate(seed_data["categories"]):
            # Add user_id to category data
            category_data["user_id"] = default_user.id
            category = Category(**category_data)
            db.add(category)
            categories.append(category)
        db.commit()
        
        # Refresh to get IDs and create mapping
        for i, category in enumerate(categories):
            db.refresh(category)
            category_id_mapping[i + 1] = category.id  # Original seed data uses 1-based indexing
        
        # Create allocations associated with the default user
        allocations = []
        allocation_id_mapping = {}  # Map original index to actual ID
        for i, allocation_data in enumerate(seed_data["allocations"]):
            # Convert allocation_type string to enum (convert uppercase to lowercase)
            allocation_type_str = allocation_data["allocation_type"].lower()
            allocation_data["allocation_type"] = AllocationType(allocation_type_str)
            # Convert target_date string to datetime
            if allocation_data.get("target_date"):
                allocation_data["target_date"] = datetime.fromisoformat(allocation_data["target_date"])
            # Add user_id to allocation data
            allocation_data["user_id"] = default_user.id
            # Map account_id to actual account ID
            original_account_id = allocation_data["account_id"]
            allocation_data["account_id"] = account_id_mapping[original_account_id]
            allocation = Allocation(**allocation_data)
            db.add(allocation)
            allocations.append(allocation)
        db.commit()
        
        # Refresh to get IDs and create mapping
        for i, allocation in enumerate(allocations):
            db.refresh(allocation)
            allocation_id_mapping[i + 1] = allocation.id  # Original seed data uses 1-based indexing
        
        # Create transactions associated with the default user
        for transaction_data in seed_data["transactions"]:
            original_account_id = transaction_data["account_id"]
            # Convert transaction_type string to enum (convert uppercase to lowercase)
            transaction_type_str = transaction_data["transaction_type"].lower()
            transaction_data["transaction_type"] = TransactionType(transaction_type_str)
            # Convert date strings to datetime
            transaction_data["transaction_date"] = datetime.fromisoformat(transaction_data["transaction_date"])
            if transaction_data.get("posting_date"):
                transaction_data["posting_date"] = datetime.fromisoformat(transaction_data["posting_date"])
            # Add user_id to transaction data
            transaction_data["user_id"] = default_user.id
            # Map foreign key IDs to actual IDs
            transaction_data["account_id"] = account_id_mapping[original_account_id]
            original_category_id = transaction_data.get("category_id")
            if original_category_id is not None:
                transaction_data["category_id"] = category_id_mapping[original_category_id]
            if transaction_data.get("allocation_id"):
                transaction_data["allocation_id"] = allocation_id_mapping[transaction_data["allocation_id"]]
            if transaction_data.get("transfer_from_account_id"):
                transaction_data["transfer_from_account_id"] = account_id_mapping[
                    transaction_data["transfer_from_account_id"]
                ]
            elif transaction_data["transaction_type"] == TransactionType.TRANSFER:
                transaction_data["transfer_from_account_id"] = account_id_mapping[original_account_id]
            if transaction_data.get("transfer_to_account_id"):
                transaction_data["transfer_to_account_id"] = account_id_mapping[
                    transaction_data["transfer_to_account_id"]
                ]
            account_ref = account_obj_mapping.get(original_account_id)
            if transaction_data.get("currency") is None and account_ref:
                transaction_data["currency"] = account_ref.currency
            if transaction_data.get("projected_amount") is not None and transaction_data.get("projected_currency") is None and account_ref:
                transaction_data["projected_currency"] = account_ref.currency
            if transaction_data.get("transfer_fee") is None:
                transaction_data["transfer_fee"] = 0.0
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
