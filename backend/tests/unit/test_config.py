import pytest
from pydantic import ValidationError

from app.core.config import Settings


def test_settings_http_runner_requires_url():
    with pytest.raises(ValidationError):
        Settings(
            supabase_url="http://localhost:54321",
            supabase_anon_key="key",
            supabase_service_role_key="key",
            jwt_secret="secret",
            etl_runner="http",
            etl_http_url="",
        )


def test_settings_subprocess_runner_does_not_require_url():
    s = Settings(
        supabase_url="http://localhost:54321",
        supabase_anon_key="key",
        supabase_service_role_key="key",
        jwt_secret="secret",
        etl_runner="subprocess",
    )
    assert s.etl_runner == "subprocess"


def test_settings_is_production_false_by_default():
    s = Settings(
        supabase_url="http://localhost:54321",
        supabase_anon_key="key",
        supabase_service_role_key="key",
        jwt_secret="secret",
    )
    assert s.is_production is False


def test_settings_docs_enabled_in_development():
    s = Settings(
        app_env="development",
        supabase_url="http://localhost:54321",
        supabase_anon_key="key",
        supabase_service_role_key="key",
        jwt_secret="secret",
    )
    assert s.docs_enabled is True


def test_settings_docs_disabled_in_production():
    s = Settings(
        app_env="production",
        debug=False,
        supabase_url="http://localhost:54321",
        supabase_anon_key="key",
        supabase_service_role_key="key",
        jwt_secret="secret",
    )
    assert s.docs_enabled is False
