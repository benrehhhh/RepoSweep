import os
from datetime import timedelta

from dotenv import load_dotenv

load_dotenv()


def _env_bool(name, default=False):
    val = os.getenv(name)
    if val is None:
        return default
    return val.strip().lower() in ("1", "true", "yes", "on")


class Config:
    """Application configuration loaded from environment variables."""

    SECRET_KEY = os.getenv("SECRET_KEY", "dev-insecure-secret-change-me")

    # MongoDB. `memory://` uses an in-memory mongomock client — the zero-setup
    # default for local dev and the smoke tests. Production sets a real URI
    # (e.g. MongoDB Atlas: mongodb+srv://user:pass@cluster.mongodb.net/).
    MONGODB_URI = os.getenv("MONGODB_URI", "memory://")
    MONGODB_DB = os.getenv("MONGODB_DB", "reposweep")

    FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173").rstrip("/")
    BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:5000").rstrip("/")

    GITHUB_CLIENT_ID = os.getenv("GITHUB_CLIENT_ID", "")
    GITHUB_CLIENT_SECRET = os.getenv("GITHUB_CLIENT_SECRET", "")
    GITHUB_REDIRECT_URI = os.getenv(
        "GITHUB_REDIRECT_URI",
        f"{BACKEND_URL}/api/auth/github/callback",
    )
    GITHUB_SCOPES = "repo delete_repo read:user"
    GITHUB_API_URL = "https://api.github.com"
    GITHUB_OAUTH_URL = "https://github.com/login/oauth"
    GITHUB_WEB_URL = "https://github.com"

    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SAMESITE = "Lax"
    SESSION_COOKIE_SECURE = _env_bool("SESSION_COOKIE_SECURE", default=False)

    # Session timeout. The idle window slides forward on every request; the
    # absolute cap is measured from sign-in and ignores activity. Flask rejects
    # the signed cookie server-side once PERMANENT_SESSION_LIFETIME passes.
    SESSION_TIMEOUT_MINUTES = int(os.getenv("SESSION_TIMEOUT_MINUTES", "30"))
    PERMANENT_SESSION_LIFETIME = timedelta(minutes=SESSION_TIMEOUT_MINUTES)
    SESSION_MAX_LIFETIME_MINUTES = int(os.getenv("SESSION_MAX_LIFETIME_MINUTES", "720"))
    SESSION_MAX_LIFETIME = timedelta(minutes=SESSION_MAX_LIFETIME_MINUTES)
    SESSION_REFRESH_EACH_REQUEST = True

    @property
    def MOCK_MODE(self):
        forced = _env_bool("MOCK_MODE", default=False)
        return forced or not self.GITHUB_CLIENT_ID

    @property
    def CORS_ORIGINS(self):
        return [self.FRONTEND_URL]

    BULK_MAX_ITEMS = 50
    # Directory of the built frontend (relative to the backend working dir);
    # only used when the backend serves the SPA itself (local production build).
    FRONTEND_DIST = os.getenv("FRONTEND_DIST", "../frontend/dist")
    DEMO_USERNAME = "demo-user"
    DEMO_DISPLAY_NAME = "Demo User"
    DEMO_AVATAR_URL = (
        "https://api.dicebear.com/9.x/identicon/svg?seed=reposweep-demo&backgroundColor=24292f"
    )


class ProductionConfig(Config):
    SESSION_COOKIE_SECURE = True


def get_config():
    if os.getenv("FLASK_ENV") == "production":
        return ProductionConfig()
    return Config()