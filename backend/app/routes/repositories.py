from flask import Blueprint, current_app, jsonify, request

from app import auth
from app.extensions import limiter
from app.models.user import ProtectedRepository
from app.services import bulk_operations, github_service
from app.utils.errors import RepoSweepError

bp = Blueprint("repositories", __name__, url_prefix="/api/repositories")


@bp.get("")
@auth.login_required
def list_repositories():
    user = auth.require_user()
    access_token = auth.user_access_token(user)
    repos = github_service.get_repos(access_token) or []
    protected_keys = ProtectedRepository.keys_for_user(user.id)

    annotated = []
    for repo in repos:
        full_name = (repo.get("full_name") or f"{repo['owner']['login']}/{repo['name']}").lower()
        repo = dict(repo)
        repo["protected"] = full_name in protected_keys
        annotated.append(repo)

    return jsonify(
        {
            "source": "demo" if github_service.is_mock_mode() else "github",
            "total": len(annotated),
            "protected_count": sum(1 for r in annotated if r["protected"]),
            "repositories": annotated,
        }
    )


@bp.post("/bulk/archive")
@auth.login_required
@auth.csrf_required
@limiter.limit("60 per minute")
def bulk_archive():
    user = auth.require_user()
    try:
        payload = request.get_json(silent=True) or {}
        result = bulk_operations.run_bulk(
            user,
            "archive",
            payload.get("repositories", []),
            {"access_token": auth.user_access_token(user)},
        )
    except ValueError as exc:
        raise RepoSweepError(str(exc), 400)
    return jsonify(result)


@bp.post("/bulk/delete")
@auth.login_required
@auth.csrf_required
@limiter.limit("30 per minute")
def bulk_delete():
    user = auth.require_user()
    payload = request.get_json(silent=True) or {}

    if payload.get("confirm_phrase") != "DELETE":
        raise RepoSweepError(
            "Deletion requires explicit confirmation. Type DELETE to confirm.", 400
        )

    try:
        result = bulk_operations.run_bulk(
            user,
            "delete",
            payload.get("repositories", []),
            {"access_token": auth.user_access_token(user)},
        )
    except ValueError as exc:
        raise RepoSweepError(str(exc), 400)
    return jsonify(result)