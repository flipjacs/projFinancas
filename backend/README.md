# Financeiro — Backend

API em FastAPI para um sistema pessoal de planejamento financeiro. Tem cadastro/login com JWT,
CRUD de gastos e parcelamentos, resumo mensal de saldo e uma análise de risco que responde
*"posso comprar isso?"* com base no salário e nos compromissos atuais do usuário.

A arquitetura é em camadas (rotas → serviços → repositórios → modelos), com testes de unidade
para a regra de negócio. O frontend mora ao lado, em [`../frontend`](../frontend).

---

## Stack

- **Python 3.12+**
- **FastAPI** — framework HTTP com Swagger/OpenAPI automático
- **SQLAlchemy 2.0** — ORM no estilo tipado (`Mapped[...]`)
- **Alembic** — migrations
- **MySQL 8** — banco principal · **Redis 7** — cache opcional
- **Pydantic v2** + **pydantic-settings** — validação e config tipada
- **python-jose** + **bcrypt** — JWT + hash de senha
- **slowapi** — rate limit por IP
- **Pytest** + **httpx** — 111 testes, com SQLite em memória para velocidade
- **Docker** — build multi-stage, container não-root

---

## Como rodar (Docker)

A partir da raiz do repositório:

```bash
cp backend/.env.example backend/.env
docker compose up --build
```

- API: <http://localhost:8000/api/v1>
- Swagger: <http://localhost:8000/docs>
- Health: <http://localhost:8000/health>

Resetar tudo (apaga o banco):

```bash
docker compose down -v
```

---

## Como rodar local (sem Docker)

```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env       # edite DATABASE_URL se necessário
alembic upgrade head
uvicorn app.main:app --reload
```

A API sobe em <http://localhost:8000>.

---

## Estrutura

```
app/
├── auth/                Helpers de JWT, hash de senha, dependency de auth
├── core/                Config, logging
├── database/            Sessão SQLAlchemy, Base do ORM
├── middleware/          Logging de request, rate limit, handler global de erro
├── models/              Tabelas (SQLAlchemy 2 estilo Mapped)
├── repositories/        Acesso ao banco (uma classe por entidade)
├── schemas/             DTOs Pydantic (request/response)
├── services/            Regra de negócio
├── routes/              Endpoints HTTP — só orquestram services/schemas
├── utils/               Helpers genéricos
├── tests/               pytest, com fixtures de DB em memória
└── main.py              Cria a FastAPI, registra middlewares e routers
alembic/                 Migrations do banco
```

Camadas:

```
Request  ──►  Route  ──►  Service  ──►  Repository  ──►  Model  ──►  DB
                            │
                            └── valida regra de negócio, agrega cálculos
```

---

## Endpoints (resumo)

| Método | Rota | Para que serve |
| --- | --- | --- |
| `POST` | `/auth/register` | Cria um novo usuário |
| `POST` | `/auth/login` | Faz login e devolve JWT |
| `GET` `PATCH` `DELETE` | `/users/me` | Perfil do usuário logado |
| `GET` `POST` `PATCH` `DELETE` | `/expenses` | CRUD de gastos |
| `POST` | `/expenses/import-csv` | Importa lote de gastos em CSV |
| `GET` `POST` `PUT` `DELETE` | `/installments` | CRUD de parcelamentos |
| `GET` | `/balance` | Saldo do mês atual |
| `GET` | `/balance/monthly` | Resumo de um mês específico |
| `GET` | `/financial/month-summary` | Resumo agregado do mês |
| `GET` | `/financial/future-balance` | Projeção do saldo nos próximos meses |
| `POST` | `/financial-analysis/can-i-buy` | Análise *"posso comprar?"* |
| `GET` | `/discipline/*` | Modo Disciplina (limites, pontuação, sequência) |
| `GET` | `/health`, `/health/ready` | Liveness e readiness |

A doc completa fica em <http://localhost:8000/docs>.

> Observação: as URLs continuam em inglês mesmo com o app em português — o objetivo foi
> não quebrar a suíte de testes existente e seguir o costume de manter URLs simples
> e ASCII.

---

## Variáveis de ambiente

| variável | propósito | padrão |
| --- | --- | --- |
| `APP_NAME` | Nome que aparece no Swagger | `Financeiro` |
| `DEBUG` | Mostra detalhes de erro nas responses | `false` |
| `SECRET_KEY` | Chave HMAC do JWT (**obrigatório em produção**) | gerada |
| `JWT_EXPIRE_MINUTES` | Validade do token | `60` |
| `DATABASE_URL` | DSN do SQLAlchemy | MySQL local |
| `REDIS_URL` | DSN do Redis (cache, opcional) | desligado |
| `CORS_ORIGINS` | Origins permitidos, separados por vírgula | `*` |
| `RATE_LIMIT_DEFAULT` | Limite global por IP | `60/minute` |
| `RATE_LIMIT_AUTH` | Limite específico para `/auth/*` | `5/minute` |

Veja `.env.example` para a lista completa.

---

## Testes

```bash
pytest                  # roda toda a suíte (~111 testes)
pytest --cov=app        # com cobertura
pytest -k "expense"     # filtra por nome
```

Os testes usam SQLite em memória via fixture, então não dependem do MySQL nem do
Redis para rodar.

---

## Decisões de design

- **Camadas separadas.** Routes não acessam o banco direto — sempre passa por um service.
  Isso facilita teste de unidade e troca de implementação.
- **SQLAlchemy 2 tipado.** Uso o estilo novo `Mapped[X]` em vez do legado para ganhar
  autocomplete e tipos consistentes com Pydantic.
- **Erros normalizados.** Um middleware central transforma qualquer exceção em
  `{"error": {"message": "...", "details": [...]}}`, que o frontend já entende.
- **Rate limit por IP.** Usando `slowapi`, com limite mais agressivo no `/auth/*` para
  reduzir brute force.
- **JWT no header.** Sem refresh token nessa versão — token expira e o usuário loga de novo.
- **MySQL em produção, SQLite nos testes.** O SQLAlchemy abstrai a diferença e os testes
  rodam em milissegundos.

---

## Próximos passos

- [ ] Refresh token + rotação
- [ ] Endpoint de exportação (CSV/JSON) dos próprios dados
- [ ] Notificações por email quando o gasto extrapola o limite do Modo Disciplina
- [ ] Cobertura de testes nos services de financial-analysis
