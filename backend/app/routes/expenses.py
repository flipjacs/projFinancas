import logging

from fastapi import (
    APIRouter,
    BackgroundTasks,
    Depends,
    File,
    HTTPException,
    Query,
    UploadFile,
    status,
)
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_user
from app.database.session import get_db
from app.models.user import User
from app.schemas.expense import (
    CSVImportResult,
    ExpenseCreate,
    ExpenseResponse,
    ExpenseUpdate,
)
from app.services.csv_import_service import CSVImportError, CSVImportService
from app.services.expense_service import ExpenseService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/expenses", tags=["gastos"])


def _audit_csv_import(user_id: int, result: CSVImportResult) -> None:
    logger.info(
        "csv_import user_id=%d received=%d imported=%d skipped=%d",
        user_id,
        result.received_rows,
        result.imported,
        result.skipped,
    )


@router.get("", response_model=list[ExpenseResponse])
def list_expenses(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, gt=0, le=500),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[ExpenseResponse]:
    items = ExpenseService(db).list_for_user(current_user.id, skip=skip, limit=limit)
    return [ExpenseResponse.model_validate(item) for item in items]


@router.post("", response_model=ExpenseResponse, status_code=status.HTTP_201_CREATED)
def create_expense(
    payload: ExpenseCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ExpenseResponse:
    item = ExpenseService(db).create(current_user.id, payload)
    return ExpenseResponse.model_validate(item)


@router.get("/{expense_id}", response_model=ExpenseResponse)
def get_expense(
    expense_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ExpenseResponse:
    item = ExpenseService(db).get_owned(current_user.id, expense_id)
    return ExpenseResponse.model_validate(item)


@router.patch("/{expense_id}", response_model=ExpenseResponse)
def update_expense(
    expense_id: int,
    payload: ExpenseUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ExpenseResponse:
    item = ExpenseService(db).update(current_user.id, expense_id, payload)
    return ExpenseResponse.model_validate(item)


@router.delete("/{expense_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_expense(
    expense_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> None:
    ExpenseService(db).delete(current_user.id, expense_id)


@router.post(
    "/import-csv",
    response_model=CSVImportResult,
    summary="Importar gastos em lote a partir de um CSV",
    description=(
        "Recebe um CSV em UTF-8 com as colunas `title,amount,category,recurring`. "
        "Cada linha é validada de forma independente — linhas inválidas são "
        "reportadas no resultado sem abortar a importação."
    ),
)
def import_expenses_csv(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> CSVImportResult:
    if file.content_type and file.content_type not in {
        "text/csv",
        "application/csv",
        "application/vnd.ms-excel",
        "text/plain",
    }:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail=f"Tipo de arquivo não suportado: {file.content_type}",
        )
    content = file.file.read()
    try:
        result = CSVImportService(db).import_expenses(current_user.id, content)
    except CSVImportError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)
        ) from exc

    background_tasks.add_task(_audit_csv_import, current_user.id, result)
    return result
