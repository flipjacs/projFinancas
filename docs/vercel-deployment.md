# Deploy React/Vite + FastAPI + MySQL externo na Vercel

## Revisão realizada antes das alterações

O repositório tem `frontend/` (React 18, Vite 5, TypeScript, React Router, Axios) e `backend/` (FastAPI, SQLAlchemy, PyMySQL, Alembic). O frontend gera `frontend/dist`. A aplicação ASGI já é exportada em `backend/app/main.py` como `app`; os imports partem de `app`, portanto a raiz do serviço Python deve ser `backend`.

Docker Compose inicia MySQL, Redis, Uvicorn e Nginx. Suas portas e nomes de serviço são locais. Dockerfiles continuam disponíveis para esse fluxo; a Vercel usa os presets nativos Vite e FastAPI, sem executar Compose, Nginx ou o CMD do Dockerfile. Não existe worker persistente obrigatório. O BackgroundTasks da importação CSV apenas registra um evento de auditoria; gravações são concluídas antes da resposta. Esse log não constitui uma fila durável.

A única fonte de conexão SQLAlchemy é `DATABASE_URL`. As variáveis MYSQL_* são usadas exclusivamente pelo container MySQL local, não pelo backend. Foram encontrados valores de exemplo de senha em configurações versionadas; removidos dos defaults e substituídos por placeholders nos exemplos. Os arquivos `.env` reais estão ignorados; não foi encontrado histórico de versionamento dos três caminhos `.env` examinados. Isso não comprova ausência de segredos em todo o histórico Git. A senha mostrada no print deve ser revogada/rotacionada no provedor antes do deploy; não foi reutilizada nem alterada no banco local.

## Arquitetura escolhida

Um projeto Vercel, Root Directory na **raiz do repositório**, com dois Services. Services está em **beta**, disponível em todos os planos segundo a documentação consultada em 26/09/2026. Use a CLI atual se escolher o fluxo CLI. Não use `experimentalServices` nem configurações legadas `builds`.

- `frontend`: root `frontend`, preset Vite, `npm ci`, `npm run build`, output `dist`.
- `backend`: root `backend`, preset FastAPI, entrypoint `app.main:app`, Python 3.12.
- `/api/*`, `/health`, `/health/*`, `/docs`, `/docs/*`, `/redoc`, `/openapi.json` → backend, preservando o caminho original.
- Demais caminhos → frontend; fallback interno `/index.html` mantém deep links do React Router.
- Axios usa `/api/v1` no mesmo domínio. `VITE_API_URL` não precisa ser criada.

O import da aplicação não executa migrations nem abre conexão MySQL. Na Vercel, SQLAlchemy usa NullPool para não reter um pool por instância. Sessões fecham após cada request. Isso não elimina o limite global de conexões: dimensione concorrência e banco juntos. Timeout de conexão padrão: 10 segundos. TLS pode verificar certificado e hostname usando a CA pública do sistema ou PEM fornecido pelo provedor.

Cache em memória é uma otimização descartável e pode variar entre instâncias. Para rate limiting global consistente, configure um Redis externo via `REDIS_URL` (compartilhado com cache) ou `RATE_LIMIT_STORAGE_URI` (somente limites). Sem Redis, o limite existente funciona por instância, não como proteção global. Não cadastre `redis://redis:6379/0` na Vercel. Erros Redis podem causar falha de requests de rate limiting; monitore o provedor. Não há Redis local no deploy Vercel.

## Variáveis: Vercel → Project → Settings → Environment Variables

Use valores distintos de banco/chave para Preview, sem apontar previews de branches para os dados reais de Production. Todas as variáveis abaixo, exceto VITE_API_URL, são privadas de servidor. Não prefixe segredos com VITE_. Não crie manualmente VERCEL: é variável de sistema; mantenha a exposição de System Environment Variables habilitada.

