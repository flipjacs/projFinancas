"""Shared connection options for API requests and Alembic migrations."""
import ssl

from sqlalchemy.engine import make_url

from app.core.config import Settings


def connection_options(config: Settings) -> dict:
    if make_url(config.database_url).drivername != "mysql+pymysql":
        return {}
    options = {"connect_timeout": config.database_connect_timeout}
    if config.database_ssl or config.database_ssl_ca:
        # Validate both certificate authority and host name. Never disable TLS verification.
        options["ssl"] = ssl.create_default_context(cadata=config.database_ssl_ca or None)
    return options
