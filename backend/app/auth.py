"""Session authentication and CSRF protection helpers."""

import secrets
import time
from functools import wraps

from flask import current_app, g, session

from app.models.user import User
from app.utils.errors import AuthError


def _new_session(user):
    session.clear()
    session.permanent = True
    session["user_id"] = user.id
    session["demo"] = user.github_id is None
    session["login_ts"] = int(time.time())
    session["csrf_token"] = secrets.token_hex(24)


def login_demo():
    """Create (or reuse) the demo-mode user and open a session."""
    cfg = current_app.config
    user = User.get_or_create(
        cfg["DEMO_USERNAME"],
        github_id=None,
        display_name=cfg["DEMO_DISPLAY_NAME"],
        avatar_url=cfg["DEMO_AVATAR_URL"],
    )
    _new_session(user)
    return user


def login_github(github_profile, access_token, token_scope):
    user = User.get_or_create(
        github_profile["login"],
        github_id=github_profile.get("id"),
        display_name=github_profile.get("name") or github_profile["login"],
        avatar_url=github_profile.get("avatar_url"),
        github_access_token=access_token,
        token_scope=token_scope,
    )
    user.github_id = github_profile.get("id")
    user.github_access_token = access_token
    user.token_scope = token_scope
    user.save()
    _new_session(user)
    return user


def current_user():
    user_id = session.get("user_id")
    if not user_id:
        return None
    login_ts = session.get("login_ts")
    if login_ts is None:
        # Session created before session timeouts existed: backfill the login
        # timestamp instead of force-logging the user out mid-flight.
        session["login_ts"] = int(time.time())
    elif time.time() - login_ts > current_app.config["SESSION_MAX_LIFETIME"].total_seconds():
        session.clear()
        return None
    return User.find_by_id(user_id)


def require_user():
    user = current_user()
    if user is None:
        raise AuthError("You need to sign in to RepoSweep first.", 401)
    g.user = user
    return user


def user_access_token(user):
    if current_app.config["MOCK_MODE"]:
        return None
    return user.github_access_token


def require_csrf():
    supplied = request_csrf_token()
    expected = session.get("csrf_token")
    if not expected or not supplied or supplied != expected:
        raise AuthError(
            "Your security token is missing or invalid. Please refresh the page and try again.",
            403,
        )


def request_csrf_token():
    from flask import request

    return request.headers.get("X-CSRF-Token") or request.headers.get("X-XSRF-TOKEN")


def session_csrf_token():
    return session.get("csrf_token", "")


def csrf_token_header(user):
    return session.get("csrf_token", "")


def login_required(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        require_user()
        return fn(*args, **kwargs)

    return wrapper


def csrf_required(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        require_csrf()
        return fn(*args, **kwargs)

    return wrapper