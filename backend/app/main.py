from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.core.config import settings
from app.routers import api_router
from app.core.database import engine
from app.models import Account, Transaction, Category, Allocation
from app.core.seed import seed_database
import os

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description=settings.DESCRIPTION,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

# Set up CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files for uploads
if os.path.exists(settings.UPLOAD_DIR):
    app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")

# Include API router
app.include_router(api_router, prefix=settings.API_V1_STR)

@app.get("/")
async def root():
    return {"message": "Welcome to Accounting for Dummies API"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

# Database initialization
@app.on_event("startup")
async def startup_event():
    """Initialize database tables and seed data on startup"""
    from sqlalchemy import text
    
    # Create tables
    async with engine.begin() as conn:
        await conn.run_sync(lambda sync_conn: sync_conn.execute(text("""
            CREATE TABLE IF NOT EXISTS accounts (
                id SERIAL PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                account_type VARCHAR(20) NOT NULL,
                balance DECIMAL(15,2) DEFAULT 0.0 NOT NULL,
                description TEXT,
                credit_limit DECIMAL(15,2),
                due_date INTEGER,
                billing_cycle_start INTEGER,
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            )
        """)))
        
        await conn.run_sync(lambda sync_conn: sync_conn.execute(text("""
            CREATE TABLE IF NOT EXISTS categories (
                id SERIAL PRIMARY KEY,
                name VARCHAR(100) NOT NULL UNIQUE,
                description TEXT,
                color VARCHAR(7),
                is_expense BOOLEAN DEFAULT TRUE,
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            )
        """)))
        
        await conn.run_sync(lambda sync_conn: sync_conn.execute(text("""
            CREATE TABLE IF NOT EXISTS allocations (
                id SERIAL PRIMARY KEY,
                account_id INTEGER NOT NULL REFERENCES accounts(id),
                name VARCHAR(100) NOT NULL,
                allocation_type VARCHAR(20) NOT NULL,
                description TEXT,
                target_amount DECIMAL(15,2),
                current_amount DECIMAL(15,2) DEFAULT 0.0 NOT NULL,
                monthly_target DECIMAL(15,2),
                target_date TIMESTAMP WITH TIME ZONE,
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            )
        """)))
        
        await conn.run_sync(lambda sync_conn: sync_conn.execute(text("""
            CREATE TABLE IF NOT EXISTS transactions (
                id SERIAL PRIMARY KEY,
                account_id INTEGER NOT NULL REFERENCES accounts(id),
                category_id INTEGER REFERENCES categories(id),
                allocation_id INTEGER REFERENCES allocations(id),
                amount DECIMAL(15,2) NOT NULL,
                description TEXT,
                transaction_type VARCHAR(20) NOT NULL,
                transaction_date TIMESTAMP WITH TIME ZONE NOT NULL,
                posting_date TIMESTAMP WITH TIME ZONE,
                receipt_url VARCHAR(500),
                invoice_url VARCHAR(500),
                is_reconciled BOOLEAN DEFAULT FALSE,
                is_recurring BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            )
        """)))
    
    print("Database tables initialized successfully!")
    
    # Seed database with initial data
    seed_database()
