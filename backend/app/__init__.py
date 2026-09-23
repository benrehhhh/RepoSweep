import os

from flask import Flask, jsonify
from flask_cors import CORS

from config import get_config
from app.extensions import db, limiter
from app.utils.errors import GitHubAPIError, RepoSweepError


def create_app():
    app = Flask(__name__)
    app.config.from_object(get_config())

    CORS(
        app,
        resources={r"/api/*": {"origins": app.config["CORS_ORIGINS"], "supports_credentials": True}},
    )

    db.init_app(app)
    limiter.init_app(app)

    from app.routes import ALL_BLUEPRINTS

    for bp in ALL_BLUEPRINTS:
        app.register_blueprint(bp)

    register_error_handlers(app)

    @app.get("/api/health")
    @limiter.exempt
    def health():
        return jsonify({"status": "ok", "demo_mode": app.config["MOCK_MODE"]})

    @app.cli.command("init-db")
    def init_db():
        """Create all tables in the configured database."""
        db.create_all()
        print("Database tables created.")

    return app


def register_error_handlers(app):
    @app.errorhandler(RepoSweepError)
    def handle_reposweep_error(error):
        return jsonify({"error": error.message}), error.status_code

    @app.errorhandler(GitHubAPIError)
    def handle_github_error(error):
        return jsonify({"error": error.friendly}), error.status_code

    @app.errorhandler(404)
    def not_found(_error):
        return jsonify({"error": "The requested resource was not found."}), 404

    @app.errorhandler(405)
    def method_not_allowed(_error):
        return jsonify({"error": "The HTTP method is not allowed for this endpoint."}), 405

    @app.errorhandler(413)
    def payload_too_large(_error):
        return jsonify({"error": "The request payload is too large."}), 413

    @app.errorhandler(429)
    def rate_limited(_error):
        return (
            jsonify({"error": "Too many requests. Please slow down and try again shortly."}),
            429,
        )

    @app.errorhandler(500)
    def internal_error(_error):
        # Never expose a raw server traceback.
        return jsonify({"error": "Something went wrong on our end. Please try again."}), 500


def ensure_tables(app):
    """Create tables if they don't exist yet (convenience for local dev)."""
    with app.app_context():
        try:
            db.create_all()
        except Exception:
            # Database may not exist yet; CLI/setup instructions cover creation.
            pass