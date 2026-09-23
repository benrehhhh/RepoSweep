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
| Frontend  | React 18, Vite 6, React Router 6, TanStack Query, Bootstrap 5 (CSS only) + custom CSS, Bootstrap Icons |
| Backend   | Python 3.13, Flask 3, SQLAlchemy 2, Flask-Limiter, PyMySQL    |
| Database  | MySQL 8.0 (local) — also runs on SQLite for zero-setup demo   |
| Security  | HttpOnly SameSite session cookie, per-session CSRF token header, server-side bulk-op validation |

---

## Quick start (demo mode)

Prerequisites: **Node 20+**, **Python 3.11+**, and optionally **MySQL 8.0** locally.

```bash
# 1. Backend
cd backend
python -m venv .venv
.venv\Scripts\activate                # Windows:  .venv\Scripts\activate
pip install -r requirements.txt
copy .env.example ..\.env.example     # just for reference; see below
python run.py                         # http://localhost:5000

# 2. Frontend (new terminal)
cd frontend
npm install
npm run dev                           # http://localhost:5173
```

Open **http://localhost:5173** → **Try the live demo** → no login prompt, no tokens.

### Database setup (pick one)

- **Option A — MySQL (recommended):** create the database, app user, and schema
  with one script. It prompts for your *MySQL root* password (used only to create
  the `reposweep` DB/user, never stored), then writes `backend/.env`:

  ```powershell
  powershell -ExecutionPolicy Bypass -File scripts\setup_db.ps1
  ```

  It creates database `reposweep`, user `reposweep` / password `reposweep`, applies
  `database/schema.sql`, and generates `backend/.env` with a random `SECRET_KEY`.

  > MySQL 8 note: the first `setup_db.ps1` run may print a warning on the schema
  > step — re-run the script; it is idempotent (`IF NOT EXISTS` everywhere).

- **Option B — SQLite (zero setup):** compatible out of the box. Set
  `DATABASE_URL=sqlite:///reposweep.db` in `backend/.env` (or let it default) and
  run `flask init-db` from `backend/` to create the tables. Fine for local demo use.

`scripts/smoke_test.py` exercises the whole API against a throwaway SQLite DB:

```bash
cd backend
python ..\scripts\smoke_test.py                # SQLite (default)
python ..\scripts\smoke_test.py --mysql        # against configured MySQL
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

## Configuration reference

Configuration is read from environment variables; the backend auto-loads
`backend/.env`. See `.env.example` for the full template.

| Variable               | Default                                    | Purpose |
| ---------------------- | ------------------------------------------ | ------- |
| `DATABASE_URL`         | `mysql+pymysql://reposweep:reposweep@localhost:3306/reposweep?charset=utf8mb4` | SQLAlchemy connection string |
| `SECRET_KEY`           | dev fallback (change in prod)              | Session signing |
| `FRONTEND_URL`         | `http://localhost:5173`                    | CORS / OAuth origin |
| `BACKEND_URL`          | `http://localhost:5000`                    | OAuth redirect base |
| `GITHUB_CLIENT_ID/SECRET` | empty                                   | Enables live mode |
| `MOCK_MODE`            | `false` (auto-true without OAuth creds)    | Force demo mode |
| `SESSION_COOKIE_SECURE`| `false`                                    | Set `true` behind HTTPS |
| `BULK_MAX_ITEMS`       | `50`                                       | Max repos per bulk op |

---

## Project structure

```
RepoSweep/
├── backend/
│   ├── run.py                 # dev server entry (port 5000)
│   ├── config.py              # env-driven configuration
│   ├── app/
│   │   ├── __init__.py        # Flask factory, error handlers, init-db CLI
│   │   ├── extensions.py      # db, rate limiter
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
├── database/schema.sql        # MySQL DDL
├── scripts/
│   ├── setup_db.ps1           # one-shot MySQL + .env bootstrap
│   └── smoke_test.py          # API smoke test (SQLite or --mysql)
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
- **Rate limits** — auth and bulk endpoints are throttled.
- **No token leakage** — the GitHub access token lives only in the DB/session.
- **Errors** — no tracebacks leak past the API boundary.

---

## Troubleshooting

- **`Access denied for user 'reposweep'` during setup** — older versions of the
  script fed the *root* password to the schema step. Update the script and re-run;
  it is idempotent.
- **Port 5000 "already in use" / plain 404 page** — something else is on 5000.
  `netstat -ano | findstr :5000` to find the PID, then
  `taskkill /PID <pid> /F` (restart the backend after).
- **`npm.ps1 is not recognized`** in PowerShell — run `npm.cmd run dev` instead.
- **Vite can't reach the API** — the dev proxy forwards `/api` → `localhost:5000`;
  make sure the backend is running.

## License

Private / internal use. Not affiliated with GitHub.