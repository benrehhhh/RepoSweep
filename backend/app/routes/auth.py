from flask import Blueprint, current_app, jsonify, redirect, request

from app import auth
from app.auth import login_demo, login_required
from app.github import OAuth
from app.services import github_service
from app.utils.errors import AuthError, NotFoundError

bp = Blueprint("auth", __name__, url_prefix="/api/auth")


@bp.get("/github")
def github_login():
    if current_app.config["MOCK_MODE"]:
        return (
            jsonify(
                {
                    "error": "Demo mode is active. Use /api/auth/demo instead.",
                    "demo_mode": True,
                }
            ),
            409,
        )
    return redirect(OAuth.authorize_url())


@bp.get("/github/callback")
def github_callback():
    code = request.args.get("code")
    error = request.args.get("error")
    if error or not code:
        return redirect(
            f"{current_app.config['FRONTEND_URL']}/auth/callback?error=denied"
        )
    tokens = OAuth.exchange_code(code)
    profile = github_service.get_user(tokens["access_token"])
    user = auth.login_github(profile, tokens["access_token"], tokens["scope"])
    return redirect(f"{current_app.config['FRONTEND_URL']}/auth/callback")


@bp.post("/demo")
def demo_login():
    # CSRF is intentionally not required: an unauthenticated session carries
    # no token to protect, and this endpoint only creates a fresh demo session.
    if not current_app.config["MOCK_MODE"]:
        raise AuthError(
            "Demo login is disabled when GitHub OAuth is configured.", 409
        )
    user = login_demo()
    return jsonify({"user": user.to_dict(), "demo_mode": True})


@bp.get("/status")
def status():
    user = auth.current_user()
    return jsonify(
        {
            "authenticated": user is not None,
            "demo_mode": current_app.config["MOCK_MODE"],
            "user": user.to_dict() if user else None,
            "csrf_token": auth.session_csrf_token() if user else None,
            "session_timeout_minutes": current_app.config["SESSION_TIMEOUT_MINUTES"],
        }
    )


@bp.post("/logout")
@login_required
@auth.csrf_required
def logout():
    from flask import session

    session.clear()
    return jsonify({"ok": True})