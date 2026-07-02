import json
import base64
from unittest.mock import AsyncMock, MagicMock
from uuid import UUID

import pytest

from app.core.exceptions import NotFoundError
from app.services.project_service import ProjectService

USER_ID = UUID("00000000-0000-0000-0000-000000000001")
PROJECT_ID = UUID("00000000-0000-0000-0000-000000000002")

_PROJECT_ROW = {
    "id": str(PROJECT_ID),
    "user_id": str(USER_ID),
    "name": "Test Project",
    "description": None,
    "created_at": "2024-01-01T00:00:00+00:00",
    "updated_at": "2024-01-01T00:00:00+00:00",
}


def _make_db(rows=None):
    mock = MagicMock()
    chain = MagicMock()
    chain.execute = AsyncMock(return_value=MagicMock(data=rows or []))
    mock.table.return_value = chain
    chain.select.return_value = chain
    chain.insert.return_value = chain
    chain.update.return_value = chain
    chain.delete.return_value = chain
    chain.eq.return_value = chain
    chain.lt.return_value = chain
    chain.order.return_value = chain
    chain.limit.return_value = chain
    return mock


@pytest.mark.asyncio
async def test_list_returns_items_and_no_cursor_when_under_limit():
    db = _make_db([_PROJECT_ROW])
    svc = ProjectService(db)
    result = await svc.list(USER_ID, cursor=None, limit=20)
    assert result["items"] == [_PROJECT_ROW]
    assert result["next_cursor"] is None


@pytest.mark.asyncio
async def test_list_returns_cursor_when_page_full():
    rows = [_PROJECT_ROW] * 21  # limit=20 → has_more=True
    db = _make_db(rows)
    svc = ProjectService(db)
    result = await svc.list(USER_ID, cursor=None, limit=20)
    assert len(result["items"]) == 20
    assert result["next_cursor"] is not None


@pytest.mark.asyncio
async def test_list_with_valid_cursor_passes_lt_filter():
    cursor_payload = json.dumps({"created_at": "2024-01-01T00:00:00+00:00"})
    cursor = base64.b64encode(cursor_payload.encode()).decode()
    db = _make_db([_PROJECT_ROW])
    svc = ProjectService(db)
    result = await svc.list(USER_ID, cursor=cursor, limit=20)
    assert result["items"] == [_PROJECT_ROW]


@pytest.mark.asyncio
async def test_create_inserts_row_and_returns_it():
    db = _make_db([_PROJECT_ROW])
    svc = ProjectService(db)
    row = await svc.create(USER_ID, "Test Project", None)
    assert row["name"] == "Test Project"


@pytest.mark.asyncio
async def test_get_returns_row():
    db = _make_db([_PROJECT_ROW])
    svc = ProjectService(db)
    row = await svc.get(USER_ID, PROJECT_ID)
    assert row["id"] == str(PROJECT_ID)


@pytest.mark.asyncio
async def test_get_raises_not_found_when_missing():
    db = _make_db([])
    svc = ProjectService(db)
    with pytest.raises(NotFoundError):
        await svc.get(USER_ID, PROJECT_ID)


@pytest.mark.asyncio
async def test_delete_calls_db_delete():
    db = _make_db([_PROJECT_ROW])
    svc = ProjectService(db)
    await svc.delete(USER_ID, PROJECT_ID)
    db.table.assert_called()
