import os
from functools import lru_cache
from typing import Literal

from sqlalchemy.engine import make_url

from pydantic import Field, field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

# Algorithms we accept. python-jose supports more, but we restrict to known-good
# symmetric/asymmetric ones to avoid surprises (e.g. the historical "alg=none" foot-gun).
ALLOWED_JWT_ALGORITHMS: frozenset[str] = frozenset(
    {"HS256", "HS384", "HS512", "RS256", "RS384", "RS512"}
)

INSECURE_DEFAULT_SECRETS: frozenset[str] = frozenset(
    {"change-me", "change-this-to-a-long-random-string", ""}
)


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
        hide_input_in_errors=True,
    )

    # ---- App ----
    app_name: str = Field(default="Financeiro")
    app_env: Literal["development", "staging", "production", "test"] = Field(
        default="development"
    )
    debug: bool = Field(default=False)
    log_level: Literal["DEBUG", "INFO", "WARNING", "ERROR"] = Field(default="INFO")

    # ---- Database ----
    database_url: str = Field(min_length=1)
    database_connect_timeout: int = Field(default=10, ge=1, le=60)
    database_ssl: bool = Field(default=False)
    database_ssl_ca: str | None = Field(default=None)

    # ---- Auth ----
    jwt_secret_key: str = Field(default="change-me", min_length=1)
    jwt_algorithm: str = Field(default="HS256")
    jwt_expire_minutes: int = Field(default=60, ge=1, le=60 * 24 * 30)

    # ---- CORS ----
    cors_origins: str = Field(default="http://localhost:5173,http://127.0.0.1:5173")

    # ---- Rate limiting ----
    rate_limit_enabled: bool = Field(default=True)
    rate_limit_default: str = Field(default="120/minute")
    rate_limit_auth: str = Field(default="10/minute")
    rate_limit_write: str = Field(default="60/minute")
    # Só confie em X-Forwarded-For quando o app estiver atrás de um proxy
    # reverso controlado (ex.: nginx do docker-compose). Em deploys diretos
    # esse header é forjável e permitiria bypass do rate limit por IP.
    trust_forwarded_for: bool = Field(default=False)

    rate_limit_storage_uri: str | None = Field(default=None)

    # ---- Cache ----
    cache_default_ttl_seconds: int = Field(default=60, ge=0)
    redis_url: str | None = Field(default=None)

    # ---- CSV import ----
    csv_import_max_rows: int = Field(default=5000, ge=1, le=100_000)
    csv_import_max_bytes: int = Field(default=2 * 1024 * 1024, ge=1024)

    @field_validator("jwt_algorithm")
    @classmethod
    def _check_algorithm(cls, value: str) -> str:
        if value not in ALLOWED_JWT_ALGORITHMS:
            raise ValueError(
                f"jwt_algorithm must be one of {sorted(ALLOWED_JWT_ALGORITHMS)}"
            )
        return value

    @model_validator(mode="after")
    def _enforce_production_secrets(self) -> "Settings":
        if self.app_env == "production":
            if self.jwt_secret_key in INSECURE_DEFAULT_SECRETS:
                raise ValueError(
                    "JWT_SECRET_KEY must be set to a strong, unique value in production."
                )
            if len(self.jwt_secret_key) < 32:
                raise ValueError(
                    "JWT_SECRET_KEY must be at least 32 characters in production."
                )
            if self.debug:
                raise ValueError("DEBUG must be false in production.")
            if "*" in self.cors_origins_list:
                raise ValueError(
                    "CORS_ORIGINS must be an explicit allow-list in production."
                )
        if os.environ.get("VERCEL") == "1":
            url = make_url(self.database_url)
            if url.drivername != "mysql+pymysql" or not url.host or url.host.lower() in {"mysql", "localhost", "127.0.0.1", "::1"}:
                raise ValueError("Vercel requires DATABASE_URL for an external MySQL host using mysql+pymysql.")
            if any("<" in str(value) or ">" in str(value) for value in (url.username, url.password, url.host, url.database)):
                raise ValueError("Replace DATABASE_URL placeholders with provider credentials.")
        return self

    @property
    def cors_origins_list(self) -> list[str]:
        if self.cors_origins.strip() == "*":
            return ["*"]
        return [
            origin.strip()
            for origin in self.cors_origins.split(",")
            if origin.strip()
        ]


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
