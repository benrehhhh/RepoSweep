"""MongoDB-backed user and protected-repository collections.

Keeps the same method signatures and JSON shapes the rest of the app and the
frontend rely on; only the storage engine changed (SQLAlchemy/MySQL -> PyMongo).
"""

from app.extensions import mongo
from app.models.base import iso, to_object_id, utcnow


class User:
    collection_name = "users"

    def __init__(self, doc):
        self._doc = doc

    @classmethod
    def collection(cls):
        return mongo.db[cls.collection_name]

    @property
    def id(self):
        return str(self._doc["_id"])

    @property
    def github_id(self):
        return self._doc.get("github_id")

    @github_id.setter
    def github_id(self, value):
        self._doc["github_id"] = value

    @property
    def username(self):
        return self._doc.get("username")

    @property
    def display_name(self):
        return self._doc.get("display_name")

    @property
    def avatar_url(self):
        return self._doc.get("avatar_url")

    @property
    def github_access_token(self):
        return self._doc.get("github_access_token")

    @github_access_token.setter
    def github_access_token(self, value):
        self._doc["github_access_token"] = value

    @property
    def token_scope(self):
        return self._doc.get("token_scope")

    @token_scope.setter
    def token_scope(self, value):
        self._doc["token_scope"] = value

    def save(self):
        self._doc["updated_at"] = utcnow()
        self.collection().replace_one({"_id": self._doc["_id"]}, self._doc)

    def to_dict(self):
        return {
            "id": self.id,
            "github_id": self.github_id,
            "username": self.username,
            "display_name": self.display_name,
            "avatar_url": self.avatar_url,
            "is_demo": self.github_id is None,
            "created_at": iso(self._doc.get("created_at")),
        }

    @classmethod
    def find_by_username(cls, username):
        doc = cls.collection().find_one({"username": username})
        return cls(doc) if doc else None

    @classmethod
    def find_by_id(cls, user_id):
        oid = to_object_id(user_id)
        if oid is None:
            return None
        doc = cls.collection().find_one({"_id": oid})
        return cls(doc) if doc else None

    @classmethod
    def get_or_create(cls, username, **fields):
        user = cls.find_by_username(username)
        if user is not None:
            return user
        doc = {
            "username": username,
            "github_id": None,
            "display_name": None,
            "avatar_url": None,
            "github_access_token": None,
            "token_scope": None,
            "created_at": utcnow(),
            "updated_at": utcnow(),
        }
        doc.update(fields)
        result = cls.collection().insert_one(doc)
        doc["_id"] = result.inserted_id
        return cls(doc)


class ProtectedRepository:
    collection_name = "protected_repositories"

    def __init__(self, doc):
        self._doc = doc

    @classmethod
    def collection(cls):
        return mongo.db[cls.collection_name]

    @property
    def id(self):
        return str(self._doc["_id"])

    @property
    def user_id(self):
        return str(self._doc["user_id"])

    @property
    def owner(self):
        return self._doc.get("owner")

    @property
    def repository_name(self):
        return self._doc.get("repository_name")

    @property
    def full_name(self):
        return f"{self.owner}/{self.repository_name}"

    def to_dict(self):
        return {
            "id": self.id,
            "owner": self.owner,
            "repository_name": self.repository_name,
            "full_name": self.full_name,
            "created_at": iso(self._doc.get("created_at")),
        }

    @classmethod
    def key_for_user(cls, user_id, owner, name):
        return f"{owner}/{name}".lower()

    @classmethod
    def keys_for_user(cls, user_id):
        oid = to_object_id(user_id)
        if oid is None:
            return set()
        rows = cls.collection().find({"user_id": oid})
        return {cls.key_for_user(user_id, r["owner"], r["repository_name"]) for r in rows}

    @classmethod
    def find_by_user(cls, user_id):
        oid = to_object_id(user_id)
        if oid is None:
            return []
        docs = cls.collection().find({"user_id": oid}).sort("created_at", -1)
        return [cls(doc) for doc in docs]

    @classmethod
    def find_by_id(cls, item_id):
        oid = to_object_id(item_id)
        if oid is None:
            return None
        doc = cls.collection().find_one({"_id": oid})
        return cls(doc) if doc else None

    @classmethod
    def create(cls, user_id, owner, repository_name):
        doc = {
            "user_id": to_object_id(user_id),
            "owner": owner,
            "repository_name": repository_name,
            "created_at": utcnow(),
        }
        result = cls.collection().insert_one(doc)
        doc["_id"] = result.inserted_id
        return cls(doc)

    @classmethod
    def delete_by_id(cls, item_id):
        oid = to_object_id(item_id)
        if oid is not None:
            cls.collection().delete_one({"_id": oid})