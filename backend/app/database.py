"""SQLAlchemy database setup."""

from collections.abc import AsyncGenerator
from pathlib import Path

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase

from app.config import get_settings

_BACKEND_ROOT = Path(__file__).resolve().parents[1]


class Base(DeclarativeBase):
    pass


def _resolve_database_url(url: str) -> str:
    if url.startswith("sqlite"):
        # Keep neurolens.db in backend/ regardless of process cwd
        if url.endswith("neurolens.db") or url.endswith("./neurolens.db"):
            db_file = _BACKEND_ROOT / "neurolens.db"
            return f"sqlite+aiosqlite:///{db_file.as_posix()}"
    return url


settings = get_settings()
engine = create_async_engine(
    _resolve_database_url(settings.database_url),
    echo=settings.app_env == "development",
)
SessionLocal = async_sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with SessionLocal() as session:
        yield session
