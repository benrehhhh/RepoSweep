"""Vercel serverless entry point for the RepoSweep Flask API.

Vercel's Python runtime calls `handler(event, context)` for every request to
`/api/*` (routed there by vercel.json). This module adapts Vercel's Lambda-style
event into a WSGI environ, runs the Flask app, and converts the WSGI response
back into Vercel's response shape.

Imports are resolved by prepending the backend/ directory to sys.path so the
existing `app` package and `config` module load unchanged.
"""

import base64
import os
import sys
from io import BytesIO

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "backend"))

from app import create_app  # noqa: E402

app = create_app()


def _to_body_bytes(body, base64_encoded):
    if body is None:
        return b""
    if base64_encoded:
        return base64.b64decode(body)
    return body.encode("utf-8") if isinstance(body, str) else body


def handler(event, _context):
    from urllib.parse import urlencode

    headers = {str(k).lower(): str(v) for k, v in (event.get("headers") or {}).items()}
    proto = (headers.get("x-forwarded-proto", "https") or "https").split(",")[0].strip()
    raw_query = event.get("rawQueryString") or urlencode(event.get("queryStringParameters") or {})
    body = _to_body_bytes(event.get("body"), event.get("isBase64Encoded", False))

    environ = {
        "REQUEST_METHOD": event.get("httpMethod", "GET"),
        "SCRIPT_NAME": "",
        "PATH_INFO": event.get("path", "/"),
        "QUERY_STRING": raw_query,
        "SERVER_NAME": headers.get("x-forwarded-host", headers.get("host", "localhost")),
        "SERVER_PORT": "443" if proto == "https" else "80",
        "SERVER_PROTOCOL": "HTTP/1.1",
        "wsgi.version": (1, 0),
        "wsgi.url_scheme": proto,
        "wsgi.input": BytesIO(body),
        "wsgi.errors": sys.stderr,
        "wsgi.multithread": True,
        "wsgi.multiprocess": False,
        "wsgi.run_once": False,
        "REMOTE_ADDR": (headers.get("x-forwarded-for", "") or "").split(",")[0].strip()
        or "127.0.0.1",
        "CONTENT_TYPE": headers.get("content-type", "application/json"),
        "CONTENT_LENGTH": str(len(body)),
    }
    for name, value in headers.items():
        key = "HTTP_" + name.upper().replace("-", "_")
        if key not in ("HTTP_CONTENT_TYPE", "HTTP_CONTENT_LENGTH"):
            environ[key] = value

    status_holder = {}
    response_headers = []

    def start_response(status, resp_headers, exc_info=None):
        status_holder["status"] = status
        response_headers.extend(resp_headers)

    raw = b""
    for chunk in app(environ, start_response):
        raw += chunk if isinstance(chunk, bytes) else chunk.encode("utf-8")

    status = status_holder.get("status", "200 OK")
    grouped = {}
    for name, value in response_headers:
        grouped.setdefault(name, []).append(value)

    return {
        "statusCode": int(status.split(" ", 1)[0]),
        "headers": {name: values[0] if len(values) == 1 else values for name, values in grouped.items()},
        "multiValueHeaders": grouped,
        "body": base64.b64encode(raw).decode("utf-8"),
        "isBase64Encoded": True,
    }