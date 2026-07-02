# NeuroLens AI — FastAPI Backend

Production backend for the NeuroLens AI attention monitoring platform.

## Architecture

```
Frontend (Next.js) → FastAPI REST API → PostgreSQL (Supabase)
                              ↓
                     Supabase Storage (videos, CSV)
                              ↓
                     CSV Parser → Assessment JSON
```

**CSV is never sent to the frontend.** The parser converts frame_data CSV into Assessment JSON stored in PostgreSQL.

## Quick start (local)

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate        # Windows
pip install -r requirements.txt
cp .env.example .env
```

Set in `.env`:

```
DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/neurolens
DEV_AUTH_BYPASS=true
CORS_ORIGINS=http://localhost:3000
```

Run schema + seed:

```bash
python -m scripts.seed
uvicorn app.main:app --reload --port 8000
```

API docs: http://localhost:8000/docs

## Authentication

Production: Supabase Auth JWT in `Authorization: Bearer <token>` header.

Development: set `DEV_AUTH_BYPASS=true` and use `Authorization: Bearer dev-token` after seeding (doctor user: `demo@neurolens.ai`).

## MVP seed data

| Entity | Details |
|--------|---------|
| Clinic | NeuroLens Cognitive Clinic |
| Doctor | Dr. Ananya Sharma — demo@neurolens.ai |
| Parent | Priya Singh — parent@example.com |
| Patient | Riya Singh (P004), age 6 |
| Session | 1 completed session from sample-session.csv |

## Key endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check |
| GET | `/api/v1/auth/me` | Current user + clinic context |
| GET | `/api/v1/patients` | List patients (clinic-scoped) |
| POST | `/api/v1/patients` | Create patient |
| GET | `/api/v1/sessions` | List sessions |
| POST | `/api/v1/sessions` | Create session |
| POST | `/api/v1/sessions/{id}/upload` | Upload raw video + annotated video + CSV |
| GET | `/api/v1/reports` | List reports |
| GET | `/api/v1/reports/{id}/full` | Full SessionReport shape |
| GET | `/api/v1/dashboard/patient-time-history?patientId=` | Dashboard data |
| GET | `/api/v1/analytics/summary` | Analytics summary |
| GET | `/api/v1/sessions/compare?a=&b=` | Session comparison |

## Manual upload flow (current MVP)

Doctor uploads three files:

1. Raw video
2. Annotated video
3. CSV (frame_data)

`UploadService` stores files → runs CSV parser → saves Assessment JSON → creates Report.

When Python AI is integrated later, only `UploadService` and a new `ProcessingService` change.

## Deployment

See **[DEPLOYMENT.md](../DEPLOYMENT.md)** for the full free-tier guide (Supabase + Render + Vercel).

Quick summary:

- **Backend**: Render — `uvicorn app.main:app --host 0.0.0.0 --port $PORT` (see [`render.yaml`](../render.yaml))
- **Database**: Supabase PostgreSQL — run [`schema.sql`](schema.sql)
- **Storage**: Supabase Storage buckets (`raw-videos`, `annotated-videos`, `session-csv`)
- **Frontend**: Vercel — root directory `attention-web1`

## Frontend integration

Set in `attention-web1/.env.local`:

```
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
NEXT_PUBLIC_USE_API=true
```

The frontend service layer calls these endpoints while keeping all UI unchanged.
