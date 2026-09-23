import os

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

    SQLALCHEMY_DATABASE_URI = os.getenv(
        "DATABASE_URL",
        "mysql+pymysql://reposweep:reposweep@localhost:3306/reposweep?charset=utf8mb4",
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False

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

    @property
    def MOCK_MODE(self):
        forced = _env_bool("MOCK_MODE", default=False)
        return forced or not self.GITHUB_CLIENT_ID

    @property
    def CORS_ORIGINS(self):
        return [self.FRONTEND_URL]

    BULK_MAX_ITEMS = 50
    # Directory of the built frontend (relative to the backend working dir).
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