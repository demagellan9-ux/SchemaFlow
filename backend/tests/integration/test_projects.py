from unittest.mock import AsyncMock, MagicMock, patch
from uuid import uuid4

import pytest

from tests.conftest import make_auth_header

PROJECT_ROW = {
    "id": str(uuid4()),
    "user_id": "00000000-0000-0000-0000-000000000001",
    "name": "My Project",
    "description": None,
    "created_at": "2024-01-01T00:00:00+00:00",
    "updated_at": "2024-01-01T00:00:00+00:00",
}


def _mock_svc(row=None, rows=None):
    from app.services.project_service import ProjectService
    svc = MagicMock(spec=ProjectService)
    svc.list = AsyncMock(return_value={"items": rows or [], "next_cursor": None})
    svc.create = AsyncMock(return_value=row or PROJECT_ROW)
    svc.get = AsyncMock(return_value=row or PROJECT_ROW)
    svc.update = AsyncMock(return_value=row or PROJECT_ROW)
    svc.delete = AsyncMock(return_value=None)
    return svc


@pytest.fixture
def auth_headers():
    return make_auth_header()


def test_list_projects_returns_200(client, auth_headers):
    with patch("app.api.v1.routes.projects._svc", return_value=_mock_svc(rows=[PROJECT_ROW])):
        resp = client.get("/api/v1/projects", headers=auth_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert "items" in data
    assert "next_cursor" in data


def test_list_projects_requires_auth(client):
    resp = client.get("/api/v1/projects")
    assert resp.status_code == 401


def test_create_project_returns_201(client, auth_headers):
    with patch("app.api.v1.routes.projects._svc", return_value=_mock_svc()):
        resp = client.post(
            "/api/v1/projects",
            json={"name": "My Project"},
            headers=auth_headers,
        )
    assert resp.status_code == 201
    assert resp.json()["name"] == "My Project"


def test_create_project_rejects_empty_name(client, auth_headers):
    resp = client.post(
        "/api/v1/projects",
        json={"name": ""},
        headers=auth_headers,
    )
    assert resp.status_code == 422


def test_create_project_requires_auth(client):
    resp = client.post("/api/v1/projects", json={"name": "X"})
    assert resp.status_code == 401


def test_get_project_returns_200(client, auth_headers):
    project_id = PROJECT_ROW["id"]
    with patch("app.api.v1.routes.projects._svc", return_value=_mock_svc()):
        resp = client.get(f"/api/v1/projects/{project_id}", headers=auth_headers)
    assert resp.status_code == 200


def test_patch_project_returns_200(client, auth_headers):
    project_id = PROJECT_ROW["id"]
    with patch("app.api.v1.routes.projects._svc", return_value=_mock_svc()):
        resp = client.patch(
            f"/api/v1/projects/{project_id}",
            json={"name": "Renamed"},
            headers=auth_headers,
        )
    assert resp.status_code == 200


def test_delete_project_returns_204(client, auth_headers):
    project_id = PROJECT_ROW["id"]
    with patch("app.api.v1.routes.projects._svc", return_value=_mock_svc()):
        resp = client.delete(f"/api/v1/projects/{project_id}", headers=auth_headers)
    assert resp.status_code == 204
