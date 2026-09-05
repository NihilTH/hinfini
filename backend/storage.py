import asyncio
import logging
import uuid
from datetime import datetime, timezone

import config

logger = logging.getLogger("storage")


class StorageError(Exception):
    pass


class LocalStorage:
    driver = "local"

    def __init__(self):
        config.UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

    async def save(self, key: str, content: bytes, content_type: str) -> str:
        path = config.UPLOAD_DIR / key
        path.parent.mkdir(parents=True, exist_ok=True)
        await asyncio.to_thread(path.write_bytes, content)
        return f"{config.PUBLIC_SITE_URL}/api/uploads/{key}"

    async def delete(self, key: str) -> None:
        path = config.UPLOAD_DIR / key
        if path.exists():
            await asyncio.to_thread(path.unlink)


class S3Storage:
    driver = "s3"

    def __init__(self):
        import boto3
        missing = [k for k in ("S3_BUCKET", "S3_ACCESS_KEY_ID", "S3_SECRET_ACCESS_KEY") if not getattr(config, k)]
        if missing:
            raise StorageError(f"Missing S3 config: {', '.join(missing)}")
        self.bucket = config.S3_BUCKET
        self.client = boto3.client(
            "s3",
            endpoint_url=config.S3_ENDPOINT_URL or None,
            aws_access_key_id=config.S3_ACCESS_KEY_ID,
            aws_secret_access_key=config.S3_SECRET_ACCESS_KEY,
            region_name=config.S3_REGION,
        )

    def _url(self, key: str) -> str:
        if config.S3_PUBLIC_BASE_URL:
            return f"{config.S3_PUBLIC_BASE_URL}/{key}"
        if config.S3_ENDPOINT_URL:
            return f"{config.S3_ENDPOINT_URL.rstrip('/')}/{self.bucket}/{key}"
        return f"https://{self.bucket}.s3.{config.S3_REGION}.amazonaws.com/{key}"

    async def save(self, key: str, content: bytes, content_type: str) -> str:
        await asyncio.to_thread(
            self.client.put_object, Bucket=self.bucket, Key=key, Body=content,
            ContentType=content_type, CacheControl="public, max-age=31536000, immutable",
        )
        return self._url(key)

    async def delete(self, key: str) -> None:
        await asyncio.to_thread(self.client.delete_object, Bucket=self.bucket, Key=key)


def build_storage():
    if config.STORAGE_DRIVER == "s3":
        return S3Storage()
    if config.IS_PROD:
        raise StorageError("STORAGE_DRIVER=local is not allowed in production. Configure S3/R2.")
    logger.warning("Using LOCAL file storage (development only).")
    return LocalStorage()


def make_key(ext: str) -> str:
    now = datetime.now(timezone.utc)
    return f"{now:%Y/%m}/{uuid.uuid4().hex}{ext}"