| Nome | Production | Preview | Development |
| --- | --- | --- | --- |
| `APP_ENV` | `production` | `production` (ativa a mesma validação) | `development` |
| `DEBUG` | `false` | `false` | `false` |
| `DATABASE_URL` | URL real do banco de produção | URL real de banco de teste separado | URL real acessível pela máquina dev |
| `JWT_SECRET_KEY` | chave aleatória exclusiva, >=32 caracteres | outra chave aleatória exclusiva | chave dev, sem reutilizar produção |
| `CORS_ORIGINS` | vazio para mesmo domínio | vazio para mesmo domínio | `http://localhost:5173,http://127.0.0.1:5173` |
| `DATABASE_SSL` | `true` para MySQL externo com TLS | `true` | `false` para MySQL local, `true` se externo |
| `DATABASE_SSL_CA` | opcional: PEM da CA privada do provedor | opcional: PEM do banco preview | opcional: PEM se exigido |
| `REDIS_URL` | recomendado: URL TCP Redis externo `rediss://...` | recomendado: instância/DB separado | opcional: Redis local |
| `RATE_LIMIT_STORAGE_URI` | opcional: Redis específico dos limites; se ausente usa REDIS_URL | opcional: Redis de preview | opcional |

Obrigatórias para este fluxo: APP_ENV, DEBUG, DATABASE_URL, JWT_SECRET_KEY e DATABASE_SSL. CORS_ORIGINS deve ser configurada vazia explicitamente para usar somente requests same-origin; o código aceita lista vazia. Caso o painel não aceite vazio, use a origem HTTPS exata do frontend (sem caminho/barra final). Previews same-origin não precisam de lista aberta `*.vercel.app`, nem regex aceitando todos os tenants. Se escolher origens externas, informe lista separada por vírgulas de domínios exatos autorizados; nunca `*` em produção.

Defaults opcionais já no código, crie somente se quiser alterá-los, nos ambientes correspondentes: `APP_NAME=Financeiro`, `LOG_LEVEL=INFO`, `DATABASE_CONNECT_TIMEOUT=10`, `JWT_ALGORITHM=HS256`, `JWT_EXPIRE_MINUTES=60`, `RATE_LIMIT_ENABLED=true`, `RATE_LIMIT_DEFAULT=120/minute`, `RATE_LIMIT_AUTH=10/minute`, `RATE_LIMIT_WRITE=60/minute`, `TRUST_FORWARDED_FOR=false`, `CACHE_DEFAULT_TTL_SECONDS=60`, `CSV_IMPORT_MAX_ROWS=5000`, `CSV_IMPORT_MAX_BYTES=2097152`. Não habilite TRUST_FORWARDED_FOR indiscriminadamente; só confie em headers escritos por proxy controlado.

`VITE_API_URL`: **não criar** em Production/Preview/Development para este deploy. Se optar por API em outro domínio, valor público `https://<API_HOST>` sem `/api/v1`, configure CORS para o domínio frontend e refaça o build. `API_PROXY_TARGET` é somente dev local Vite, padrão `http://localhost:8000`; não é necessário na Vercel. MYSQL_HOST, MYSQL_PORT, MYSQL_USER, MYSQL_PASSWORD, MYSQL_DATABASE e MYSQL_ROOT_PASSWORD, FRONTEND_BIND/PORT e BACKEND_PORT não são necessários na Vercel.

## MySQL externo e exemplos de ambiente

Modelo (não é credencial válida):

```dotenv
APP_ENV=production
DEBUG=false
DATABASE_URL=mysql+pymysql://<USER>:<PASSWORD>@<HOST>:3306/<DATABASE>
DATABASE_SSL=true
# DATABASE_SSL_CA=<PEM da CA, se necessário>
JWT_SECRET_KEY=<CHAVE_ALEATORIA_EXCLUSIVA>
CORS_ORIGINS=
```

