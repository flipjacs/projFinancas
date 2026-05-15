"""CSV expense import.

Expected header (case-insensitive): title, amount, category, recurring
- title:     non-empty string, max 180 chars
- amount:    decimal >= 0
- category:  one of ExpenseCategory values
- recurring: optional, "true"/"false"/"1"/"0"/"yes"/"no" (defaults to false)

Rejects oversized payloads or row counts before parsing. Per-row failures are
collected; partial imports succeed and the caller gets a structured report.
"""
import csv
import io
from decimal import Decimal, InvalidOperation
from typing import Iterable

from pydantic import ValidationError
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.expense import Expense
from app.repositories.expense_repository import ExpenseRepository
from app.schemas.expense import CSVImportResult, CSVImportRowError, ExpenseCreate
from app.utils.enums import ExpenseCategory

REQUIRED_HEADERS = {"title", "amount", "category"}
TRUE_VALUES = {"true", "1", "yes", "y"}
FALSE_VALUES = {"false", "0", "no", "n", ""}


class CSVImportError(Exception):
    """Raised for whole-file failures (oversized, malformed header, etc.)."""


def _parse_bool(raw: str | None) -> bool:
    if raw is None:
        return False
    value = raw.strip().lower()
    if value in TRUE_VALUES:
        return True
    if value in FALSE_VALUES:
        return False
    raise ValueError(f"invalid boolean value: {raw!r}")


def _parse_amount(raw: str) -> Decimal:
    try:
        return Decimal(raw.strip())
    except (InvalidOperation, AttributeError) as exc:
        raise ValueError(f"invalid amount: {raw!r}") from exc


def _parse_category(raw: str) -> str:
    value = (raw or "").strip().lower()
    try:
        return ExpenseCategory(value).value
    except ValueError as exc:
        raise ValueError(f"invalid category: {raw!r}") from exc


def _decode(content: bytes) -> str:
    if len(content) > settings.csv_import_max_bytes:
        raise CSVImportError(
            f"CSV too large (limit {settings.csv_import_max_bytes} bytes)"
        )
    try:
        return content.decode("utf-8-sig")
    except UnicodeDecodeError as exc:
        raise CSVImportError("CSV must be UTF-8 encoded") from exc


def _normalised_rows(text: str) -> Iterable[tuple[int, dict[str, str]]]:
    reader = csv.DictReader(io.StringIO(text))
    if not reader.fieldnames:
        raise CSVImportError("CSV is empty")
    headers = {h.strip().lower() for h in reader.fieldnames}
    missing = REQUIRED_HEADERS - headers
    if missing:
        raise CSVImportError(
            f"Missing required header(s): {', '.join(sorted(missing))}"
        )
    for index, raw_row in enumerate(reader, start=2):  # row 1 is the header
        yield index, {(k or "").strip().lower(): (v or "") for k, v in raw_row.items()}


class CSVImportService:
    def __init__(self, db: Session) -> None:
        self.expenses = ExpenseRepository(db)

    def import_expenses(self, user_id: int, content: bytes) -> CSVImportResult:
        text = _decode(content)
        rows = list(_normalised_rows(text))
        if len(rows) > settings.csv_import_max_rows:
            raise CSVImportError(
                f"CSV exceeds row limit ({settings.csv_import_max_rows})"
            )

        errors: list[CSVImportRowError] = []
        to_insert: list[Expense] = []

        for row_number, row in rows:
            try:
                payload = ExpenseCreate(
                    title=row.get("title", "").strip(),
                    amount=_parse_amount(row.get("amount", "")),
                    category=_parse_category(row.get("category", "")),
                    recurring=_parse_bool(row.get("recurring")),
                )
            except (ValueError, ValidationError) as exc:
                errors.append(
                    CSVImportRowError(row_number=row_number, error=str(exc))
                )
                continue

            to_insert.append(
                Expense(
                    user_id=user_id,
                    title=payload.title,
                    amount=payload.amount,
                    category=payload.category.value,
                    recurring=payload.recurring,
                )
            )

        self.expenses.bulk_create(to_insert)

        return CSVImportResult(
            received_rows=len(rows),
            imported=len(to_insert),
            skipped=len(errors),
            errors=errors,
        )
