from fastapi import APIRouter
from app.routers import auth, accounts, transactions, categories, allocations, budget_entries

# Auto-include all routers
api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["authentication"])
api_router.include_router(accounts.router, prefix="/accounts", tags=["accounts"])
api_router.include_router(transactions.router, prefix="/transactions", tags=["transactions"])
api_router.include_router(categories.router, prefix="/categories", tags=["categories"])
api_router.include_router(allocations.router, prefix="/allocations", tags=["allocations"])
api_router.include_router(budget_entries.router, prefix="/budget-entries", tags=["budget_entries"])
