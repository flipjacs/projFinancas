# Sistema de Planejamento Financeiro Pessoal

Aplicação full-stack para controle e planejamento de finanças pessoais. O usuário
cadastra renda, gastos e parcelamentos, define limites por categoria e objetivos
financeiros, e o sistema responde perguntas práticas como *"posso comprar isso?"*
analisando o impacto da compra no orçamento do mês.

> Projeto desenvolvido como estudo pessoal e portfólio — foco em arquitetura limpa,
> testes automatizados e fluxo de execução simples para qualquer máquina.

---

## Descrição

O sistema combina quatro frentes:

- **Controle financeiro** — cadastro de gastos com categorias, importação via CSV
  e visualizações em gráficos (por categoria e por mês).
- **Planejamento financeiro** — distribuição da renda mensal entre categorias,
  acompanhamento de quanto foi gasto vs. o limite definido e alertas quando o
  usuário se aproxima do teto.
- **Modo Disciplina** — pontuação, sequências e avisos para reforçar hábitos de
  contenção de gastos.
- **Objetivos financeiros** — metas (ex.: reserva de emergência, viagem) com
  progresso baseado em aportes e tempo restante.

Cobertura adicional:

- Cadastro de compras parceladas com projeção de saldo futuro.
- Análise *"Posso comprar isso?"* — nível de risco, impacto no mês e sugestões
  mais seguras.
- Autenticação JWT, rate limit por rota e cache opcional via Redis.

---

## Tecnologias usadas

### Backend
- **FastAPI** (Python 3.12) — framework web async
- **SQLAlchemy 2 + Alembic** — ORM e migrações
- **MySQL 8** — banco principal
- **Pydantic v2** — validação e settings
- **JWT (python-jose)** — autenticação
- **slowapi** — rate limiting
- **Redis** (opcional) — cache distribuído
- **pytest** — 111+ testes em SQLite em memória

### Frontend
- **React 18 + TypeScript**
- **Vite** — build tool
- **TailwindCSS** + Radix UI — design system
- **React Query** — cache de dados do servidor
- **Zustand** — estado global de auth
- **Recharts** — gráficos
- **React Hook Form + Zod** — formulários e validação

### Infra
- **Docker** + **docker compose** — orquestração local
- **nginx** — serve o bundle do front e faz reverse-proxy para a API
- Build multi-stage, containers não-root, healthchecks em todos os serviços

---

## Funcionalidades

- 🔐 Cadastro e login com JWT, hash de senha com bcrypt
- 💰 CRUD de gastos com categorias e importação via CSV
- 📅 Compras parceladas com projeção de saldo futuro
- 📊 Painel com gráficos de gastos por categoria e por mês
- 🤔 Análise *"Posso comprar isso?"* com nível de risco e sugestões
- 🎯 Objetivos financeiros com progresso e prazo
- 📈 Planejamento mensal — distribuição da renda por categoria com alertas
- 🧘 Modo Disciplina — pontuação, sequência e limites comportamentais
- 🌙 Tema claro/escuro
- ⌨️ Atalhos de teclado (⌘K busca rápida, `g` + letra para navegar)

---

## Estrutura do projeto

```
financeiro-system/
├── backend/                  API FastAPI + SQLAlchemy + Alembic + pytest
│   ├── app/
│   │   ├── auth/             JWT, hashing, dependências de auth
│   │   ├── core/             config (pydantic-settings) e logging
│   │   ├── database/         engine, session, Base
│   │   ├── middleware/       error handler, rate limit, request logger
│   │   ├── models/           SQLAlchemy ORM
│   │   ├── repositories/     camada de acesso a dados
│   │   ├── routes/           endpoints HTTP
│   │   ├── schemas/          Pydantic (request/response)
│   │   ├── services/         regras de negócio
│   │   ├── tests/            pytest (SQLite em memória)
│   │   └── utils/            cache, enums
│   ├── alembic/              migrações de banco
│   ├── Dockerfile
│   └── requirements.txt
│
├── frontend/                 SPA React + Vite + TypeScript + Tailwind
│   ├── src/
│   │   ├── components/       UI, charts, dialogs
│   │   ├── contexts/         tema
│   │   ├── hooks/            React Query hooks por domínio
│   │   ├── layouts/          shell da app, sidebar, navbar
│   │   ├── pages/            rotas
│   │   ├── routes/           AppRouter
│   │   ├── services/         clients HTTP (axios)
│   │   ├── stores/           Zustand (auth)
│   │   ├── styles/           Tailwind + globals
│   │   ├── types/            tipos compartilhados
│   │   └── utils/            formatação
│   ├── Dockerfile
│   ├── nginx.conf
│   └── package.json
│
├── docker-compose.yml        sobe MySQL + Redis + backend + frontend
├── .env.example              variáveis de exemplo para o compose
├── Makefile                  atalhos (up, down, logs, test, migrate)
└── README.md
```

