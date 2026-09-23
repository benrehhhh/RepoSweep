from datetime import datetime, timezone

from sqlalchemy import BigInteger

from app.extensions import db


def utcnow():
    return datetime.now(timezone.utc).replace(tzinfo=None)


# BIGINT auto-incrementing primary keys work on MySQL; SQLite needs INTEGER.
BigIntId = BigInteger().with_variant(db.Integer, "sqlite")


class User(db.Model):
    __tablename__ = "users"

    id = db.Column(BigIntId, primary_key=True, autoincrement=True)
    github_id = db.Column(db.BigInteger, nullable=True, index=True)
    username = db.Column(db.String(255), unique=True, nullable=False, index=True)
    display_name = db.Column(db.String(255), nullable=True)
    avatar_url = db.Column(db.Text, nullable=True)
    github_access_token = db.Column(db.Text, nullable=True)
    token_scope = db.Column(db.String(255), nullable=True)
    created_at = db.Column(db.DateTime, nullable=False, default=utcnow)
    updated_at = db.Column(db.DateTime, nullable=False, default=utcnow, onupdate=utcnow)

    protected_repositories = db.relationship(
        "ProtectedRepository", back_populates="user", cascade="all, delete-orphan"
    )
    activity_logs = db.relationship(
        "ActivityLog", back_populates="user", cascade="all, delete-orphan"
    )

    def to_dict(self):
        return {
            "id": self.id,
            "github_id": self.github_id,
            "username": self.username,
            "display_name": self.display_name,
            "avatar_url": self.avatar_url,
            "is_demo": self.github_id is None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }

    @classmethod
    def find_by_username(cls, username):
        return cls.query.filter_by(username=username).first()

    @classmethod
    def get_or_create(cls, username, **fields):
        user = cls.find_by_username(username)
        if user is None:
            user = cls(username=username, **fields)
            db.session.add(user)
            db.session.commit()
        return user


class ProtectedRepository(db.Model):
    __tablename__ = "protected_repositories"

    id = db.Column(BigIntId, primary_key=True, autoincrement=True)
    user_id = db.Column(BigIntId, db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    github_repo_id = db.Column(db.BigInteger, nullable=True)
    owner = db.Column(db.String(255), nullable=False)
    repository_name = db.Column(db.String(255), nullable=False)
    created_at = db.Column(db.DateTime, nullable=False, default=utcnow)

    __table_args__ = (
        db.UniqueConstraint("user_id", "owner", "repository_name", name="uq_user_owner_repo"),
    )

    user = db.relationship("User", back_populates="protected_repositories")

    @property
    def full_name(self):
        return f"{self.owner}/{self.repository_name}"

    def to_dict(self):
        return {
            "id": self.id,
            "owner": self.owner,
            "repository_name": self.repository_name,
            "full_name": self.full_name,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }

    @classmethod
    def key_for_user(cls, user_id, owner, name):
        return f"{owner}/{name}".lower()

    @classmethod
    def keys_for_user(cls, user_id):
        rows = cls.query.filter_by(user_id=user_id).all()
        return {cls.key_for_user(user_id, r.owner, r.repository_name) for r in rows}

    @classmethod
    def find_by_user(cls, user_id):
        return cls.query.filter_by(user_id=user_id).order_by(cls.created_at.desc()).all()