Use host/porta reais do provedor, usuário dedicado e permissões apropriadas. Nunca `root` do Docker, `mysql`, `localhost`, `127.0.0.1` ou porta publicada 3307 por hábito. Caracteres reservados em usuário/senha (`@`, `:`, `/`, `#`, `%`, etc.) devem receber URL encoding. Não desative verificação SSL; para CA privada, cadastre o **conteúdo PEM completo com quebras de linha** em DATABASE_SSL_CA, não caminho de arquivo da sua máquina. Vercel não hospeda o MySQL. O banco precisa aceitar conexões da infraestrutura Vercel; se exige IP fixo, configure uma solução de egress apropriada com o provedor/Vercel, não apenas o IP da sua casa.

Os `.env.example` raiz/backend/frontend foram atualizados. O exemplo raiz é para Compose e mantém o hostname local `mysql` claramente identificado; para cloud use este modelo e os comentários Vercel. Não envie `.env` ao GitHub nem importe o `.env` local inteiro no painel Vercel.

## Testar localmente

Compose existente (preencha placeholders antes de usar um novo .env; não sobrescreva seu .env atual):

```sh
docker compose config --quiet
docker compose up -d --build --wait
curl -f http://localhost:5173/health
curl -f http://localhost:5173/health/ready
```

Frontend:

```sh
cd frontend
npm ci
npm run lint
npm run type-check
npm test
npm run build
npm run dev
```

`npm run preview` serve apenas o frontend compilado; não fornece o proxy FastAPI. Use Vite dev, Compose ou Vercel dev para teste integrado. Node 22.x funciona para os testes que usam strip-types.

Backend direto, em outro terminal (Python 3.12):

```sh
cd backend
python3.12 -m venv .venv
.venv/bin/pip install -r requirements.txt
cp .env.example .env
# Edite .env com URL real de desenvolvimento e chave exclusiva.
.venv/bin/alembic upgrade head
.venv/bin/uvicorn app.main:app --reload --port 8000
```

Testes isolados, sem credenciais reais:

```sh
cd backend
APP_ENV=test DATABASE_URL=sqlite:// JWT_SECRET_KEY=test-key .venv/bin/python -m pytest -q
```

## Passos exatos de deploy pelo GitHub

1. Rotacione a senha exposta no provedor. Crie o MySQL externo, banco e usuário dedicados, configure rede e TLS, e um banco separado para Preview. Providencie Redis externo se precisar de limites globais.
2. Configure um arquivo privado `backend/.env.production` com os valores reais acima (ignorados pelo Git). Faça backup de qualquer banco existente. Para inicializar/atualizar schema, em `backend/`, carregue o arquivo sem imprimir valores:
   ```sh
   set -a
   . ./.env.production
   set +a
   .venv/bin/alembic upgrade head
   .venv/bin/alembic current
   ```
   O arquivo deve usar sintaxe compatível com shell; coloque valores com espaços/PEM entre aspas. Repita separadamente para o banco Preview. Não execute migrations concorrentes em cada cold start/build e não reutilize banco de produção nos testes.
3. Revise `git diff` e `git status`. Versione os arquivos de configuração/código/documentação; não versionar env reais, .vercel, node_modules ou certificados privados. Envie a branch para GitHub pelo seu fluxo habitual.
4. Vercel → Add New → Project → Import o repositório GitHub. **Root Directory: raiz (`.`), nunca `frontend` nem `backend`.** Não sobrescreva comandos globais de build/output; esses campos pertencem aos Services em vercel.json. Confira os dois serviços detectados. Use Node 22.x para o frontend; Python está fixado em backend/.python-version como 3.12.
5. Cadastre as variáveis da tabela, com valores próprios por ambiente, antes de Deploy. Mantenha System Environment Variables disponíveis. Não copie placeholders literalmente.
6. Deploy. Nos Build Logs, confirme instalação frontend via npm ci, build dist e serviço FastAPI/Python 3.12. Abra o endereço gerado. Configure seu domínio em Settings → Domains, se desejado.
7. Faça as verificações abaixo primeiro no Preview. Após conferir o schema/banco Production, publique pela branch de produção configurada. Ao mudar variáveis, faça Redeploy: o bundle Vite só muda com novo build.

