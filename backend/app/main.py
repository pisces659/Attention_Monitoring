"""FastAPI application entrypoint."""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pathlib import Path

from app.config import get_settings
from app.routers import analytics, auth, clinics, dashboard, doctors, patients, reports, sessions

settings = get_settings()


@asynccontextmanager
async def lifespan(_: FastAPI):
    uploads = Path(__file__).resolve().parents[1] / "uploads"
    uploads.mkdir(exist_ok=True)
    try:
        from app.services.db_migrations import run_dev_migrations

        await run_dev_migrations()
    except Exception:
        if settings.app_env == "development":
            raise
    yield


app = FastAPI(
    title="NeuroLens AI API",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

api_prefix = settings.api_prefix
app.include_router(auth.router, prefix=api_prefix)
app.include_router(clinics.router, prefix=api_prefix)
app.include_router(doctors.router, prefix=api_prefix)
app.include_router(patients.router, prefix=api_prefix)
app.include_router(sessions.router, prefix=api_prefix)
app.include_router(reports.router, prefix=api_prefix)
app.include_router(dashboard.router, prefix=api_prefix)
app.include_router(analytics.router, prefix=api_prefix)

uploads_dir = Path(__file__).resolve().parents[1] / "uploads"
if uploads_dir.exists():
    app.mount("/uploads", StaticFiles(directory=str(uploads_dir)), name="uploads")


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}
