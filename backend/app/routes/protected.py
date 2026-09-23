import re

from flask import Blueprint, jsonify, request

from app import auth
from app.extensions import db
from app.models.user import ProtectedRepository
from app.services import github_service
from app.utils.errors import NotFoundError, RepoSweepError

bp = Blueprint("protected", __name__, url_prefix="/api/protected-repositories")

NAME_RE = re.compile(r"^[A-Za-z0-9_.\-]{1,255}$")
OWNER_RE = re.compile(r"^[A-Za-z0-9\-]{1,255}$")


@bp.get("")
@auth.login_required
def list_protected():
    user = auth.require_user()
    rows = ProtectedRepository.find_by_user(user.id)
    lookup = github_service.current_snapshot(auth.user_access_token(user))
    items = []
    for row in rows:
        data = row.to_dict()
        data["in_repositories"] = data["full_name"].lower() in lookup
        items.append(data)
    return jsonify({"items": items, "total": len(items)})


@bp.post("")
@auth.login_required
@auth.csrf_required
def add_protected():
    user = auth.require_user()
    payload = request.get_json(silent=True) or {}
    owner = (payload.get("owner") or "").strip()
    name = (payload.get("repository_name") or payload.get("name") or "").strip()

    if not OWNER_RE.match(owner) or not NAME_RE.match(name):
        raise RepoSweepError("Enter a valid repository owner and name.", 400)

    full_name = f"{owner}/{name}".lower()
    lookup = github_service.current_snapshot(auth.user_access_token(user))
    if full_name not in lookup:
        raise RepoSweepError(
            "Repository not found in your account. Only repositories you can access can be protected.",
            404,
        )

    existing = ProtectedRepository.find_by_user(user.id)
    keys = {r.full_name.lower() for r in existing}
    if full_name in keys:
        return jsonify({"error": "Repository is already protected."}), 409

    row = ProtectedRepository(
        user_id=user.id,
        owner=owner,
        repository_name=name,
    )
    db.session.add(row)
    db.session.commit()
    return jsonify({"item": row.to_dict()}), 201


@bp.delete("/<int:item_id>")
@auth.login_required
@auth.csrf_required
def remove_protected(item_id):
    user = auth.require_user()
    row = db.session.get(ProtectedRepository, item_id)
    if row is None or row.user_id != user.id:
        raise NotFoundError("Protected repository not found.")
    db.session.delete(row)
    db.session.commit()
    return jsonify({"ok": True})