"""Endpoints de saúde.

`/health` é um liveness probe simples — retorna 200 se o processo subiu.
`/health/ready` é o readiness probe — ele também faz ping no banco.
Se o ping no banco falha, devolvemos 503 para o orquestrador (Docker/K8s)
tirar a instância da rotação sem precisar reiniciar.
"""
import logging
from typing import Literal

from fastapi import APIRouter, Depends, Response, status
from pydantic import BaseModel
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.database.session import get_db

logger = logging.getLogger(__name__)

router = APIRouter(tags=["saúde"])


class HealthResponse(BaseModel):
    status: Literal["ok"]


class ReadinessComponent(BaseModel):
    status: Literal["ok", "fail"]
    detail: str | None = None


class ReadinessResponse(BaseModel):
    status: Literal["ok", "degraded"]
    components: dict[str, ReadinessComponent]


@router.get("/health", response_model=HealthResponse)
def health() -> HealthResponse:
    return HealthResponse(status="ok")


@router.get("/health/ready", response_model=ReadinessResponse)
def readiness(response: Response, db: Session = Depends(get_db)) -> ReadinessResponse:
    components: dict[str, ReadinessComponent] = {}
    try:
        db.execute(text("SELECT 1"))
        components["database"] = ReadinessComponent(status="ok")
    except SQLAlchemyError as exc:
        logger.warning("readiness DB ping failed: %s", exc)
        components["database"] = ReadinessComponent(status="fail", detail=str(exc))

    overall = (
        "ok"
        if all(c.status == "ok" for c in components.values())
        else "degraded"
    )
    if overall != "ok":
        response.status_code = status.HTTP_503_SERVICE_UNAVAILABLE
    return ReadinessResponse(status=overall, components=components)
