"""Server-side execution of bulk repository operations.

Every destructive operation is validated here, independent of what the
frontend sends. The frontend is never trusted with permission decisions.

GitHub calls run with capped concurrency so a 50-repo sweep finishes quickly
— important on serverless hosts with short execution windows (Vercel free).
"""

import re
from concurrent.futures import ThreadPoolExecutor

from flask import current_app

from app.models.activity import ActivityLog, OperationItem
from app.models.user import ProtectedRepository
from app.services import github_service

REPO_NAME_RE = re.compile(r"^[A-Za-z0-9_.\-]{1,255}$")
OWNER_RE = re.compile(r"^[A-Za-z0-9\-]{1,255}$")

BULK_CONCURRENCY = 5


def validate_payload(repositories):
    """Return cleaned [(owner, name), ...] or raise a 400 with a friendly message."""
    if not isinstance(repositories, list) or not repositories:
        raise ValueError("Select at least one repository.")
    if len(repositories) > current_app.config["BULK_MAX_ITEMS"]:
        raise ValueError(f"Select at most {current_app.config['BULK_MAX_ITEMS']} repositories at a time.")

    cleaned = []
    for item in repositories:
        if not isinstance(item, dict):
            raise ValueError("Each repository must be an object with owner and name.")
        owner = item.get("owner")
        name = item.get("name")
        if not isinstance(owner, str) or not isinstance(name, str):
            raise ValueError("Each repository must include a valid owner and name.")
        if not OWNER_RE.match(owner) or not REPO_NAME_RE.match(name):
            raise ValueError("Repository names contain invalid characters.")
        cleaned.append((owner, name))
    return cleaned


def _known_repo_set(user, access_token):
    lookup = github_service.current_snapshot(access_token)
    known = set()
    for repo in lookup.values():
        owner = (repo.get("owner", {}).get("login") or "").lower()
        name = (repo.get("name") or "").lower()
        if owner and name:
            known.add(f"{owner}/{name}")
    return known


def _apply_one(user_login, action, known, protected_keys, access_token, owner, name):
    key = f"{owner}/{name}".lower()

    if key in protected_keys:
        return {
            "owner": owner,
            "repository_name": name,
            "status": "skipped",
            "error_message": "Protected repository — remove protection before deleting.",
        }

    if key not in known or owner.lower() != user_login:
        return {
            "owner": owner,
            "repository_name": name,
            "status": "failed",
            "error_message": "Repository not found or you don't have permission to modify it.",
        }

    try:
        if action == "delete":
            github_service.delete_repo(owner, name, access_token)
        elif action == "archive":
            github_service.archive_repo(owner, name, access_token)
        else:
            raise ValueError(f"Unknown action: {action}")
        return {"owner": owner, "repository_name": name, "status": "success"}
    except Exception as exc:
        friendly = getattr(exc, "friendly", None) or str(exc) or (
            "GitHub couldn't complete this action."
        )
        return {
            "owner": owner,
            "repository_name": name,
            "status": "failed",
            "error_message": friendly,
        }


def run_bulk(user, action, repositories, config):
    """Execute a bulk archive or delete. `config` carries extra validation flags."""
    access_token = config["access_token"]
    try:
        targets = validate_payload(repositories)
    except ValueError as exc:
        raise ValueError(str(exc))

    protected_keys = ProtectedRepository.keys_for_user(user.id)
    known = _known_repo_set(user, access_token)
    user_login = user.username.lower()

    with ThreadPoolExecutor(max_workers=BULK_CONCURRENCY) as pool:
        futures = [
            pool.submit(
                _apply_one,
                user_login,
                action,
                known,
                protected_keys,
                access_token,
                owner,
                name,
            )
            for owner, name in targets
        ]
        results = [fut.result() for fut in futures]

    succeeded = sum(1 for r in results if r["status"] == "success")
    failed = sum(1 for r in results if r["status"] == "failed")
    skipped = sum(1 for r in results if r["status"] == "skipped")

    if failed:
        status = "success" if succeeded and not failed else ("partial" if succeeded else "failed")
    elif skipped:
        status = "partial" if succeeded else "failed"
    else:
        status = "success"

    log = ActivityLog.create(
        user.id,
        action,
        len(targets),
        status,
    )
    OperationItem.create_many(log.id, results)

    return {
        "action": action,
        "total": len(targets),
        "succeeded": succeeded,
        "failed": failed,
        "skipped": skipped,
        "status": status,
        "results": results,
    }