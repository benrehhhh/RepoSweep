"""WSGI entry point for production servers (Waitress, gunicorn, ...).

Run locally with Waitress:

    python -m waitress --listen=0.0.0.0:5000 wsgi:app

Set FLASK_ENV=production to enable production-safe settings
(e.g. Secure session cookies).
"""

import os

from config import get_config

os.environ.setdefault("FLASK_ENV", os.getenv("FLASK_ENV", "development"))

from app import create_app  # noqa: E402

app = create_app()