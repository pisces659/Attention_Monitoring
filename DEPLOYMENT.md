# Deploy NeuroLens AI (free tier)

Host the full app for **$0/month** using:

| Service | Hosts | Free tier |
|---------|--------|-----------|
| [Supabase](https://supabase.com) | PostgreSQL + file storage | 500 MB DB, 1 GB storage |
| [Render](https://render.com) | FastAPI backend | Free web service (sleeps when idle) |
| [Vercel](https://vercel.com) | Next.js frontend | Hobby plan |

```
Browser → Vercel (attention-web1) → Render (backend) → Supabase (DB + videos/CSV)
```

---

## Prerequisites

- GitHub repo pushed: `pisces659/Attention_Monitoring`
- Accounts on Supabase, Render, and Vercel (all free signup)

---

## Step 1 — Supabase (database + storage)

### 1.1 Create project

1. [supabase.com](https://supabase.com) → **New project**
2. Choose a region close to your users (e.g. Singapore / Mumbai area)
3. Save the **database password**

### 1.2 Run database schema

1. **SQL Editor** → **New query**
2. Paste the full contents of [`backend/schema.sql`](backend/schema.sql)
3. **Run**

### 1.3 Create storage buckets

**Storage** → **New bucket** — create these three as **Public** buckets:

| Bucket name | Purpose |
|-------------|---------|
| `raw-videos` | Raw therapy video uploads |
| `annotated-videos` | Annotated video uploads |
| `session-csv` | Session CSV files |

### 1.4 Collect API keys

**Project Settings → API**:

| Key | Used for |
|-----|----------|
| Project URL | `SUPABASE_URL` |
| `service_role` (secret) | `SUPABASE_SERVICE_ROLE_KEY` |
| JWT Secret | `SUPABASE_JWT_SECRET` |

**Project Settings → Database → Connection string → URI**  
Use the **direct** connection (port `5432`), then change the scheme to:

```
postgresql+asyncpg://postgres.[ref]:[YOUR-PASSWORD]@db.[ref].supabase.co:5432/postgres
```

### 1.5 Seed demo data (run once from your PC)

```powershell
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt

$env:DATABASE_URL="postgresql+asyncpg://postgres:PASSWORD@db.PROJECT.supabase.co:5432/postgres"
$env:SUPABASE_URL="https://PROJECT.supabase.co"
$env:SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
python -m scripts.seed
```

You should see `Seed complete.` Demo login after deploy: `demo@neurolens.ai` / `demo123`.

---

## Step 2 — Render (backend API)

### Option A — Blueprint (recommended)

1. [dashboard.render.com](https://dashboard.render.com) → **New → Blueprint**
2. Connect GitHub repo `Attention_Monitoring`
3. Render reads [`render.yaml`](render.yaml) at repo root
4. Add **secret** environment variables in the service dashboard:

| Variable | Value |
|----------|--------|
| `DATABASE_URL` | `postgresql+asyncpg://...` from Step 1.4 |
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key |
| `SUPABASE_JWT_SECRET` | JWT secret |
| `CORS_ORIGINS` | `https://YOUR-APP.vercel.app` (update after Step 3) |

5. Deploy → copy your service URL, e.g. `https://neurolens-api.onrender.com`

### Option B — Manual web service

| Setting | Value |
|---------|--------|
| Root directory | `backend` |
| Build command | `pip install -r requirements.txt` |
| Start command | `uvicorn app.main:app --host 0.0.0.0 --port $PORT` |
| Health check path | `/health` |

See [`backend/env.production.example`](backend/env.production.example) for all env vars.

### Verify backend

```text
GET https://YOUR-SERVICE.onrender.com/health
→ {"status":"ok"}
```

First request after idle may take **30–60 seconds** (free tier cold start).

---

## Step 3 — Vercel (frontend)

1. [vercel.com](https://vercel.com) → **Add New → Project**
2. Import `Attention_Monitoring` from GitHub
3. **Root Directory** → `attention-web1`
4. **Environment variables** (Production):

| Variable | Value |
|----------|--------|
| `NEXT_PUBLIC_API_URL` | `https://YOUR-SERVICE.onrender.com/api/v1` |
| `NEXT_PUBLIC_USE_API` | `true` |

5. Deploy → copy URL, e.g. `https://attention-monitoring.vercel.app`

### Update CORS on Render

Go back to Render → add your Vercel URL to `CORS_ORIGINS`:

```text
https://attention-monitoring.vercel.app,http://localhost:3000
```

Redeploy the backend service.

---

## Step 4 — Smoke test

1. Open your Vercel URL → **Login**
2. `demo@neurolens.ai` / `demo123`
3. Dashboard loads with Riya Singh (P0001)
4. **Sessions → New session** → upload pre-recorded session with CSV
5. Confirm video plays on report page

---

## What works in production

| Feature | Status |
|---------|--------|
| Dashboard, patients, sessions | Yes |
| P0001 / S0001 display IDs | Yes |
| Custom session date/time | Yes |
| Video + CSV upload | Yes (Supabase Storage) |
| Video playback | Yes (public storage URLs) |
| Demo login | Yes (`DEV_AUTH_BYPASS=true`) |

---

## Limitations (free tier)

- **Render sleeps** after ~15 min idle — first load is slow
- **Supabase** may pause inactive projects — wakes on use
- **Large videos** may hit upload size limits
- **Demo auth only** — not suitable for real patient data until Supabase Auth is wired up
- **Python pipeline** (`main.py` at repo root) is separate — not required for the web app

---

## Local development (unchanged)

```powershell
# Terminal 1 — backend
cd backend
.\run_dev.ps1

# Terminal 2 — frontend
cd attention-web1
.\run_dev.ps1
```

Uses SQLite + local `uploads/` folder. See [`backend/README.md`](backend/README.md).

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| CORS error in browser | Add exact Vercel URL to `CORS_ORIGINS` on Render |
| `401 Not authenticated` | Log in again; check `DEV_AUTH_BYPASS=true` on Render |
| Dashboard 500 | Check Render logs; confirm `DATABASE_URL` uses `postgresql+asyncpg://` |
| Video won't play | Storage buckets must be **public**; check `SUPABASE_SERVICE_ROLE_KEY` |
| Cold start timeout | Wait 60s and refresh; or upgrade Render plan |

---

## Env file templates

- Backend: [`backend/env.production.example`](backend/env.production.example)
- Frontend: [`attention-web1/env.production.example`](attention-web1/env.production.example)
