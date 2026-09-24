# RepoSweep

Find, review, and clean up stale GitHub repositories — safely.

RepoSweep is a full-stack web app for auditing your GitHub repositories and
performing bulk **archive** and **delete** operations with guardrails: protected
repos are excluded server-side, destructive deletes require typing `DELETE`, and
every operation is recorded in an activity log.

- **Demo mode** — zero GitHub credentials required. Ships with 47 realistic mock
  repositories so you can try the entire flow immediately.
- **Live mode** — connect your real GitHub account via OAuth when you're ready.

---

## Features

- **Dashboard** with at-a-glance stats: totals, activity buckets, size, language split.
- **Repository browser** — search, filters, sorting, and multi-select across **47 mock**
  (or your real) repositories.
- **Bulk archive / delete** with live per-repo progress, staged result reveal, and
  retry-failed. Deleting requires typing the literal phrase `DELETE` as confirmation.
- **Protected repositories** — mark repos untouchable; the backend refuses to
  archive or delete them in bulk operations, even from a hand-crafted request.
- **Activity log** — every protect/unprotect/archive/delete logged with per-repo results.
- **Settings** — light/dark/system theme, protect-by-default toggle.
- Responsive layout (sidebar → offcanvas on mobile), keyboard-friendly, dark-theme
  aware, accessible-by-construction.
- GitHub **OAuth** sign-in (scopes: `repo delete_repo read:user`) with server-side
  session + CSRF protection and rate limiting.

## Tech stack

| Layer     | Choice                                                        |
| --------- | ------------------------------------------------------------- |
| Frontend  | React 19, Vite 6, React Router 7, TanStack Query, Bootstrap 5 (CSS only) + custom CSS, Bootstrap Icons |
| Backend   | Python 3.13, Flask 3, PyMongo 4, Flask-Limiter, Waitress (local prod) |
| Database  | MongoDB (Atlas M0 free in production) — `memory://` mongomock for zero-setup demo |
| Security  | HttpOnly SameSite session cookie, per-session CSRF token header, idle + absolute session timeouts, server-side bulk-op validation |
| Hosting   | Vercel (static SPA + Python `/api` function, free tier) |

---

## Quick start (demo mode)

Prerequisites: **Node 20+** and **Python 3.11+**. No database needed — demo mode
runs on an in-memory mongomock store (`MONGODB_URI=memory://`).

```bash
# 1. Backend
cd backend
python -m venv .venv
.venv\Scripts\activate                # Windows:  .venv\Scripts\activate
pip install -r requirements.txt
python run.py                         # http://localhost:5000

# 2. Frontend (new terminal)
cd frontend
npm install
npm run dev                           # http://localhost:5173
```

Open **http://localhost:5173** → **Try the live demo** → no login prompt, no tokens.

### Database

Demo mode needs no database at all. To use a real MongoDB (local install or a
MongoDB Atlas free cluster), set `MONGODB_URI` and `MONGODB_DB` in `backend/.env`
(see `.env.example`). Indexes are created automatically on startup, or run:

```bash
cd backend
python -c "from app import create_app; create_app()"   # connects + builds indexes
```

`scripts/smoke_test.py` exercises the whole API against an in-memory database:

```bash
cd backend
python ..\scripts\smoke_test.py
```

---

## Enabling live GitHub mode

1. Create an OAuth App at https://github.com/settings/developers
   - Homepage URL: `http://localhost:5173`
   - Authorization callback URL: `http://localhost:5000/api/auth/github/callback`
2. Fill in `backend/.env`:

   ```env
   GITHUB_CLIENT_ID=your_client_id
   GITHUB_CLIENT_SECRET=your_client_secret
   # MOCK_MODE=false   # demo login auto-disabled once credentials are set
   ```

3. Restart the backend. The landing page switches to **"Sign in with GitHub"**.
   Demo mode is automatically disabled when OAuth credentials exist (or force it
   with `MOCK_MODE=true`).

Requests to GitHub use scopes `repo delete_repo read:user`. Your access token is
stored server-side only and never exposed to the frontend.

---

## Running in production

The backend ships with a WSGI entry point (`backend/wsgi.py`) so it can run under a
production server. On Windows the recommended option is **Waitress** (bundled):

```bash
cd backend
set FLASK_ENV=production
python -m waitress --listen=0.0.0.0:5000 wsgi:app
```

With `FLASK_ENV=production` (`ProductionConfig`), the session cookie is marked
`Secure`, so serve the backend over HTTPS (directly via a TLS terminator, or
behind a reverse proxy like nginx):

