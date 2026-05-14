# Personal Financial Planning System — Backend

FastAPI service that tracks income, expenses, installment purchases, and overall financial health. Exposes a clean REST API under `/api/v1`, ships with Alembic migrations, JWT auth, rate limiting, structured logging, an optional Redis cache, and a Discipline Mode that scores spending behaviour.

The architecture is intentionally layered (routes → services → repositories → models) and every piece of business logic is unit-tested. The frontend lives next door in [`../frontend`](../frontend).

---

## Tech stack

- **Python 3.12+**
- **FastAPI** — HTTP framework, OpenAPI/Swagger out of the box
- **SQLAlchemy 2.0** — ORM (typed `Mapped[...]` style)
- **Alembic** — schema migrations
- **MySQL 8** — primary store, **Redis 7** — optional cache
- **Pydantic v2** + **pydantic-settings** — validation & typed config
- **python-jose** + **bcrypt** — JWT + password hashing
- **slowapi** — per-IP rate limiting
- **Pytest** + **httpx** — 111 tests, in-memory SQLite for speed
- **Docker** / **Docker Compose** — one-command boot, multi-stage build, non-root runtime

---

## Quickstart (Docker)

Run from the **repo root** (one level up):

```bash
cp backend/.env.example backend/.env
docker compose up --build
```

The backend container runs `alembic upgrade head` before booting Uvicorn, so the schema is ready on first start.

- API:        http://localhost:8000/api/v1
- Swagger UI: http://localhost:8000/docs
- ReDoc:      http://localhost:8000/redoc
- Liveness:   http://localhost:8000/health
- Readiness:  http://localhost:8000/health/ready  *(pings the DB)*

Stop the stack:

```bash
docker compose down
```

Reset everything (drops the MySQL volume):

```bash
docker compose down -v
```

---

## Local development (without Docker)

Run all backend commands from this directory (`backend/`):

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# Point DATABASE_URL at your own MySQL (or SQLite for quick experiments), then:
alembic upgrade head
uvicorn app.main:app --reload
```

Run the test suite (uses in-memory SQLite — no MySQL/Redis needed):

```bash
pytest
```

---

## Architecture

```
routes/        HTTP layer  — FastAPI endpoints, request/response wiring
  ↓
services/      Business logic — orchestration, validation, policy
  ↓
repositories/  Data access  — every SQL query lives here
  ↓
