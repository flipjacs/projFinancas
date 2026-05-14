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
    {"name": "autenticação", "description": "Cadastro de conta e login JWT."},
    {"name": "usuários", "description": "Gerenciamento do perfil do usuário logado."},
    {"name": "gastos", "description": "CRUD de gastos e importação em lote via CSV."},
    {"name": "saldo", "description": "Saldo mensal e resumo por categoria."},
    {
        "name": "parcelamentos",
        "description": "Compras parceladas e parcelas restantes.",
    },
    {
        "name": "financeiro",
        "description": "Planejamento agregado: resumo do mês e projeção de saldo.",
    },
    {
        "name": "análise financeira",
        "description": "Análise de risco antes da compra (`can-i-buy`) e recomendações.",
    },
    {
        "name": "disciplina",
        "description": "Modo Disciplina: limites de gasto, pontuação, sequências e avisos.",
    },
    {
        "name": "planejamento",
        "description": (
            "Distribuição de renda por categoria, objetivos financeiros, "
            "resumo do mês e alertas de limites."
        ),
    },
    {"name": "saúde", "description": "Probes de liveness e readiness."},
]


def create_app() -> FastAPI:
    configure_logging()

    app = FastAPI(
        title=settings.app_name,
        debug=settings.debug,
        version="1.0.0",
        openapi_tags=OPENAPI_TAGS_METADATA,
        description=(
            "Backend de um sistema de planejamento financeiro pessoal. "
            "Todos os endpoints ficam sob `/api/v1`."
        ),
    )

    # A ordem importa: o logger de request fica no começo para que erros
    # nos outros middlewares também sejam capturados. Rate limit e CORS
    # vêm depois.
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
