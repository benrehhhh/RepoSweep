from app.routes.auth import bp as auth_bp
from app.routes.user import bp as user_bp
from app.routes.repositories import bp as repositories_bp
from app.routes.protected import bp as protected_bp
from app.routes.activity import bp as activity_bp

ALL_BLUEPRINTS = [auth_bp, user_bp, repositories_bp, protected_bp, activity_bp]