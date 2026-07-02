from unittest.mock import AsyncMock, MagicMock, patch
from uuid import uuid4

import pytest

from tests.conftest import make_auth_header

UPLOAD_ID = str(uuid4())
PROJECT_ID = str(uuid4())

UPLOAD_ROW = {
    "id": UPLOAD_ID,
    "project_id": PROJECT_ID,
    "user_id": "00000000-0000-0000-0000-000000000001",
    "filename": "data.xlsx",
    "storage_path": f"user-id/{PROJECT_ID}/{UPLOAD_ID}.xlsx",
    "size_bytes": 2048,
    "status": "pending",
    "slice_data": None,
    "created_at": "2024-01-01T00:00:00+00:00",
    "updated_at": "2024-01-01T00:00:00+00:00",
}

PRESIGN_RESULT = {
    "upload_id": UPLOAD_ID,
    "presigned_url": "https://storage.example.com/signed",
    "storage_path": f"user-id/{PROJECT_ID}/{UPLOAD_ID}.xlsx",
    "expires_in": 3600,
}


def _mock_svc():
    from app.services.upload_service import UploadService
    svc = MagicMock(spec=UploadService)
    svc.presign = AsyncMock(return_value=PRESIGN_RESULT)
    svc.confirm = AsyncMock(return_value=UPLOAD_ROW)
    svc.list = AsyncMock(return_value={"items": [UPLOAD_ROW], "next_cursor": None})
    svc.get = AsyncMock(return_value=UPLOAD_ROW)
    svc.get_slice = AsyncMock(return_value={"upload_id": UPLOAD_ID, "status": "pending", "slice_data": None})
    return svc


@pytest.fixture
def auth_headers():
    return make_auth_header()


def test_presign_returns_201(client, auth_headers):
    with patch("app.api.v1.routes.uploads._svc", return_value=_mock_svc()):
        resp = client.post(
            "/api/v1/uploads/presign",
            json={
                "project_id": PROJECT_ID,
                "filename": "data.xlsx",
                "size_bytes": 2048,
                "content_type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            },
            headers=auth_headers,
        )
    assert resp.status_code == 201
    body = resp.json()
    assert "upload_id" in body
    assert "presigned_url" in body


def test_presign_requires_auth(client):
    resp = client.post(
        "/api/v1/uploads/presign",
        json={"project_id": PROJECT_ID, "filename": "data.xlsx", "size_bytes": 100},
    )
    assert resp.status_code == 401


def test_presign_rejects_missing_filename(client, auth_headers):
    resp = client.post(
        "/api/v1/uploads/presign",
        json={"project_id": PROJECT_ID, "size_bytes": 100},
        headers=auth_headers,
    )
    assert resp.status_code == 422


def test_confirm_returns_200(client, auth_headers):
    with patch("app.api.v1.routes.uploads._svc", return_value=_mock_svc()):
        resp = client.post(f"/api/v1/uploads/{UPLOAD_ID}/confirm", headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json()["status"] == "pending"


def test_list_uploads_returns_200(client, auth_headers):
    with patch("app.api.v1.routes.uploads._svc", return_value=_mock_svc()):
        resp = client.get(f"/api/v1/uploads?project_id={PROJECT_ID}", headers=auth_headers)
    assert resp.status_code == 200
    assert "items" in resp.json()


def test_get_upload_returns_200(client, auth_headers):
    with patch("app.api.v1.routes.uploads._svc", return_value=_mock_svc()):
        resp = client.get(f"/api/v1/uploads/{UPLOAD_ID}", headers=auth_headers)
    assert resp.status_code == 200


def test_get_slice_returns_200(client, auth_headers):
    with patch("app.api.v1.routes.uploads._svc", return_value=_mock_svc()):
        resp = client.get(f"/api/v1/uploads/{UPLOAD_ID}/slice", headers=auth_headers)
    assert resp.status_code == 200
