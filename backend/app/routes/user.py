from flask import Blueprint, jsonify

from app.auth import login_required, require_user

bp = Blueprint("user", __name__, url_prefix="/api")


@bp.get("/user")
@login_required
def user_profile():
    user = require_user()
    return jsonify(user.to_dict())