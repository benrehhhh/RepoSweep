import os

from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from pymongo import MongoClient


class MongoStore:
    """Thin PyMongo-backed store initialized from Flask config.

    `MONGODB_URI=memory://` swaps in mongomock so local dev and the smoke
    tests work with zero setup (no MongoDB process required).
    """

    def __init__(self):
        self._client = None
        self.db = None

    def init_app(self, app):
        uri = app.config.get("MONGODB_URI", "memory://")
        database = app.config.get("MONGODB_DB", "reposweep")
        if uri == "memory://":
            import mongomock

            self._client = mongomock.MongoClient()
        else:
            self._client = MongoClient(uri, serverSelectionTimeoutMS=5000)
        self.db = self._client[database]
        self._ensure_indexes()

    def _ensure_indexes(self):
        try:
            from app.models import ensure_indexes

            ensure_indexes()
        except Exception:
            # Database may be unreachable yet; indexes are created lazily on
            # the next connect and guaranteed on the first request too.
            pass


mongo = MongoStore()

# Rate-limit storage. Defaults to in-memory (fine for single-process local and
# per-instance serverless). For multi-worker containers set a shared backend:
#   RATELIMIT_STORAGE_URI=redis://redis:6379
storage_uri = os.getenv("RATELIMIT_STORAGE_URI") or "memory://"

limiter = Limiter(
    key_func=get_remote_address,
    default_limits=["300 per hour"],
    storage_uri=storage_uri,
)