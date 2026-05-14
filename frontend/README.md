# Financeiro — Frontend

SPA em React 18 + Vite + TypeScript que conversa com o backend em FastAPI do mesmo repositório.
Foi pensado como um pequeno *dashboard* de finanças pessoais: registra gastos, parcelamentos
e roda a análise *"posso comprar isso?"* contra a API.

```
Login ──►  /painel  →  /gastos ─ /parcelamentos ─ /posso-comprar ─ /configuracoes
                       ▲ AppLayout compartilhado · Suspense · ErrorBoundary
```

---

## Stack e o porquê de cada escolha

| Camada | Escolha | Motivo |
| --- | --- | --- |
| UI | **React 18** + **TypeScript** | Tipagem estrita; tipos batem com o schema do backend. |
| Build | **Vite 5** | HMR rápido; build de produção com chunking manual (charts/forms/Radix). |
| Estilo | **TailwindCSS 3** + componentes estilo shadcn | Design tokens centralizados em `src/components/ui/`. |
| Rotas | **React Router 6** + **React.lazy** | Code-splitting por rota; guards de auth. |
| Auth state | **Zustand** (persistente) | Store leve, casa bem com o interceptor do axios. |
| Server state | **TanStack React Query** | Cache, invalidação automática; a barra de progresso usa `useIsFetching()`. |
| Formulários | **react-hook-form** + **zod** | Validação por schema. |
| HTTP | **axios** + interceptors | Injeção de JWT, `ApiError` normalizado, handler global de 401. |
| Gráficos | **recharts** | Carregado sob demanda — só baixa nas páginas que usam. |
| Ícones | **lucide-react** | Tree-shakeable. |
| Toasts | **sonner** | API simples e respeita o tema. |

---

## Como rodar

### Local

O backend precisa estar rodando em `http://localhost:8000`. A partir desta pasta:

```bash
cp .env.example .env       # opcional — ver variáveis abaixo
npm install
npm run dev
```

A app sobe em <http://localhost:5173> e faz proxy de `/api/v1` + `/health` para o backend
— assim, em desenvolvimento, você não lida com CORS.

### Docker (stack completa)

A partir da raiz do repositório:

```bash
docker compose up --build
```

Build multi-stage (Node 20 → nginx 1.27). O mesmo nginx serve a SPA na porta 5173 e faz
reverse-proxy de `/api/v1` para o serviço `backend` pela rede do Compose, então o bundle
usa same-origin tanto em dev quanto em produção.

Depois de alterar código:

```bash
docker compose build frontend && docker compose up -d frontend
```

---

## Scripts

| script | o que faz |
| --- | --- |
| `npm run dev`         | Servidor de desenvolvimento com HMR + proxy da API |
| `npm run build`       | Type-check (`tsc -b`) e gera o bundle em `dist/` |
| `npm run preview`     | Serve o bundle de produção pra testar local |
| `npm run lint`        | ESLint em `src/` |
| `npm run type-check`  | Só `tsc --noEmit` |

---

## Estrutura

```
src/
├── components/              UI compartilhada (StatCard, ChartCard, EmptyState, RiskBadge,
│   │                        ErrorBoundary, TopProgress, PageFallback, QuickNavDialog,
│   │                        ShortcutsDialog, QueryErrorState, ProtectedRoute, …)
│   ├── ui/                  Primitivas no estilo shadcn (Button, Card, Dialog, Progress, …)
│   ├── charts/              Wrappers do Recharts (lazy junto com as páginas)
│   ├── expenses/            Componentes da página /gastos
│   ├── installments/        Componentes da página /parcelamentos
│   └── financial/           Componentes da página /posso-comprar
├── contexts/                Contextos React (ThemeContext)
├── hooks/                   useAuth, useBalance, useExpenses, useInstallments, useFinancial,
│                            useUser, useShortcuts
├── layouts/                 AppLayout, AuthLayout, Sidebar, Navbar, config de navegação
├── lib/                     api.ts (instância do axios, ApiError, handler de 401), utils.ts
├── pages/                   Componentes de rota (todos lazy, exceto Login/Register)
├── routes/                  AppRouter (React.lazy + Suspense)
├── services/                Clientes tipados da API (auth, user, balance, expense,
│                            installment, financial)
├── stores/                  Stores Zustand (authStore com persistência em localStorage)
├── styles/                  globals.css + tokens do Tailwind
├── types/                   Tipos compartilhados (api, auth, user, expense, balance,
│                            installment, financial)
├── utils/                   formatCurrency / formatPercentage (pt-BR + BRL)
├── App.tsx                  Providers + GlobalChrome (barra de progresso, atalhos)
└── main.tsx                 Entry point do React
```

### Fluxo de dados

```
Página  ──►  hook (useQuery / useMutation)  ──►  service (chamada tipada)  ──►  axios
                       │                                                          │
                       ▼                                                          ▼
        Cache do React Query (invalidações                request: injeta o JWT
        propagam entre páginas — ex: criar                response: vira ApiError;
        parcelamento atualiza /financial)                 401 → limpa store, vai pra /login
```

### Performance

- **Lazy loading por rota.** `AppRouter` faz `React.lazy()` em todas as páginas internas;
  o Suspense em `AppLayout` mostra um skeleton (`PageFallback`) enquanto carrega.
- **Chunking manual** em `vite.config.ts` separa libs pesadas (`react`, `query`, `forms`,
  `radix`, `charts`, `icons`). A tela de login não baixa nada de `charts`.
