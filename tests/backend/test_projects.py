"""
Integration tests for /api/v1/projects routes.
Requires a running FastAPI instance with a Supabase local dev instance.
"""
import pytest

# TODO: Implement using httpx.AsyncClient with FastAPI test client
# Required test cases per CLAUDE.md:
#   - Happy path: create, list, get, delete
#   - Auth failure: 401 on all routes when no token provided
#   - Ownership: user A cannot access user B's projects (404)


@pytest.mark.asyncio
async def test_create_project_returns_201() -> None:
    # TODO: POST /api/v1/projects with valid body → 201 + project record
    pass


@pytest.mark.asyncio
async def test_create_project_requires_auth() -> None:
    # TODO: POST /api/v1/projects with no Authorization header → 401
    pass


@pytest.mark.asyncio
async def test_list_projects_returns_only_owned() -> None:
    # TODO: Create projects as user A and user B; list as user A → only user A's projects
    pass
