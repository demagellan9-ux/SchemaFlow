from unittest.mock import AsyncMock, patch

import pytest


@pytest.fixture(autouse=True)
def _patch_db(mock_db):
    with patch("app.db.supabase_client.get_service_client", return_value=mock_db):
        yield


def test_health_returns_ok(client):
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_health_includes_version(client):
    response = client.get("/api/v1/health")
    assert "version" in response.json()


def test_ready_returns_ok_when_db_reachable(client, mock_db):
    mock_db.execute = AsyncMock(return_value=AsyncMock(data=[]))
    response = client.get("/api/v1/ready")
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "ok"
    assert body["checks"]["database"] == "ok"


def test_ready_returns_503_when_db_unreachable(client, mock_db):
    mock_db.execute = AsyncMock(side_effect=Exception("connection refused"))
    response = client.get("/api/v1/ready")
    assert response.status_code == 503
    body = response.json()
    assert body["status"] == "degraded"
    assert body["checks"]["database"] == "unreachable"