- **Cache de assets longo.** O nginx serve `/assets/*` com `Cache-Control: public, immutable`
  e 1 ano de expiração. `index.html` fica sem cache para que deploys apareçam na hora.
- **Gzip no edge.** O nginx comprime JS/CSS/SVG/JSON.

### UX e acessibilidade

| Concern | Implementação |
| --- | --- |
| Indicador de carregamento | `<TopProgress />` lê `useIsFetching()` + `useIsMutating()` e mostra uma barra fina animada. |
| Erros de render | `<ErrorBoundary />` envolve a shell e o slot da página; em dev mostra o erro, em prod mostra card neutro. |
| Erros do servidor | Interceptor do axios → `ApiError` → `toast.error(message)`. Reads do React Query podem usar `<QueryErrorState />` inline com botão de retry. |
| Loading | Skeletons em todas as listas/gráficos; `<PageFallback />` em transições de rota. |
| Empty states | `<EmptyState />` em qualquer lista que possa estar vazia. |
| Temas | `ThemeContext` (claro/escuro) reflete no `html.dark` e persiste em `localStorage`. Um script inline no `index.html` aplica o tema **antes** do React montar (evita FOUC). |
| A11y | Skip-to-content no `AppLayout`, ring de foco visível, `aria-busy` no fallback, `role="alert"` em erros, `aria-pressed` em toggles, landmarks semânticos, ícones com label. |
| Atalhos | Hook `useShortcuts()` + diálogo `?`. `⌘K` busca rápida, `⌘/` alterna tema, `g d/g/p/c/s` para navegar. |

### Rotas e auth

- `<PublicOnlyRoute>` cobre `/login` e `/cadastro` — usuário logado vai pro destino original (ou `/painel`).
- `<ProtectedRoute>` cobre tudo dentro de `<AppLayout>` — espera o store hidratar antes de
  decidir, e redireciona quem não está autenticado para `/login` salvando o destino em
  `location.state.from`.

Ciclo do auth:

1. **Login/cadastro** → `authService` → token salvo em `tokenStorage` (localStorage) + Zustand.
2. **Boot** → `useAuth` chama `userService.me()` pra validar o token persistido. Em qualquer erro,
   limpa o store.
3. **401 em qualquer request** → interceptor do axios limpa o token, store propaga, e o usuário
   é mandado pra `/login`.
4. **Logout** → store limpa estado, token apagado.

### Estilização

- Tokens de design em `src/styles/globals.css` (variáveis HSL). Pra mudar a paleta, edita lá.
- Tailwind expõe esses tokens como cores (`bg-primary`, `text-muted-foreground`, …).
- Keyframes customizados (`fade-in`, `scale-in`, `slide-up`, `pulse-ring`, `progress-grow`)
  ficam em `tailwind.config.js`.

---

## Variáveis de ambiente

| variável        | propósito | padrão |
| --------------- | --- | --- |
| `VITE_API_URL`  | Se setado, o bundle prefixa as chamadas com este origin (`${VITE_API_URL}/api/v1`). Deixe vazio para usar **same-origin** `/api/v1` (recomendado por trás do nginx). | vazio |

Variáveis precisam ter o prefixo `VITE_` para serem expostas ao bundle. Elas são embutidas
em build time, então mudar exige rebuild.

---

## Integração com o backend

- Todas as chamadas passam por `src/lib/api.ts`. Não tem mock de dado nenhum no projeto;
  toda chamada vai pro backend real.
- O formato de erro segue o middleware `error_handler` do backend:
  ```json
  { "error": { "message": "...", "details": [...] } }
  ```
  O interceptor transforma isso em `ApiError` com `.message`, `.status` e `.details`,
  prontos pra `instanceof ApiError` no call site.
- Endpoints consumidos hoje:
  - `POST /auth/{register,login}`
  - `GET/PATCH /users/me`
  - `GET /balance`, `GET /balance/monthly`
  - `GET/POST/PATCH/DELETE /expenses`
  - `GET/POST/PUT/DELETE /installments`
  - `GET /financial/month-summary`, `GET /financial/future-balance`
  - `POST /financial-analysis/can-i-buy`

> Observação: as URLs da API ficaram em inglês de propósito para preservar os testes do
> backend. As **rotas do browser** (o que aparece na barra de endereço) estão em português
> (`/painel`, `/gastos`, etc.).

---

## Adicionando uma página nova

1. Crie `src/pages/MinhaPage.tsx`.
2. Adicione um `React.lazy(() => import(...))` em `src/routes/AppRouter.tsx` e a linha da `<Route>`.
3. Coloque uma entrada em `src/layouts/nav.ts` para aparecer na sidebar.
4. Se for chamar um endpoint novo, adiciona a função tipada em `src/services/<recurso>.service.ts`
   e consome via hook do React Query em `src/hooks/`.

Suspense e ErrorBoundary já são globais, então chunk lazy e erro de render são tratados
automaticamente.

---

## Build de produção

`npm run build` gera o `dist/`. Com lazy loading + chunking manual:

| chunk | papel | gzipado |
| --- | --- | --- |
| `react` | react / react-dom / router | ~54 KB |
| `index` | shell + páginas de auth | ~44 KB |
| `radix` | dialog/dropdown/select | ~34 KB |
| `forms` | react-hook-form + zod | ~22 KB |
| `query` | tanstack/zustand | ~14 KB |
| `charts` | recharts (lazy no painel/parcelamentos/posso-comprar) | ~119 KB |
| por página | cada rota | 2–6 KB |

A tela de login baixa ~165 KB gzipado — **sem nenhum gráfico**.