```nginx
location /api/ {
    proxy_pass http://127.0.0.1:5000;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

The frontend is a static Vite build (`npm run build` → `frontend/dist/`) — serve it
with any static server/nginx and proxy `/api/` to the backend above.

### Production environment notes

- Set a strong, stable `SECRET_KEY` in `backend/.env` (the setup script generates one).
- Rate limits default to single-process in-memory storage. For multi-worker or
  containerized deploys set a shared backend:

  ```env
  RATELIMIT_STORAGE_URI=redis://localhost:6379
  ```

- In production, `session_cookie_secure=true` and `SESSION_COOKIE_SAMESITE=Lax`
  apply automatically via `FLASK_ENV=production`.
- Static files (`dist/`, `/*.woff`) should be served by the web server, not Flask.

---

## Deploying to Vercel (with MongoDB Atlas) — all free tiers

The repo ships with `vercel.json` and `api/` plumbing, so deployment is mostly
wiring up secrets. The app is **single-origin**: Vercel serves the built React
app as static files and routes `/api/*` to the Python function, keeping cookie
sessions and relative `/api` calls working on one domain.

### 1. MongoDB Atlas — free M0 cluster
1. Create a free MongoDB Atlas account → **Build a Database** → pick the **M0**
   free cluster (no card required) → create it.
2. **Database Access** → Add new user (read/write), note username + password.
3. **Network Access** → Add IP `0.0.0.0/0` (allow all) so Vercel functions can reach it.
4. Copy the connection string:
   `mongodb+srv://USER:PASS@cluster0.xxxx.mongodb.net/` — this is `MONGODB_URI`.
   Keep `MONGODB_DB` as any name (default `reposweep`).

### 2. Vercel — app
1. Create a Vercel account → **Add New → Project** → import the
   `benrehhhh/RepoSweep` repo.
2. Framework preset: **Other** (build/output are driven by `vercel.json`).
3. Deploy → get your URL `https://<project>.vercel.app`.

### 3. GitHub OAuth app
Create an OAuth App at https://github.com/settings/developers
(GitHub allows only **one** callback URL per app):
- Homepage URL: `https://<project>.vercel.app`
- Authorization callback URL: `https://<project>.vercel.app/api/auth/github/callback`

Keep the localhost OAuth app for development.

### 4. Environment variables (Vercel → Project → Settings → Environment Variables)

| Env var | Value |
| ------- | ----- |
| `MONGODB_URI`          | the `mongodb+srv://…` string from step 1 |
| `MONGODB_DB`           | `reposweep` (or your chosen database name) |
| `SECRET_KEY`           | a long random hex string |
| `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` | from your new OAuth app |
| `FRONTEND_URL`         | `https://<project>.vercel.app` |
| `BACKEND_URL`          | `https://<project>.vercel.app` |
| `GITHUB_REDIRECT_URI`  | `https://<project>.vercel.app/api/auth/github/callback` |
| `FLASK_ENV`            | `production` |
| `MOCK_MODE`            | `false` |
| `SESSION_TIMEOUT_MINUTES` | `30` (optional) | Idle minutes before the session expires (slides on activity) |
| `SESSION_MAX_LIFETIME_MINUTES` | `720` (optional) | Absolute max minutes from sign-in, regardless of activity |

Then **Redeploy** so the new build picks the variables up.

### 5. Verify
- `curl https://<project>.vercel.app/api/health` → `{"demo_mode": false, "status": "ok"}`
- Open the URL → HTTPS, GitHub sign-in, your own repos listed.

> **Notes:** the Python function may take a few seconds on its first hit after a
> cold start (free tier). GitHub API calls inside `/api` are parallelized to stay
> inside Vercel's short execution window.

## Configuration reference

Configuration is read from environment variables; the backend auto-loads
`backend/.env`. See `.env.example` for the full template.

| Variable               | Default                                    | Purpose |
| ---------------------- | ------------------------------------------ | ------- |
| `MONGODB_URI`          | `memory://` (in-memory mongomock)          | MongoDB connection string |
| `MONGODB_DB`           | `reposweep`                                | Database name |
| `SECRET_KEY`           | dev fallback (change in prod)              | Session signing |
| `FRONTEND_URL`         | `http://localhost:5173`                    | CORS / OAuth origin |
| `BACKEND_URL`          | `http://localhost:5000`                    | OAuth redirect base |
| `GITHUB_CLIENT_ID/SECRET` | empty                                   | Enables live mode |
| `MOCK_MODE`            | `false` (auto-true without OAuth creds)    | Force demo mode |
| `SESSION_COOKIE_SECURE`| `false` (`true` when `FLASK_ENV=production`) | Set cookie only over HTTPS |
| `SESSION_TIMEOUT_MINUTES` | `30` | Idle timeout (slides on every request) |
| `SESSION_MAX_LIFETIME_MINUTES` | `720` | Absolute timeout from sign-in (ignores activity) |
| `RATELIMIT_STORAGE_URI`| (memory)                                   | Shared backend for rate limits (e.g. `redis://…`) |
| `FLASK_ENV`            | `development`                              | `production` enables `ProductionConfig` |
| `BULK_MAX_ITEMS`       | `50`                                       | Max repos per bulk op |

---

## Project structure

```
RepoSweep/
├── api/
│   ├── index.py               # Vercel serverless entry (WSGI bridge)
│   └── requirements.txt       # Vercel runtime deps (flat list; backend/ has the full dev set)
├── backend/
│   ├── run.py                 # dev server entry (port 5000)
│   ├── wsgi.py                # production WSGI entry (Waitress etc.)
│   ├── config.py              # env-driven configuration
│   ├── app/
│   │   ├── __init__.py        # Flask factory, error handlers, init-db CLI
│   │   ├── extensions.py      # mongo store (PyMongo / mongomock), rate limiter
│   │   ├── auth.py            # session, CSRF, demo login, OAuth helpers
│   │   ├── github.py          # GitHubClient (OAuth + API)
│   │   ├── mock_github.py     # 47 demo repositories
│   │   ├── models/            # User, ProtectedRepository, ActivityLog, OperationItem
│   │   ├── services/          # github_service, bulk_operations (validation/safety)
│   │   └── routes/            # auth, user, repositories, protected, activity
├── frontend/
│   ├── index.html
│   ├── vite.config.js         # /api proxy → :5000
│   └── src/
│       ├── main.jsx / App.jsx / styles/
│       ├── api/ http.js lib/ hooks/ services/
│       ├── components/        # modal, offcanvas, dropdown, badges, op-flow, ...
│       ├── layouts/           # AppLayout, Sidebar, Topbar
│       └── pages/             # Landing, AuthCallback, Dashboard, Repositories,
│                              # ProtectedRepositories, Activity, Settings
├── scripts/
│   └── smoke_test.py          # API smoke test (in-memory MongoDB)
├── vercel.json                # static SPA + /api rewrite config
└── .env.example
```

### Key API routes

| Method | Route | Description |
| ------ | ----- | ----------- |
| GET    | `/api/health` | liveness + `demo_mode` flag |
| GET/POST | `/api/auth/status`, `/api/auth/demo`, `/api/auth/logout`, `/api/auth/github/login\|callback` | auth |
| GET    | `/api/repositories` | list (+ `q`, `visibility`, `status`, `sort`, `page`) |
| POST   | `/api/repositories/bulk/archive`, `/bulk/delete` | guarded bulk ops (`confirm_phrase: "DELETE"` for delete) |
| GET/POST/DELETE | `/api/protected-repositories` | protect/unprotect |
| GET    | `/api/activity` | activity log with per-repo items |
| GET    | `/api/user` | current user profile |

---

## Safety design

- **Server-side enforcement** — protected repos are excluded inside
  `bulk_operations`, not just hidden in the UI. Bulk arrays are validated
  (≤50 items, `owner`/`name` shape) and re-verified against a fresh repo snapshot;
  only repos where `repo.owner === user.username` can be acted on.
- **Delete confirmation** — `/bulk/delete` rejects any request whose
  `confirm_phrase` is not the exact string `DELETE`.
- **CSRF** — every state-changing request needs `X-CSRF-Token` from
  `/api/auth/status`; cookies are HttpOnly + SameSite=Lax.
- **Session timeouts** — sessions expire after `SESSION_TIMEOUT_MINUTES`
  (default 30) with no activity and no later than `SESSION_MAX_LIFETIME_MINUTES`
  (default 720) after sign-in. Enforced server-side: Flask rejects the expired
  signed cookie, and the absolute cap is checked on every request.
- **Rate limits** — auth and bulk endpoints are throttled.
- **No token leakage** — the GitHub access token lives only in the DB/session.
- **Errors** — no tracebacks leak past the API boundary.

---

## Troubleshooting

- **Port 5000 "already in use" / plain 404 page** — something else is on 5000.
  `netstat -ano | findstr :5000` to find the PID, then
  `taskkill /PID <pid> /F` (restart the backend after).
- **`npm.ps1 is not recognized`** in PowerShell — run `npm.cmd run dev` instead.
- **Vite can't reach the API** — the dev proxy forwards `/api` → `localhost:5000`;
  make sure the backend is running.
- **`MongoWriteError`/auth failures in production** — check `MONGODB_URI`
  (Atlas connection strings need `mongodb+srv://`), that the database user can
  read/write, and **Network Access allows `0.0.0.0/0`**.
- **Demo login disabled** — you set GitHub OAuth credentials but want the mock
  experience: set `MOCK_MODE=true`.

## License

Private / internal use. Not affiliated with GitHub.