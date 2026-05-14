"""Cross-cutting infrastructure: logging setup, app-wide constants, and the
centralized settings re-export.

Anything that's used by multiple feature modules but isn't itself feature
code belongs here.
"""
from app.core.config import settings

__all__ = ["settings"]
