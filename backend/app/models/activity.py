"""MongoDB-backed activity log collections (activity_logs + operation_items)."""

from app.extensions import mongo
from app.models.base import iso, to_object_id, utcnow


class OperationItem:
    collection_name = "operation_items"

    def __init__(self, doc):
        self._doc = doc

    @classmethod
    def collection(cls):
        return mongo.db[cls.collection_name]

    def to_dict(self):
        return {
            "owner": self._doc.get("owner"),
            "repository_name": self._doc.get("repository_name"),
            "full_name": f"{self._doc.get('owner')}/{self._doc.get('repository_name')}",
            "status": self._doc.get("status"),
            "error_message": self._doc.get("error_message"),
        }

    @classmethod
    def create_many(cls, activity_log_id, items):
        docs = [
            {
                "activity_log_id": to_object_id(activity_log_id),
                "owner": item["owner"],
                "repository_name": item["repository_name"],
                "status": item["status"],
                "error_message": item.get("error_message"),
                "created_at": utcnow(),
            }
            for item in items
        ]
        if docs:
            cls.collection().insert_many(docs)

    @classmethod
    def for_activity(cls, activity_log_id):
        oid = to_object_id(activity_log_id)
        if oid is None:
            return []
        docs = cls.collection().find({"activity_log_id": oid})
        return [cls(doc) for doc in docs]


class ActivityLog:
    collection_name = "activity_logs"

    def __init__(self, doc):
        self._doc = doc

    @classmethod
    def collection(cls):
        return mongo.db[cls.collection_name]

    @property
    def id(self):
        return str(self._doc["_id"])

    def to_dict(self, include_items=False):
        data = {
            "id": self.id,
            "action": self._doc.get("action"),
            "repository_count": self._doc.get("repository_count", 0),
            "status": self._doc.get("status", "success"),
            "created_at": iso(self._doc.get("created_at")),
        }
        if include_items:
            data["items"] = [item.to_dict() for item in OperationItem.for_activity(self.id)]
        return data

    @classmethod
    def create(cls, user_id, action, repository_count, status):
        doc = {
            "user_id": to_object_id(user_id),
            "action": action,
            "repository_count": repository_count,
            "status": status,
            "created_at": utcnow(),
        }
        result = cls.collection().insert_one(doc)
        doc["_id"] = result.inserted_id
        return cls(doc)

    @classmethod
    def find_by_user(cls, user_id, limit=200):
        oid = to_object_id(user_id)
        if oid is None:
            return []
        docs = (
            cls.collection()
            .find({"user_id": oid})
            .sort("created_at", -1)
            .limit(limit)
        )
        return [cls(doc) for doc in docs]