from functools import lru_cache
from typing import Literal

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )

    # ── Application ──────────────────────────────────────────────────────────
    app_env: Literal["development", "testing", "production"] = "development"
    debug: bool = False
    log_level: str = "INFO"

    # ── Supabase ─────────────────────────────────────────────────────────────
    supabase_url: str
    supabase_anon_key: str
    supabase_service_role_key: str

    # ── Auth ─────────────────────────────────────────────────────────────────
    jwt_secret: str
    jwt_algorithm: str = "HS256"

    # ── CORS ─────────────────────────────────────────────────────────────────
    cors_origins: list[str] = Field(default=["http://localhost:3000"])

    # ── ETL Runner ───────────────────────────────────────────────────────────
    # Strategy is swappable without code changes — only this env var changes.
    etl_runner: Literal["subprocess", "http", "celery"] = "subprocess"
    etl_http_url: str = ""

    # ── Internal security ─────────────────────────────────────────────────────
    # Shared secret for the ETL → backend webhook. Never exposed to clients.
    internal_webhook_secret: str = ""

    @field_validator("etl_http_url")
    @classmethod
    def http_url_required_for_http_runner(cls, v: str, info) -> str:
        if info.data.get("etl_runner") == "http" and not v:
            raise ValueError("ETL_HTTP_URL is required when ETL_RUNNER=http")
        return v

    @property
    def is_production(self) -> bool:
        return self.app_env == "production"

    @property
    def docs_enabled(self) -> bool:
        return not self.is_production or self.debug


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()  # type: ignore[call-arg]


settings = get_settings()
