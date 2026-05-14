from fastapi import APIRouter

from app.routes import (
    auth,
    balance,
    discipline,
    expenses,
    financial,
    financial_analysis,
    installments,
    planejamento,
    users,
)

# All business routes live under /api/v1. Health endpoints stay at the root
# because orchestrators historically poke /health.
api_router = APIRouter(prefix="/api/v1")
api_router.include_router(auth.router)
api_router.include_router(users.router)
api_router.include_router(expenses.router)
api_router.include_router(balance.router)
api_router.include_router(installments.router)
api_router.include_router(financial.router)
api_router.include_router(financial_analysis.router)
api_router.include_router(discipline.router)
api_router.include_router(planejamento.router)

__all__ = ["api_router"]
