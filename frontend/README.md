# Financeiro — Frontend

React + Vite + TypeScript SPA that talks to the FastAPI backend in this same repository. This phase ships the **foundation** only: authentication, layout system, theming, and the API integration layer. Domain pages (expenses, installments, financial planning, discipline mode) plug into this scaffold in later phases.

---

## Tech stack

- **React 18** + **TypeScript**
- **Vite 5** — dev server, HMR, production bundle
- **TailwindCSS 3** + **shadcn/ui** primitives
- **React Router 6** — client-side routing
- **Zustand** + **localStorage** — auth state with persistence
- **TanStack React Query** — server-state cache (configured, ready for the next phase)
- **Axios** — HTTP client with JWT and error interceptors
- **react-hook-form** + **zod** — form validation
- **lucide-react** — icons

---

## Quickstart

### Local dev (recommended)

The backend must be running on `http://localhost:8000`. From this directory:

```bash
cp .env.example .env       # optional — see env vars below
npm install
npm run dev
```

The dev server is at <http://localhost:5173> and proxies `/api/v1` and `/health` to the backend, so you don't need to deal with CORS in development.

### Docker

From the repo root:

```bash
docker compose up --build
```

That builds the multi-stage frontend image (Node 20 builder → nginx 1.27 runtime), serves the static bundle on <http://localhost:5173>, and reverse-proxies API requests to the `backend` service over the internal Compose network.

---

## Available scripts

| script | what it does |
| --- | --- |
| `npm run dev`         | Vite dev server with HMR |
| `npm run build`       | Type-check (`tsc -b`) and build the production bundle into `dist/` |
| `npm run preview`     | Serve the built bundle locally to sanity-check production output |
| `npm run lint`        | ESLint pass over `src/` |
| `npm run type-check`  | `tsc --noEmit` only |

---

## Architecture

```
src/
├── components/         Shared components (UI primitives + ProtectedRoute, ThemeToggle)
│   └── ui/             shadcn/ui primitives (button, input, label, card, dropdown-menu)
├── contexts/           React contexts (ThemeContext)
├── hooks/              Reusable hooks (useAuth)
├── layouts/            App + Auth shells (Sidebar, Navbar, AppLayout, AuthLayout, nav config)
├── lib/                Cross-cutting helpers (api.ts axios instance, utils.ts cn helper)
├── pages/              Route components (Login, Register, Dashboard, NotFound)
├── routes/             Router definition (AppRouter)
├── services/           Typed API clients (auth.service, user.service)
├── stores/             Zustand stores (authStore)
├── styles/             Global styles + Tailwind tokens
├── types/              Shared TypeScript types (api, auth, user)
├── utils/              Pure helpers (currency/percent formatters)
├── App.tsx             Top-level providers (QueryClient, ThemeProvider, BrowserRouter)
└── main.tsx            React root
```

### Data flow

```
Page  ──►  service (typed HTTP call)  ──►  axios instance (lib/api.ts)
                                              │
                                              ├─ request interceptor: injects Bearer token
                                              └─ response interceptor: normalizes errors,
                                                 clears auth on 401, throws ApiError
```

Routes are declared in `src/routes/AppRouter.tsx`:

- `<PublicOnlyRoute>` wraps `/login` and `/register` — sends authenticated users back to wherever they came from (or `/dashboard`).
- `<ProtectedRoute>` wraps everything inside `<AppLayout>` — renders a neutral loading state until the auth store has hydrated, then redirects unauthenticated users to `/login` and remembers their destination via `location.state.from`.

### Auth lifecycle

1. **Login/register** → `authService` posts to `/api/v1/auth/{login,register}` → token saved to `tokenStorage` (localStorage) and to the Zustand store.
2. **Bootstrap (on every reload)** → `useAuth` calls `userService.me()` to validate the persisted token. On success the user is hydrated; on any error the store is cleared.
3. **401 from any request** → axios response interceptor calls `tokenStorage.clear()` and notifies the store, which propagates to `<ProtectedRoute>` → redirect to `/login`.
4. **Logout** → store clears state and removes the token.

### Theming

`ThemeContext` exposes `theme` / `setTheme` / `toggleTheme`. The chosen theme is mirrored to the `dark` class on `<html>` and persisted to `localStorage`. A small inline script in `index.html` applies the persisted theme **before** React mounts, eliminating the dark-mode flash on reload.

### Styling

- shadcn/ui design tokens live in `src/styles/globals.css` — change the HSL variables to re-skin the app.
- Tailwind config in `tailwind.config.js` exposes those tokens as Tailwind colors (`bg-primary`, `text-muted-foreground`, etc.).
- All shadcn components are colocated under `src/components/ui/` and edit-friendly (no opaque black-box dependencies).

---

## Environment variables

| variable        | purpose | default |
| --------------- | --- | --- |
| `VITE_API_URL`  | When set, the bundle prefixes API calls with this origin (`${VITE_API_URL}/api/v1`). Leave empty to use **same-origin** `/api/v1` (recommended behind nginx/Compose). | unset |

Vars must be prefixed with `VITE_` to be exposed to the client bundle. They're embedded at build time, so changing them requires rebuilding.

---

## Integration with the backend

- All API calls go through `src/lib/api.ts`. There is **no mock data** in the project; every fetch hits the real FastAPI backend.
- The expected error shape mirrors the backend's `error_handler` middleware:
  ```json
  { "error": { "message": "...", "details": [...] } }
  ```
  The interceptor translates that into an `ApiError` with `.message`, `.status`, and `.details`, ready for `instanceof ApiError` checks at the call site.
- Endpoints used so far:
  - `POST /api/v1/auth/register`
  - `POST /api/v1/auth/login`
  - `GET /api/v1/users/me`
  - `PATCH /api/v1/users/me` (typed but not yet wired to a page)

---

## Adding a new page

1. Create `src/pages/MyPage.tsx`.
2. Register the route inside `<AppRouter>` (under `<ProtectedRoute>` if it should require auth).
3. Add an entry to `src/layouts/nav.ts` so the sidebar shows it (drop `disabled: true` once you're done).
4. If the page calls a new endpoint, add a typed function to `src/services/<resource>.service.ts` and consume it via React Query inside the page.

---

## Roadmap (next phases)

- Expenses page (CRUD + CSV import via existing backend endpoint)
- Installments tracking page
- Financial planning views (month summary, future balance projection)
- Purchase analysis ("Can I buy?") form
- Discipline Mode dashboard
- Component-level tests (Vitest + Testing Library)
