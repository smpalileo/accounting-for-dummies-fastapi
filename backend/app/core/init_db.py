from app.core.database import engine
from app.models import Account, Transaction, Category, Allocation, User

def create_tables():
    """Create all database tables"""
    User.__table__.create(bind=engine, checkfirst=True)
    Account.__table__.create(bind=engine, checkfirst=True)
    Category.__table__.create(bind=engine, checkfirst=True)
    Allocation.__table__.create(bind=engine, checkfirst=True)
    Transaction.__table__.create(bind=engine, checkfirst=True)

def init_db():
    """Initialize database with tables and seed data"""
    create_tables()
    print("Database tables created successfully!")
    
    # Import and run seeding
    from app.core.seed import seed_database
    seed_database()
