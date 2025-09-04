from app.core.database import engine
from app.models import Account, Transaction, Category

def create_tables():
    """Create all database tables"""
    Account.__table__.create(bind=engine, checkfirst=True)
    Transaction.__table__.create(bind=engine, checkfirst=True)
    Category.__table__.create(bind=engine, checkfirst=True)

if __name__ == "__main__":
    create_tables()
    print("Database tables created successfully!")
