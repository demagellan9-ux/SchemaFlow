import pytest
from fastapi.testclient import TestClient
from unittest.mock import AsyncMock, MagicMock, patch

from app.main import create_app
from app.core.config import Settings


@pytest.fixture(scope="session")
def test_settings() -> Settings:
    return Settings(
        app_env="testing",
        debug=True,
        supabase_url="http://localhost:54321",
        supabase_anon_key="test-anon-key",
        supabase_service_role_key="test-service-key",
        jwt_secret="test-secret-key-for-testing-only",
        internal_webhook_secret="test-webhook-secret",
        cors_origins=["http://localhost:3000"],
    )


@pytest.fixture(scope="session")
def app(test_settings):
    with patch("app.core.config.get_settings", return_value=test_settings):
        with patch("app.core.config.settings", test_settings):
            return create_app()


@pytest.fixture
def client(app):
    with TestClient(app, raise_server_exceptions=False) as c:
        yield c


@pytest.fixture
def mock_db():
    """Returns a mock AsyncClient for Supabase unit tests."""
    mock = AsyncMock()
    mock.table = MagicMock(return_value=mock)
    mock.select = MagicMock(return_value=mock)
    mock.insert = MagicMock(return_value=mock)
    mock.update = MagicMock(return_value=mock)
    mock.delete = MagicMock(return_value=mock)
    mock.eq = MagicMock(return_value=mock)
    mock.limit = MagicMock(return_value=mock)
    mock.execute = AsyncMock(return_value=MagicMock(data=[]))
    return mock


def make_auth_header(user_id: str = "00000000-0000-0000-0000-000000000001") -> dict:
    """Build a valid JWT Authorization header for tests."""
    from jose import jwt
    token = jwt.encode(
        {"sub": user_id, "email": "test@example.com"},
        "test-secret-key-for-testing-only",
        algorithm="HS256",
    )
    return {"Authorization": f"Bearer {token}"}
