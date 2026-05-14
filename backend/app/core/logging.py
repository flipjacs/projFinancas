"""Centralized logging setup.

Uses stdlib logging with a JSON-friendly key=value format. Avoids structured
logging libraries to keep the dependency footprint small.
"""
import logging
import sys

from app.core.config import settings

LOG_FORMAT = (
    "%(asctime)s level=%(levelname)s logger=%(name)s "
    "request_id=%(request_id)s msg=%(message)s"
)


class _RequestIdFilter(logging.Filter):
    """Ensure every record has a request_id field, even when emitted
    outside an HTTP request context (startup, background jobs, tests)."""

    def filter(self, record: logging.LogRecord) -> bool:
        if not hasattr(record, "request_id"):
            record.request_id = "-"
        return True


def configure_logging() -> None:
    root = logging.getLogger()
    if getattr(root, "_app_configured", False):  # idempotent for tests / reloads
        return

    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(logging.Formatter(LOG_FORMAT))
    handler.addFilter(_RequestIdFilter())

    root.handlers = [handler]
    root.setLevel(settings.log_level)

    # Quiet third-party noise unless we're in DEBUG.
    if not settings.debug:
        logging.getLogger("uvicorn.access").setLevel("WARNING")
        logging.getLogger("sqlalchemy.engine").setLevel("WARNING")

    root._app_configured = True  # type: ignore[attr-defined]
