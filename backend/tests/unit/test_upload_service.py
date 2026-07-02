from unittest.mock import AsyncMock, MagicMock, patch
from uuid import UUID

import pytest

from app.core.exceptions import NotFoundError, ValidationError
from app.services.upload_service import UploadService

USER_ID = UUID("00000000-0000-0000-0000-000000000001")
PROJECT_ID = UUID("00000000-0000-0000-0000-000000000002")
UPLOAD_ID = UUID("00000000-0000-0000-0000-000000000003")

_UPLOAD_ROW = {
    "id": str(UPLOAD_ID),
    "project_id": str(PROJECT_ID),
    "user_id": str(USER_ID),
    "filename": "data.xlsx",
    "storage_path": f"{USER_ID}/{PROJECT_ID}/{UPLOAD_ID}.xlsx",
    "size_bytes": 1024,
    "status": "pending",
    "slice_data": None,
    "created_at": "2024-01-01T00:00:00+00:00",
    "updated_at": "2024-01-01T00:00:00+00:00",
}

_PROJECT_ROW = {"id": str(PROJECT_ID)}


def _make_db(rows_by_table=None):
    rows_by_table = rows_by_table or {}

    def table_factory(name):
        chain = MagicMock()
        data = rows_by_table.get(name, [])
        chain.execute = AsyncMock(return_value=MagicMock(data=data))
        chain.select.return_value = chain
        chain.insert.return_value = chain
        chain.update.return_value = chain
        chain.delete.return_value = chain
        chain.eq.return_value = chain
        chain.lt.return_value = chain
        chain.order.return_value = chain
        chain.limit.return_value = chain
        return chain

    mock = MagicMock()
    mock.table.side_effect = table_factory

    # Storage mock
    bucket = MagicMock()
    bucket.create_signed_upload_url.return_value = MagicMock(signed_url="https://storage.example.com/signed")
    mock.storage.from_.return_value = bucket

    return mock


@pytest.mark.asyncio
async def test_presign_rejects_unsupported_extension():
    db = _make_db({"projects": [_PROJECT_ROW]})
    svc = UploadService(db)
    with pytest.raises(ValidationError):
        await svc.presign(USER_ID, PROJECT_ID, "report.pdf", 1024, "application/pdf")


@pytest.mark.asyncio
async def test_presign_rejects_unknown_project():
    db = _make_db({"projects": []})
    svc = UploadService(db)
    with pytest.raises(NotFoundError):
        await svc.presign(USER_ID, PROJECT_ID, "data.xlsx", 1024, "application/octet-stream")


@pytest.mark.asyncio
async def test_presign_returns_signed_url():
    db = _make_db({"projects": [_PROJECT_ROW], "uploads": [_UPLOAD_ROW]})
    svc = UploadService(db)
    result = await svc.presign(USER_ID, PROJECT_ID, "data.xlsx", 1024, "application/octet-stream")
    assert "presigned_url" in result
    assert "upload_id" in result
    assert "storage_path" in result


@pytest.mark.asyncio
async def test_confirm_updates_status():
    db = _make_db({"uploads": [_UPLOAD_ROW]})
    svc = UploadService(db)
    row = await svc.confirm(USER_ID, UPLOAD_ID)
    assert row is not None


@pytest.mark.asyncio
async def test_confirm_raises_not_found():
    db = _make_db({"uploads": []})
    svc = UploadService(db)
    with pytest.raises(NotFoundError):
        await svc.confirm(USER_ID, UPLOAD_ID)


@pytest.mark.asyncio
async def test_get_raises_not_found():
    db = _make_db({"uploads": []})
    svc = UploadService(db)
    with pytest.raises(NotFoundError):
        await svc.get(USER_ID, UPLOAD_ID)


@pytest.mark.asyncio
async def test_get_slice_returns_slice_data():
    db = _make_db({"uploads": [_UPLOAD_ROW]})
    svc = UploadService(db)
    result = await svc.get_slice(USER_ID, UPLOAD_ID)
    assert result["upload_id"] == str(UPLOAD_ID)
    assert result["status"] == "pending"
    assert result["slice_data"] is None