---

## Como rodar localmente

### Pré-requisitos

- [Docker](https://docs.docker.com/get-docker/) **20.10+** e Docker Compose v2
- (opcional) `make` para usar os atalhos do Makefile

### Modo Docker — recomendado

```bash
# 1. Clone o repositório
git clone https://github.com/<seu-usuario>/financeiro-system.git
cd financeiro-system

# 2. Crie o arquivo de ambiente a partir do exemplo
cp .env.example .env

# 3. Suba tudo (MySQL + Redis + backend + frontend)
docker compose up --build
```

Os serviços ficarão disponíveis em:

| Serviço | URL |
| --- | --- |
| Frontend | <http://localhost:5173> |
| API | <http://localhost:8000/api/v1> |
| Swagger (docs) | <http://localhost:8000/docs> |
| Healthcheck | <http://localhost:8000/health> |

As migrações do Alembic rodam automaticamente no boot do backend — o banco
fica pronto sem nenhum passo extra.

Para resetar tudo (apaga o volume do MySQL):

```bash
docker compose down -v
```

### Modo local (hot reload nos dois lados)

```bash
# Terminal 1 — backend
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
alembic upgrade head
uvicorn app.main:app --reload

# Terminal 2 — frontend
cd frontend
npm install
npm run dev
```

O Vite já está configurado para fazer proxy de `/api/v1` para
`http://localhost:8000`, então não há complicação com CORS no desenvolvimento.

### Atalhos via Makefile

```bash
make up          # docker compose up --build
make down        # docker compose down
make logs        # tail dos logs
make test        # roda pytest dentro do container do backend
make migrate     # aplica migrações pendentes
make clean       # down -v (apaga volume do MySQL)
```

---

## Documentação da API

A documentação interativa do Swagger UI fica em
<http://localhost:8000/docs> após subir o backend. Os endpoints são agrupados
em tags por domínio: `autenticação`, `usuários`, `gastos`, `parcelamentos`,
`financeiro`, `análise financeira`, `disciplina`, `planejamento` e `saúde`.

Para o esquema OpenAPI bruto: <http://localhost:8000/openapi.json>.

---

## Arquitetura

A aplicação segue uma separação clara em camadas no backend:

```
routes → services → repositories → models (SQLAlchemy)
        ↑
        schemas (Pydantic)
```

- **Routes** apenas validam entrada/saída e delegam.
- **Services** concentram regras de negócio (cálculos financeiros, análise
  de risco, regras do modo disciplina).
- **Repositories** isolam o acesso ao banco.
- **Schemas** garantem contratos estáveis na fronteira HTTP.

No frontend, cada domínio tem o próprio par `service` (HTTP) + `hook`
(React Query) + páginas/componentes. O estado de servidor fica no React Query;
apenas o estado de auth fica em uma store Zustand persistida.

Em produção, o nginx do container do frontend faz reverse-proxy de `/api/v1`
para o serviço `backend`, então o bundle usa URLs same-origin (sem CORS).

---

## Segurança

- Senhas armazenadas com hash **bcrypt**
- Tokens **JWT** com algoritmo e expiração configuráveis
- Validação obrigatória de **JWT_SECRET_KEY** forte em produção
- **Rate limit** por rota (slowapi), com limites diferenciados para auth/write
- Headers CORS validados (em produção `*` é rejeitado)
- Containers Docker **não-root** com builds multi-stage

---

## Testes

```bash
# Local
cd backend
pytest

# Dentro do container
docker compose exec backend pytest
```

Os testes usam SQLite em memória, então rodam rapidamente e não dependem do
MySQL estar de pé.

---

## Screenshots

> Substitua pelos prints reais em `docs/screenshots/`.

| | |
| --- | --- |
| ![Painel](docs/screenshots/painel.png) | ![Gastos](docs/screenshots/gastos.png) |
| Painel principal | Página de gastos |
| ![Parcelamentos](docs/screenshots/parcelamentos.png) | ![Posso comprar?](docs/screenshots/posso-comprar.png) |
| Lista de parcelamentos | Análise *"Posso comprar?"* |

---

## Próximas melhorias

- [ ] Testes de componente no frontend (Vitest + Testing Library)
- [ ] Pipeline de CI (GitHub Actions) com lint + testes + build
- [ ] Deploy automatizado (Fly.io ou Railway)
- [ ] Exportação de relatórios em PDF
- [ ] Notificações por e-mail quando o usuário atinge um limite
- [ ] Internacionalização (en/pt-BR)

---

## Licença

Projeto desenvolvido para fins de estudo e portfólio.
