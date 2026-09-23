from datetime import datetime, timezone

from app.extensions import db
from app.models.user import utcnow, BigIntId


class ActivityLog(db.Model):
    __tablename__ = "activity_logs"

    id = db.Column(BigIntId, primary_key=True, autoincrement=True)
    user_id = db.Column(
        BigIntId, db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    action = db.Column(db.String(32), nullable=False, index=True)
    repository_count = db.Column(db.Integer, nullable=False, default=0)
    status = db.Column(db.String(16), nullable=False, default="success")
    created_at = db.Column(db.DateTime, nullable=False, default=utcnow)

    user = db.relationship("User", back_populates="activity_logs")
    operation_items = db.relationship(
        "OperationItem", back_populates="activity_log", cascade="all, delete-orphan"
    )

    def to_dict(self, include_items=False):
        data = {
            "id": self.id,
            "action": self.action,
            "repository_count": self.repository_count,
            "status": self.status,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
        if include_items:
            data["items"] = [item.to_dict() for item in self.operation_items]
        return data


class OperationItem(db.Model):
    __tablename__ = "operation_items"

    id = db.Column(BigIntId, primary_key=True, autoincrement=True)
    activity_log_id = db.Column(
        BigIntId,
        db.ForeignKey("activity_logs.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    owner = db.Column(db.String(255), nullable=False)
    repository_name = db.Column(db.String(255), nullable=False)
    status = db.Column(db.String(16), nullable=False, default="success")
    error_message = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, nullable=False, default=utcnow)

    activity_log = db.relationship("ActivityLog", back_populates="operation_items")

    def to_dict(self):
        return {
            "id": self.id,
            "owner": self.owner,
            "repository_name": self.repository_name,
            "full_name": f"{self.owner}/{self.repository_name}",
            "status": self.status,
            "error_message": self.error_message,
        }