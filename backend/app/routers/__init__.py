from fastapi import APIRouter
from app.routers import accounts, transactions, categories, allocations

# Auto-include all routers
api_router = APIRouter()

api_router.include_router(accounts.router, prefix="/accounts", tags=["accounts"])
api_router.include_router(transactions.router, prefix="/transactions", tags=["transactions"])
api_router.include_router(categories.router, prefix="/categories", tags=["categories"])
api_router.include_router(allocations.router, prefix="/allocations", tags=["allocations"])
