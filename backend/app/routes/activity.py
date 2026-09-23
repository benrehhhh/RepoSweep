from flask import Blueprint, jsonify

from app import auth
from app.models.activity import ActivityLog

bp = Blueprint("activity", __name__, url_prefix="/api")


@bp.get("/activity")
@auth.login_required
def list_activity():
    user = auth.require_user()
    logs = (
        ActivityLog.query.filter_by(user_id=user.id)
        .order_by(ActivityLog.created_at.desc())
        .limit(200)
        .all()
    )
    return jsonify({"items": [log.to_dict(include_items=True) for log in logs]})