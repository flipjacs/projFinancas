import io

import pytest
from fastapi.testclient import TestClient

from app.core.config import settings


def _upload(client: TestClient, headers: dict, content: bytes) -> dict:
    files = {"file": ("expenses.csv", io.BytesIO(content), "text/csv")}
    return client.post("/expenses/import-csv", files=files, headers=headers).json()


def test_csv_import_valid_rows(client: TestClient, auth_headers: dict) -> None:
    csv_bytes = (
        b"title,amount,category,recurring\n"
        b"Rent,1500.00,housing,true\n"
        b"Groceries,250.00,food,false\n"
        b"Bus pass,80,transport,1\n"
    )
    files = {"file": ("expenses.csv", io.BytesIO(csv_bytes), "text/csv")}
    response = client.post("/expenses/import-csv", files=files, headers=auth_headers)
    assert response.status_code == 200
    body = response.json()
    assert body == {
        "received_rows": 3,
        "imported": 3,
        "skipped": 0,
        "errors": [],
    }
    listing = client.get("/expenses", headers=auth_headers).json()
    assert len(listing) == 3


def test_csv_import_collects_per_row_errors(
    client: TestClient, auth_headers: dict
) -> None:
    csv_bytes = (
        b"title,amount,category,recurring\n"
        b"Good,100,food,false\n"
        b"Bad amount,not-a-number,food,false\n"
        b"Bad category,50,not-real,false\n"
        b"Bad bool,50,food,maybe\n"
    )
    body = _upload(client, auth_headers, csv_bytes)
    assert body["received_rows"] == 4
    assert body["imported"] == 1
    assert body["skipped"] == 3
    error_rows = sorted(e["row_number"] for e in body["errors"])
    assert error_rows == [3, 4, 5]


def test_csv_import_rejects_missing_headers(
    client: TestClient, auth_headers: dict
) -> None:
    csv_bytes = b"title,amount\nRent,1500\n"
    files = {"file": ("expenses.csv", io.BytesIO(csv_bytes), "text/csv")}
    response = client.post("/expenses/import-csv", files=files, headers=auth_headers)
    assert response.status_code == 400
    assert "category" in response.json()["error"]["message"]


def test_csv_import_rejects_oversized_file(
    client: TestClient, auth_headers: dict
) -> None:
    original_limit = settings.csv_import_max_bytes
    settings.csv_import_max_bytes = 100
    try:
        csv_bytes = (
            b"title,amount,category\n"
            + b"Rent,1500,housing\n" * 50  # well over 100 bytes
        )
        files = {"file": ("expenses.csv", io.BytesIO(csv_bytes), "text/csv")}
        response = client.post(
            "/expenses/import-csv", files=files, headers=auth_headers
        )
        assert response.status_code == 400
        assert "too large" in response.json()["error"]["message"].lower()
    finally:
        settings.csv_import_max_bytes = original_limit


def test_csv_import_rejects_non_utf8(
    client: TestClient, auth_headers: dict
) -> None:
    csv_bytes = b"title,amount,category\n\xff\xfeBad,100,food\n"
    files = {"file": ("expenses.csv", io.BytesIO(csv_bytes), "text/csv")}
    response = client.post("/expenses/import-csv", files=files, headers=auth_headers)
    assert response.status_code == 400


def test_csv_import_requires_authentication(client: TestClient) -> None:
    files = {"file": ("expenses.csv", io.BytesIO(b"title,amount,category\n"), "text/csv")}
    assert client.post("/expenses/import-csv", files=files).status_code == 401


def test_csv_import_rejects_unsupported_content_type(
    client: TestClient, auth_headers: dict
) -> None:
    files = {
        "file": (
            "expenses.bin",
            io.BytesIO(b"title,amount,category\n"),
            "application/octet-stream",
        )
    }
    response = client.post("/expenses/import-csv", files=files, headers=auth_headers)
    assert response.status_code == 415


def test_csv_import_handles_utf8_bom(client: TestClient, auth_headers: dict) -> None:
    csv_bytes = "﻿title,amount,category\nCafé,12.50,food\n".encode("utf-8")
    body = _upload(client, auth_headers, csv_bytes)
    assert body["imported"] == 1
    listing = client.get("/expenses", headers=auth_headers).json()
    assert listing[0]["title"] == "Café"
