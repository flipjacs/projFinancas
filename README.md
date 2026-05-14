# Financeiro — Sistema de Planejamento Pessoal

Projeto full-stack para controle de finanças pessoais. Fui montando ele para estudar
backend de verdade (FastAPI + SQLAlchemy + JWT + testes) e depois plugando um frontend
em React/Vite para deixar mais apresentável.

A ideia é simples: o usuário cadastra salário, gastos e parcelamentos, e o sistema
responde perguntas tipo *"posso comprar isso aí?"* analisando o impacto da compra
na renda do mês.

```
.
├── backend/             API em FastAPI + SQLAlchemy + Alembic + pytest
├── frontend/            SPA em React 18 + Vite + TypeScript + Tailwind
└── docker-compose.yml   sobe tudo com um comando só
```

Cada lado tem o próprio README com mais detalhes:

- [`backend/README.md`](./backend/README.md) — arquitetura, endpoints, variáveis de ambiente
- [`frontend/README.md`](./frontend/README.md) — componentes, fluxo de dados, scripts

---

## Funcionalidades

- 📋 Cadastro e login com JWT
- 💰 CRUD de gastos com categorias e import via CSV
- 📅 Cadastro de compras parceladas com projeção de saldo futuro
- 📊 Painel com gráficos de gastos por categoria e por mês
- 🤔 Análise *"Posso comprar isso?"* com nível de risco, impacto no mês e sugestões mais seguras
- 🌙 Tema claro/escuro
- ⌨️ Atalhos de teclado (⌘K busca rápida, `g` + letra para navegar)

---

## Como rodar

### Modo Docker (mais fácil)

```bash
cp backend/.env.example backend/.env
docker compose up --build
```

- Frontend: <http://localhost:5173>
- API: <http://localhost:8000/api/v1>
- Swagger: <http://localhost:8000/docs>
- Health: <http://localhost:8000/health>

Para resetar tudo (apaga o banco):

```bash
docker compose down -v
```

### Modo local (hot reload nos dois lados)

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

O Vite já está configurado para dar proxy de `/api/v1` → `http://localhost:8000`,
então não precisa mexer em CORS.

---

## Stack

| Camada | Tech |
| --- | --- |
| Backend | Python 3.12 · FastAPI · SQLAlchemy 2 · Alembic · Pydantic v2 · slowapi · redis-py |
| Frontend | React 18 · TypeScript · Vite · TailwindCSS · React Query · Zustand · Recharts |
| Banco | MySQL 8 (principal) · Redis 7 (cache, opcional) |
| Testes | pytest (111 testes, SQLite em memória) |
| Infra | Docker · build multi-stage · containers não-root · healthchecks |

---

## Screenshots

> Adicione capturas reais em `docs/screenshots/` e referencie aqui.

- `docs/screenshots/painel.png` — Painel principal
- `docs/screenshots/gastos.png` — Página de gastos
- `docs/screenshots/parcelamentos.png` — Lista de parcelamentos
- `docs/screenshots/posso-comprar.png` — Análise "posso comprar?"

---

## Estrutura

Cada subprojeto é independente e tem o próprio Dockerfile, mas no `docker-compose.yml`
os dois rodam juntos no mesmo network — o nginx do frontend faz reverse-proxy de
`/api/v1` para o serviço `backend`, então o bundle usa URLs same-origin (sem CORS).

Os testes do backend usam SQLite em memória para ficarem rápidos e independentes. O
banco de verdade em produção é MySQL via SQLAlchemy.

---

## Próximos passos

- [ ] Modo Disciplina (limites de gasto + pontuação) — backend pronto, falta UI
- [ ] Página de planejamento financeiro (resumo do mês + projeção futura)
- [ ] Testes de componente no frontend (Vitest + Testing Library)
- [ ] Deploy

---

Projeto desenvolvido como estudo pessoal e portfólio.