models/        ORM entities — SQLAlchemy 2.0 declarative models
```

### Folder layout

```
backend/
├── app/
│   ├── main.py            FastAPI factory + middleware wiring
│   ├── core/              cross-cutting infrastructure
│   │   ├── config.py        pydantic-settings; runtime-validated env loader
│   │   └── logging.py       stdlib logging setup with request-id filter
│   ├── auth/              bcrypt + JWT + get_current_user dependency
│   ├── database/          engine, SessionLocal, get_db dependency
│   ├── middleware/        request logger, rate limiter, error handler
│   ├── models/            SQLAlchemy 2.0 ORM entities
│   ├── repositories/      data access — every SQL query lives here
│   ├── routes/            FastAPI endpoints (HTTP layer, mounted under /api/v1)
│   ├── schemas/           Pydantic request/response models
│   ├── services/          business logic + pure calculation modules
│   ├── utils/             shared enums, cache abstraction
│   └── tests/             pytest suite (in-memory SQLite, 111 tests)
├── alembic/               migrations + env.py
├── alembic.ini
├── pytest.ini
├── requirements.txt
├── Dockerfile
└── .env.example
```

- **`core/`** is the home for cross-cutting infrastructure. `core/config.py` is the single source of truth for application settings (`pydantic-settings`, runtime-validated, refuses to boot in `production` with insecure defaults). `core/logging.py` configures stdlib logging and the request-id filter.
- **`utils/`** is for small, generic helpers (enums, the Redis-or-in-memory cache abstraction).
- **`tests/`** uses fixtures that swap in an in-memory SQLite engine, disable the rate limiter, and reset the cache between tests.

### Why this shape?

- **Routes stay thin.** They parse input, call a service, and return a schema.
- **Services own behaviour.** Easy to unit-test, easy to reuse across routes (e.g. financial calculations are reused in `/financial/*` and `/financial-analysis/*`).
- **Repositories own SQL.** Swap MySQL for Postgres? Optimise a query? You only touch one file.
- **Auth is a dependency, not a decorator.** `Depends(get_current_user)` makes per-route protection explicit and self-documenting.
- **Pure calculations live in `*_calculations.py` modules** — no DB, no FastAPI imports — so they're trivial to test in isolation.

---

## Feature overview

| Area | What it does | Key endpoints |
| --- | --- | --- |
| **Auth** | Register, login, JWT bearer tokens | `POST /api/v1/auth/{register,login}` |
| **Users** | Manage current-user profile | `GET/PATCH/DELETE /api/v1/users/me` |
| **Expenses** | CRUD + CSV bulk import | `/api/v1/expenses` (`POST /import-csv`) |
| **Installments** | Track installment purchases & remaining commitments | `/api/v1/installments` |
| **Balance** | Current month balance and per-category breakdown | `/api/v1/balance` |
| **Financial planning** | Monthly summary, future balance projections | `/api/v1/financial/{month-summary,future-balance}` |
| **Purchase analysis** | "Can I buy this?" — risk + safe installment suggestions | `POST /api/v1/financial-analysis/can-i-buy` |
| **Discipline Mode** | Spend caps, score, warnings, daily streak | `/api/v1/discipline/{status,score,warnings,settings}` |
| **Health** | Liveness + readiness (DB ping) | `GET /health`, `GET /health/ready` |

---

## Database schema

| table | purpose |
| --- | --- |
| `users`            | account, hashed password, monthly salary |
| `expenses`         | per-user expense log with category and recurring flag |
| `installments`     | installment purchases with remaining-payment tracking |
| `discipline_mode`  | per-user discipline thresholds, score, and streak (one-to-one) |

All migrations live in `alembic/versions/` (`0001` users+expenses, `0002` installments, `0003` discipline_mode). Foreign keys cascade on user deletion.

---

## Production-quality features

### Logging
- Stdlib logging configured by `app/utils/logging_config.py` with a key=value format.
- Every request gets a UUID `X-Request-ID` (or echoes the client-supplied one) and is logged with method, path, status, and duration via `RequestLoggingMiddleware`.
- Unhandled exceptions are logged with the same correlation ID before the global error handler returns a sanitised JSON response.

### Rate limiting
- `slowapi` middleware enforces a global default limit (`RATE_LIMIT_DEFAULT`).
- Auth endpoints carry a stricter limit (`RATE_LIMIT_AUTH`, default `10/minute`) to slow brute-force attempts.
- Violations return `429` with a structured error body and a `Retry-After` header.

### Cache
- Tiny TTL cache (`app/utils/cache.py`) with two backends: Redis when `REDIS_URL` is set, in-memory otherwise.
- Used selectively — past-month financial summaries are cached for an hour because they don't change. Live data is never cached.

### Security
- JWT decode pins to the configured algorithm only (defends against alg-confusion / `alg=none` forgery), and requires `sub`, `exp`, and `type=access` claims.
- `Settings` refuses to boot in `APP_ENV=production` if `JWT_SECRET_KEY` is the default or shorter than 32 chars, if `DEBUG=true`, or if `CORS_ORIGINS=*`.
- Passwords hashed with bcrypt; expense amounts and percentages validated via Pydantic + DB `CHECK` constraints.

### Docker
- Multi-stage build: dependencies installed in a builder image, only the venv + source copied into the runtime image (no gcc, no `-dev` packages).
- Runs as a **non-root** user (`app`) in the runtime image.
- `HEALTHCHECK` configured at both the Dockerfile and Compose level.

### CSV import
- `POST /api/v1/expenses/import-csv` accepts a UTF-8 CSV (`title,amount,category,recurring`).
- Per-row validation: invalid rows are reported back with row numbers and reasons; valid rows are imported.
- Hard limits on file size and row count (`CSV_IMPORT_MAX_BYTES`, `CSV_IMPORT_MAX_ROWS`).
- Audit log entry written via FastAPI `BackgroundTasks` so the response isn't blocked.

---

## Configuration

All config is read from environment variables via `pydantic-settings`. Full list in `.env.example`. Highlights:

| variable | purpose | default |
| --- | --- | --- |
| `APP_ENV`              | `development` / `staging` / `production` / `test` | `development` |
| `DEBUG`                | extra logging + reload friendliness | `false` |
| `LOG_LEVEL`            | DEBUG / INFO / WARNING / ERROR | `INFO` |
| `DATABASE_URL`         | SQLAlchemy connection string | MySQL via Compose |
| `JWT_SECRET_KEY`       | **required** in production, 32+ chars | `change-me` (rejected in prod) |
| `JWT_EXPIRE_MINUTES`   | token lifetime | `60` |
| `CORS_ORIGINS`         | comma-separated, or `*` (rejected in prod) | `*` |
| `RATE_LIMIT_*`         | per-IP `slowapi` limits | see `.env.example` |
| `REDIS_URL`            | enables Redis cache backend | unset |
| `CACHE_DEFAULT_TTL_SECONDS` | default cache TTL | `60` |
| `CSV_IMPORT_MAX_BYTES` / `CSV_IMPORT_MAX_ROWS` | upload limits | `2 MiB` / `5000` |

---

## Example usage

```bash
# Register
curl -X POST http://localhost:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Alice","email":"alice@example.com","password":"strongpass1","monthly_salary":5000}'

# Login → grab the token
TOKEN=$(curl -s -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"alice@example.com","password":"strongpass1"}' \
  | python -c "import sys, json; print(json.load(sys.stdin)['access_token'])")

# Track an installment purchase
curl -X POST http://localhost:8000/api/v1/installments \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"product_name":"Laptop","total_amount":3000,"installment_value":250,"total_installments":12,"purchase_date":"2026-01-15"}'

# Ask: can I afford a $3500 purchase over 10 months?
curl -X POST http://localhost:8000/api/v1/financial-analysis/can-i-buy \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"product_price":3500,"installments":10}'

# Bulk-import expenses from a CSV
curl -X POST http://localhost:8000/api/v1/expenses/import-csv \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@expenses.csv"

# Check Discipline Mode
curl -H "Authorization: Bearer $TOKEN" http://localhost:8000/api/v1/discipline/status
```

Valid expense categories: `housing`, `food`, `transport`, `health`, `education`, `entertainment`, `utilities`, `shopping`, `savings`, `other`.

---

## Testing

```bash
pytest               # all tests (~30s, in-memory SQLite)
pytest -v
pytest app/tests/test_discipline.py
```

Test conftest:
- swaps a SQLite in-memory engine in for the configured DB
- disables the rate limiter
- resets the cache backend between tests
- auto-prefixes test paths with `/api/v1` so tests stay readable

The suite covers happy paths, edge cases (zero salary, paid-off installments, leisure overspend), security (algorithm pinning, expired tokens, missing claims), validation (oversized uploads, negative values), and infrastructure (request ID propagation, rate-limit 429 shape, cache TTL).

---

## Production deployment notes

1. Set `APP_ENV=production`, `DEBUG=false`, an explicit `CORS_ORIGINS`, and a strong `JWT_SECRET_KEY` (32+ chars). The app refuses to boot if any of these are misconfigured.
2. Point `DATABASE_URL` at a managed MySQL/Postgres-compatible store.
3. Set `REDIS_URL` if you're running multiple replicas — the in-memory cache is per-process.
4. Run behind a TLS-terminating reverse proxy. Uvicorn is launched with `--proxy-headers` so `X-Forwarded-For` is honoured for rate-limit keys.
5. Watch `/health/ready` for readiness probes; `/health` for liveness.

---

## Roadmap (intentionally not in scope)

- Multi-currency, budget envelopes, recurring expense automation
- Refresh tokens, password reset, 2FA
- AI-driven prediction & recommendations
- Distributed task queue (Celery / RQ) if/when long-running jobs appear

The current layering is designed to absorb these without restructuring.
