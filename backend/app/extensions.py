import os

from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

# Rate-limit storage. Defaults to in-memory (fine for single-process dev).
# For production, set RATELIMIT_STORAGE_URI to a shared backend, e.g.
#   redis://redis:6379   (docker-compose deploys)
storage_uri = os.getenv("RATELIMIT_STORAGE_URI") or "memory://"

limiter = Limiter(
    key_func=get_remote_address,
    default_limits=["300 per hour"],
    storage_uri=storage_uri,
)