Opcional CLI atual (requer login e vínculo ao projeto; não executado nesta revisão):

```sh
npx vercel@latest login
npx vercel@latest link
npx vercel@latest pull --environment=preview
npx vercel@latest build
npx vercel@latest deploy
# Após validar e preparar o banco Production:
npx vercel@latest --prod
```

## Verificar comunicação

Substitua `<DOMINIO>` pelo domínio real. Deployment Protection pode exigir autenticação no Preview; curl não autenticado pode receber 401/403 da plataforma.

```sh
curl -i https://<DOMINIO>/health
curl -i https://<DOMINIO>/health/ready
curl -i https://<DOMINIO>/api/v1/expenses
curl -i https://<DOMINIO>/painel
curl -i https://<DOMINIO>/openapi.json
```

- `/health`: 200 `{"status":"ok"}` comprova inicialização FastAPI.
- `/health/ready`: 200 com `components.database.status=ok` comprova SELECT 1 no MySQL. 503 informa falha de conexão sem expor detalhes privados. Não comprova migrations: confira Alembic e um endpoint autenticado.
- `/api/v1/expenses` sem token: 401 JSON comprova roteamento para backend, sem exigir criar/alterar dados.
- `/painel` direto: HTML do React, inclusive após atualizar navegador; arquivos `/assets/...` devem continuar JS/CSS, não HTML.
- Faça login e abra DevTools → Network: requests para `https://<DOMINIO>/api/v1/...`, Authorization Bearer, resposta JSON. Nunca localhost. Confira login, listagem de gastos e dashboard em ambos os ambientes. Para CORS externo autorizado, teste OPTIONS com Origin exata e Access-Control-Request-Method: POST; uma origem não autorizada não deve receber allow-origin.

## Diagnóstico

| Sintoma | Verificação |
| --- | --- |
| Schema rejeita `services` | Use projeto/CLI atuais; recurso beta. Compare com documentação atual de Services. Não aplique builds legados junto. |
| Build não encontra package.json/FastAPI | Root Directory precisa ser raiz; service roots frontend/backend; entrypoint app.main:app. |
| ModuleNotFoundError: app | Backend iniciado fora de backend; não mudar imports para mascarar raiz incorreta. |
| Erro pydantic-core/compilação | Confira Python 3.12 nos logs, requirements e wheel da arquitetura. Não fazer downgrade aleatório. |
| FUNCTION_INVOCATION_FAILED/500 | Runtime Logs do serviço backend: variável ausente, validação de JWT/CORS/DATABASE_URL, pacote/import, Redis. Não publique logs contendo segredos. |
| 404/HTML na API | Confira ordem de rewrites, prefixo /api/v1, service backend, VITE_API_URL vazia. |
| 404 ao atualizar /painel | Fallback SPA precisa ficar no serviço frontend; API não deve usar esse fallback. |
| JS com MIME text/html | Asset inexistente ou rewrite incorreto; confira dist e URLs de chunks do build atual. |
| 503 no readiness | URL/encoding, host/porta externos, permissões, firewall/egress, TLS/CA/hostname, banco existente. Consulte logs do provedor sem expor URL completa. |
| Access denied / unknown database | Usuário/senha rotacionados e schema corretos; não assumir que Compose criou o banco remoto. |
| Table doesn't exist | Execute Alembic upgrade head no banco correto; SELECT 1 não valida tabelas. |
| Too many connections/timeouts | Limites MySQL/concorrência/região; NullPool evita retenção mas requests paralelos ainda abrem conexões. |
| Erro de certificado | DATABASE_SSL_CA precisa do PEM real; CA pública usa trust store; hostname deve coincidir com certificado. |
| CORS / preflight | Same-origin dispensa allowlist aberta. Em domínios distintos, origem exata sem caminho; nunca wildcard com credenciais. |
| 401 após deploy | Chave JWT mudou, token expirou ou Preview tem outra chave; faça login novamente. |
| 429 ou limites inconsistentes | Redis externo compartilhado para limites globais; defaults em memória são por instância. |
| Upload muito grande / timeout | Limites de payload/execução Vercel e CSV 2 MB; não tratar serverless como worker ilimitado. |

