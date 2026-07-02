from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    debug: bool = False
    cors_origins: list[str] = ["http://localhost:3000"]

    supabase_url: str
    supabase_anon_key: str
    supabase_service_role_key: str

    # ETL runner strategy: subprocess | celery | http
    etl_runner: str = "subprocess"
    etl_http_url: str = ""

    jwt_secret: str
    jwt_algorithm: str = "HS256"


settings = Settings()  # type: ignore[call-arg]
