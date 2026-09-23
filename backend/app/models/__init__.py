from app.extensions import mongo

__all__ = ["User", "ProtectedRepository", "ActivityLog", "OperationItem", "ensure_indexes"]


def ensure_indexes():
    """Idempotently create the indexes the app queries on (safe to call every boot)."""
    users = mongo.db["users"]
    users.create_index("username", unique=True)
    users.create_index("github_id")

    mongo.db["protected_repositories"].create_index(
        [("user_id", 1), ("owner", 1), ("repository_name", 1)], unique=True
    )
    mongo.db["activity_logs"].create_index([("user_id", 1), ("created_at", -1)])
    mongo.db["operation_items"].create_index("activity_log_id")