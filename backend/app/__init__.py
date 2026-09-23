import os

from flask import Flask, jsonify, send_from_directory
from flask_cors import CORS

from config import get_config
from app.extensions import limiter, mongo
from app.utils.errors import GitHubAPIError, RepoSweepError


def create_app():
    app = Flask(__name__)
    app.config.from_object(get_config())

    CORS(
        app,
        resources={r"/api/*": {"origins": app.config["CORS_ORIGINS"], "supports_credentials": True}},
    )

    mongo.init_app(app)
    limiter.init_app(app)

    from app.routes import ALL_BLUEPRINTS

    for bp in ALL_BLUEPRINTS:
        app.register_blueprint(bp)

    register_error_handlers(app)
    register_spa_routes(app)

    @app.get("/api/health")
    @limiter.exempt
    def health():
        return jsonify({"status": "ok", "demo_mode": app.config["MOCK_MODE"]})

    @app.cli.command("init-db")
    def init_db():
        """Create the MongoDB indexes (idempotent)."""
        from app.models import ensure_indexes

        ensure_indexes()
        print("MongoDB indexes created.")

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


def register_spa_routes(app):
    """Serve the built frontend from this app when it exists.

    Uses the same origin as the API so the SPA (which calls relative /api paths)
    and the session cookies work over a single domain. Registering after the
    /api blueprints keeps API routes winning over the SPA catch-all.

    On Vercel this is unused: the static SPA and /api function are both served
    by Vercel itself (see vercel.json). It stays for local production builds
    where Flask serves dist/ directly.
    """
    dist = os.path.abspath(app.config.get("FRONTEND_DIST", "../frontend/dist"))
    index_path = os.path.join(dist, "index.html")
    if not os.path.isfile(index_path):
        # Not built yet (local dev uses `vite dev`) — keep the API-only server.
        return

    app.config["FRONTEND_DIST"] = dist

    @app.get("/")
    def spa_index():
        return send_from_directory(dist, "index.html")

    @app.get("/<path:path>")
    def spa_routes(path):
        if path.startswith("api/") or path.startswith("static/"):
            return jsonify({"error": "The requested resource was not found."}), 404
        file_path = os.path.join(dist, path)
        if os.path.isfile(file_path):
            return send_from_directory(dist, path)
        return send_from_directory(dist, "index.html")