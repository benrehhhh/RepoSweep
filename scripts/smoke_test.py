"""End-to-end smoke test for the RepoSweep backend.

Runs against a temporary SQLite database so it works before MySQL is set up.
Verifies: demo login, session + CSRF, repo listing, protection, archive/delete
validation (wrong phrase -> 400, protected -> skipped), activity logs.

Usage:
    python scripts/smoke_test.py
"""

import os
import sys
import tempfile

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "backend"))

# Pass --mysql to run against the configured MySQL database (reads backend/.env
# when run from the backend/ directory). Default: throwaway SQLite file.
USE_MYSQL = "--mysql" in sys.argv
if not USE_MYSQL:
    os.environ["DATABASE_URL"] = f"sqlite:///{os.path.join(tempfile.gettempdir(), 'reposweep_smoke.db')}"
os.environ["MOCK_MODE"] = "true"

from app import create_app  # noqa: E402
from app.extensions import db  # noqa: E402

failures = []


def check(name, condition, detail=""):
    ok = bool(condition)
    print(f"  {'PASS' if ok else 'FAIL'}  {name}" + (f"  ({detail})" if detail and not ok else ""))
    if not ok:
        failures.append(name)


def main():
    app = create_app()
    with app.app_context():
        if USE_MYSQL:
            db.create_all()
        else:
            db.drop_all()
            db.create_all()

    client = app.test_client()

    print("health")
    r = client.get("/api/health")
    check("health ok", r.status_code == 200 and r.get_json()["status"] == "ok")

    print("auth")
    r = client.get("/api/auth/status")
    check("unauthenticated initially", r.get_json()["authenticated"] is False)

    r = client.post("/api/auth/demo")
    check("demo login works", r.status_code == 200 and r.get_json()["user"]["username"] == "demo-user")
    cookie = r.headers.get("Set-Cookie", "").split(";")[0]
    headers = {"Cookie": cookie}

    r = client.get("/api/auth/status", headers=headers)
    body = r.get_json()
    check("authenticated after login", body["authenticated"] is True)
    check("csrf token issued", bool(body.get("csrf_token")))
    csrf = body["csrf_token"]

    print("repositories")
    r = client.get("/api/repositories", headers=headers)
    body = r.get_json()
    check("repos fetched", body["total"] >= 45 and body["source"] == "demo")
    names = {repo["name"] for repo in body["repositories"]}
    check("mock has StudyLens-AI", "StudyLens-AI" in names)

    print("protected repositories")
    r = client.post(
        "/api/protected-repositories",
        json={"owner": "demo-user", "repository_name": "StudyLens-AI"},
        headers={**headers, "X-CSRF-Token": csrf},
    )
    check("protect repo", r.status_code == 201, r.get_json())

    r = client.post(
        "/api/protected-repositories",
        json={"owner": "demo-user", "repository_name": "not-a-real-repo-xyz"},
        headers={**headers, "X-CSRF-Token": csrf},
    )
    check("protect rejects unknown repo", r.status_code == 404)

    r = client.get("/api/protected-repositories", headers=headers)
    check("protected list", r.status_code == 200 and r.get_json()["total"] == 1)

    print("bulk archive")
    r = client.post(
        "/api/repositories/bulk/archive",
        json={"repositories": [
            {"owner": "demo-user", "name": "test-api"},
            {"owner": "demo-user", "name": "StudyLens-AI"},
        ]},
        headers={**headers, "X-CSRF-Token": csrf},
    )
    body = r.get_json()
    check("archive runs", r.status_code == 200, body)
    check("archive success count=1", body["succeeded"] == 1, body)
    check("protected archived -> skipped", body["skipped"] == 1, body)

    print("bulk delete validation")
    r = client.post(
        "/api/repositories/bulk/delete",
        json={"repositories": [{"owner": "demo-user", "name": "test-api"}]},
        headers={**headers, "X-CSRF-Token": csrf},
    )
    check("delete without phrase rejected", r.status_code == 400)

    r = client.post(
        "/api/repositories/bulk/delete",
        json={"repositories": [{"owner": "demo-user", "name": "test-api"}], "confirm_phrase": "delete"},
        headers={**headers, "X-CSRF-Token": csrf},
    )
    check("wrong case phrase rejected", r.status_code == 400)

    r = client.post(
        "/api/repositories/bulk/delete",
        json={
            "repositories": [
                {"owner": "demo-user", "name": "test-api"},
                {"owner": "demo-user", "name": "old-school-project"},
                {"owner": "demo-user", "name": "StudyLens-AI"},
            ],
            "confirm_phrase": "DELETE",
        },
        headers={**headers, "X-CSRF-Token": csrf},
    )
    body = r.get_json()
    check("delete with phrase runs", r.status_code == 200, body)
    check("delete success count=2", body["succeeded"] == 2, body)
    check("protected delete skipped", body["skipped"] == 1, body)

    r = client.get("/api/repositories", headers=headers)
    names = {repo["name"] for repo in r.get_json()["repositories"]}
    check("deleted repos gone from list", "test-api" not in names and "old-school-project" not in names)
    check("archived flag persisted", "StudyLens-AI" in names)

    print("activity + csrf checks")
    r = client.get("/api/activity", headers=headers)
    body = r.get_json()
    check("activity recorded", body["items"] and len(body["items"]) >= 2, body)
    actions = {item["action"] for item in body["items"]}
    check("activity has delete+archive", "delete" in actions and "archive" in actions)

    r = client.post(
        "/api/repositories/bulk/archive",
        json={"repositories": [{"owner": "demo-user", "name": "portfolio"}]},
        headers=headers,
    )
    check("missing csrf rejected", r.status_code == 403)

    print("user")
    r = client.get("/api/user", headers=headers)
    check("user profile", r.status_code == 200 and r.get_json()["username"] == "demo-user")

    r = client.post("/api/auth/logout", headers={**headers, "X-CSRF-Token": csrf})
    check("logout", r.status_code == 200)
    r = client.get("/api/auth/status", headers=headers)
    check("session cleared", r.get_json()["authenticated"] is False)

    print()
    if failures:
        print(f"SMOKE TEST FAILED: {len(failures)} failure(s): {', '.join(failures)}")
        sys.exit(1)
    print("SMOKE TEST PASSED — all checks green.")
    sys.exit(0)


if __name__ == "__main__":
    main()