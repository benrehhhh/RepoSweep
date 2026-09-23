from datetime import datetime, timezone

from bson import ObjectId


def utcnow():
    return datetime.now(timezone.utc).replace(tzinfo=None)


def to_object_id(value):
    """Coerce an id (ObjectId or its string form) to ObjectId, or None."""
    if value is None:
        return None
    if isinstance(value, ObjectId):
        return value
    try:
        return ObjectId(str(value))
    except (TypeError, ValueError):
        return None


def iso(value):
    return value.isoformat() if value else None