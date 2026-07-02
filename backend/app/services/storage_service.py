"""Supabase Storage service — upload raw, annotated, and CSV files."""

from __future__ import annotations

from pathlib import Path
from typing import Optional
from uuid import UUID

from app.config import get_settings

settings = get_settings()

VIDEO_CONTENT_TYPES = {
    ".mp4": "video/mp4",
    ".webm": "video/webm",
    ".mov": "video/quicktime",
    ".mkv": "video/x-matroska",
}


def _video_content_type(filename: str) -> str:
    ext = Path(filename).suffix.lower()
    return VIDEO_CONTENT_TYPES.get(ext, "video/mp4")


class StorageService:
    """Uploads files to Supabase Storage. Falls back to local disk in development."""

    def __init__(self) -> None:
        self._client = None
        if settings.supabase_url and settings.supabase_service_role_key:
            from supabase import create_client

            self._client = create_client(settings.supabase_url, settings.supabase_service_role_key)

    def _local_path(self, bucket: str, object_path: str) -> Path:
        base = Path(__file__).resolve().parents[2] / "uploads" / bucket
        base.mkdir(parents=True, exist_ok=True)
        return base / object_path

    async def upload_bytes(
        self,
        bucket: str,
        object_path: str,
        content: bytes,
        content_type: str,
    ) -> str:
        if self._client:
            self._client.storage.from_(bucket).upload(
                object_path,
                content,
                file_options={"content-type": content_type, "upsert": "true"},
            )
            public = self._client.storage.from_(bucket).get_public_url(object_path)
            return public

        local = self._local_path(bucket, object_path)
        local.parent.mkdir(parents=True, exist_ok=True)
        local.write_bytes(content)
        return f"/uploads/{bucket}/{object_path}"

    async def upload_session_files(
        self,
        session_id: UUID,
        *,
        raw_video: Optional[bytes] = None,
        annotated_video: Optional[bytes] = None,
        csv_content: Optional[str] = None,
        raw_filename: Optional[str] = None,
        annotated_filename: Optional[str] = None,
    ) -> dict[str, Optional[str]]:
        prefix = str(session_id)
        urls: dict[str, Optional[str]] = {
            "raw_video_url": None,
            "annotated_video_url": None,
            "csv_url": None,
        }

        if raw_video:
            name = raw_filename or "raw.mp4"
            urls["raw_video_url"] = await self.upload_bytes(
                settings.storage_bucket_raw,
                f"{prefix}/{name}",
                raw_video,
                _video_content_type(name),
            )

        if annotated_video:
            name = annotated_filename or "annotated.mp4"
            urls["annotated_video_url"] = await self.upload_bytes(
                settings.storage_bucket_annotated,
                f"{prefix}/{name}",
                annotated_video,
                _video_content_type(name),
            )

        if csv_content is not None:
            urls["csv_url"] = await self.upload_bytes(
                settings.storage_bucket_csv,
                f"{prefix}/frame_data.csv",
                csv_content.encode("utf-8"),
                "text/csv",
            )

        return urls