## Arquivos alterados nesta tarefa

- `vercel.json` (novo): Services, comandos de build, entrypoint, rotas e headers de segurança.
- `backend/.python-version` (novo): Python 3.12, igual ao Docker atual.
- `.gitignore`, `.vercelignore` (novo): proteção de env/artefatos; permite versionar o pin Python.
- `.env.example`, `backend/.env.example`, `frontend/.env.example`: placeholders privados, TLS, CORS e API relativa.
- `docker-compose.yml`: senha root e DATABASE_URL exigidas via env, sem fallback de credenciais; usuário adicional MySQL é opcional.
- `backend/app/core/config.py`: DATABASE_URL obrigatória, opções TLS/timeout, validação de host Vercel e storage de limites.
- `backend/app/database/connection.py` (novo): opções MySQL/TLS reutilizadas pela API e migrations.
- `backend/app/database/session.py`: NullPool na Vercel e connect_args compartilhados.
- `backend/alembic/env.py`: migrations usam as mesmas opções TLS.
- `backend/app/middleware/rate_limit.py`: permite storage Redis compartilhado, mantendo memória se não configurado.
- `backend/app/utils/cache.py`: timeouts Redis para evitar cold start bloqueado indefinidamente.
- `backend/app/routes/health.py`: falha de banco retorna diagnóstico público sanitizado.
- `frontend/src/lib/api.ts`: normaliza barra final da URL externa opcional.
- `frontend/vite.config.ts`: proxy dev usa API_PROXY_TARGET separado da URL pública.
- `backend/app/tests/test_deployment.py` (novo): host cloud, CORS same-origin, TLS e sanitização readiness.
- `README.md`: link para este guia.
- `docs/vercel-deployment.md` (novo): revisão, configuração, operação e diagnósticos.

Nenhum layout/regra financeira foi alterado. requirements.txt já contém as dependências usadas; mantidas as versões. O deploy remoto e a conexão com o MySQL externo ainda dependem de credenciais/projeto do usuário; não foram realizados nesta revisão.

## Referências oficiais

- https://vercel.com/docs/services
- https://vercel.com/docs/services/config-reference
- https://vercel.com/docs/services/routing
- https://vercel.com/docs/frameworks/backend/fastapi
- https://vercel.com/docs/functions/runtimes/python
- https://vercel.com/docs/frameworks/frontend/vite

## Verificações executadas nesta revisão

- 172 testes backend passaram; após o ajuste final de CORS, 18 testes de segurança/deploy passaram novamente.
- Build TypeScript/Vite, lint e 2 arquivos de testes frontend passaram.
- vercel.json validado contra o schema oficial baixado da Vercel; diff sem erros de whitespace.
- Import ASGI em modo Vercel validou NullPool, /health 200, API privada 401, OpenAPI 200 e rejeição CORS de origem externa, sem conexão remota.
- Compose validado sem recriar containers; os quatro serviços locais estavam saudáveis.
- Nenhum valor privado do .env atual foi encontrado nos arquivos rastreados atuais ou no bundle frontend; env reais não rastreados, .env.production/.vercel/caches ignorados.
- Varredura final dos padrões solicitados: localhost/127.0.0.1 permanecem apenas em desenvolvimento, Compose/health checks, exemplos e testes/validação que rejeita esses hosts na Vercel. mysql:3306 permanece apenas no exemplo Docker. Não há URL local de API nem credencial privada no bundle de produção. DATABASE_URL vem do ambiente; VITE_API_URL é pública/opcional; allow_origins recebe a lista configurada.
- Não foi executado build/deploy na infraestrutura Vercel nem ping no MySQL externo: faltam projeto/vínculo e credenciais reais do provedor. Validação de schema e ASGI local não substitui essa etapa.
