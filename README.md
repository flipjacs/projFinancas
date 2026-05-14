# Personal Financial Planning System

A full-stack personal finance app: FastAPI backend, React + Vite frontend, MySQL + Redis. Tracks income, expenses, installment purchases, scores spending discipline, and answers "can I afford this purchase?".

```
.
├── backend/             FastAPI service · Alembic migrations · pytest suite
├── frontend/            React + Vite + TypeScript SPA
└── docker-compose.yml   one-command boot for the whole stack
```

Each side has its own README with the details:

- [`backend/README.md`](./backend/README.md) — architecture, endpoints, env vars, deploy notes
- [`frontend/README.md`](./frontend/README.md) — components, data flow, dev scripts

---

## Quickstart

```bash
cp backend/.env.example backend/.env
docker compose up --build
```

- Frontend (nginx + SPA): http://localhost:5173
- Backend API:            http://localhost:8000/api/v1
- Swagger docs:           http://localhost:8000/docs
- Health probes:          http://localhost:8000/health · `/health/ready`

Reset everything (drops the MySQL volume):

```bash
docker compose down -v
```

---

## Stack at a glance

| Layer | Tech |
| --- | --- |
| Backend | Python 3.12 · FastAPI · SQLAlchemy 2 · Alembic · Pydantic v2 · slowapi · redis-py |
| Frontend | React 18 · TypeScript · Vite · TailwindCSS · shadcn/ui · React Query · Zustand · Recharts |
| Storage | MySQL 8 (primary) · Redis 7 (cache, optional) |
| Tests | pytest (111 tests, in-memory SQLite) |
| Runtime | Docker · multi-stage builds · non-root containers · healthchecks |

---

## Local development

Run the two sides independently when you want hot-reload on both:

```bash
# Terminal 1 — backend
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --reload

# Terminal 2 — frontend
cd frontend
npm install
npm run dev
```

The Vite dev server proxies `/api/v1` and `/health` to `http://localhost:8000`, so no CORS setup is required.
