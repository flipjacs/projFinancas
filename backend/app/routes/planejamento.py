from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_user
from app.database.session import get_db
from app.models.user import User
from app.schemas.planejamento import (
    AlertasResponse,
    DistribuicaoCreate,
    DistribuicaoResponse,
    DistribuicaoUpdate,
    ObjetivoCreate,
    ObjetivoResponse,
    ObjetivoUpdate,
    PlanejamentoResumo,
)
from app.services.planejamento_service import PlanejamentoService

router = APIRouter(prefix="/planejamento", tags=["planejamento"])


# ---------- Distribuição ----------


@router.get("/distribuicao", response_model=list[DistribuicaoResponse])
def listar_distribuicoes(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[DistribuicaoResponse]:
    return PlanejamentoService(db).listar_distribuicoes(current_user)


@router.post(
    "/distribuicao",
    response_model=DistribuicaoResponse,
    status_code=status.HTTP_201_CREATED,
)
def criar_distribuicao(
    payload: DistribuicaoCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> DistribuicaoResponse:
    return PlanejamentoService(db).criar_distribuicao(current_user, payload)


@router.put("/distribuicao/{distribuicao_id}", response_model=DistribuicaoResponse)
def atualizar_distribuicao(
    distribuicao_id: int,
    payload: DistribuicaoUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> DistribuicaoResponse:
    return PlanejamentoService(db).atualizar_distribuicao(
        current_user, distribuicao_id, payload
    )


@router.delete(
    "/distribuicao/{distribuicao_id}", status_code=status.HTTP_204_NO_CONTENT
)
def deletar_distribuicao(
    distribuicao_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> None:
    PlanejamentoService(db).deletar_distribuicao(current_user, distribuicao_id)


# ---------- Objetivos ----------


@router.get("/objetivos", response_model=list[ObjetivoResponse])
def listar_objetivos(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[ObjetivoResponse]:
    return PlanejamentoService(db).listar_objetivos(current_user)


@router.post(
    "/objetivos",
    response_model=ObjetivoResponse,
    status_code=status.HTTP_201_CREATED,
)
def criar_objetivo(
    payload: ObjetivoCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ObjetivoResponse:
    return PlanejamentoService(db).criar_objetivo(current_user, payload)


@router.put("/objetivos/{objetivo_id}", response_model=ObjetivoResponse)
def atualizar_objetivo(
    objetivo_id: int,
    payload: ObjetivoUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ObjetivoResponse:
    return PlanejamentoService(db).atualizar_objetivo(
        current_user, objetivo_id, payload
    )


@router.delete("/objetivos/{objetivo_id}", status_code=status.HTTP_204_NO_CONTENT)
def deletar_objetivo(
    objetivo_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> None:
    PlanejamentoService(db).deletar_objetivo(current_user, objetivo_id)


# ---------- Análise ----------


@router.get("/resumo", response_model=PlanejamentoResumo)
def resumo_planejamento(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> PlanejamentoResumo:
    return PlanejamentoService(db).resumo(current_user)


@router.get("/alertas", response_model=AlertasResponse)
def alertas_planejamento(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> AlertasResponse:
    return PlanejamentoService(db).alertas(current_user)
