from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.middleware.error_handler import register_exception_handlers
from app.middleware.rate_limit import install_rate_limiting
from app.middleware.request_logger import RequestLoggingMiddleware
from app.routes import api_router
from app.routes.health import router as health_router
from app.core.logging import configure_logging

OPENAPI_TAGS_METADATA = [
    {"name": "auth", "description": "Account registration and JWT login."},
    {"name": "users", "description": "Current-user profile management."},
    {"name": "expenses", "description": "Expense CRUD and CSV bulk import."},
    {"name": "balance", "description": "Monthly balance and per-category summary."},
    {
        "name": "installments",
        "description": "Track installment purchases and remaining commitments.",
    },
    {
        "name": "financial",
        "description": "Aggregate planning: monthly summary and future balance projections.",
    },
    {
        "name": "financial-analysis",
        "description": "Pre-purchase risk analysis (`can-i-buy`) and recommendations.",
    },
    {
        "name": "discipline",
        "description": "Discipline Mode: spend caps, score, streaks, and warnings.",
    },
    {"name": "health", "description": "Liveness and readiness probes."},
]


def create_app() -> FastAPI:
    configure_logging()

    app = FastAPI(
        title=settings.app_name,
        debug=settings.debug,
        version="1.0.0",
        openapi_tags=OPENAPI_TAGS_METADATA,
        description=(
            "Backend for a personal financial planning system. "
            "All business endpoints live under `/api/v1`."
        ),
    )

    # Order matters: request logger first so failures inside other middleware
    # are still captured. Rate limit and CORS go after.
    app.add_middleware(RequestLoggingMiddleware)
    install_rate_limiting(app)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    register_exception_handlers(app)
    app.include_router(health_router)
    app.include_router(api_router)

    return app


app = create_app()
