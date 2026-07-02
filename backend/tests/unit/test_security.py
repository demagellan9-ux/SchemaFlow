import pytest
from jose import jwt
from fastapi.testclient import TestClient

from tests.conftest import make_auth_header

JWT_SECRET = "test-secret-key-for-testing-only"


def test_protected_route_requires_auth(client):
    response = client.get("/api/v1/projects")
    assert response.status_code == 401


def test_protected_route_accepts_valid_jwt(client):
    headers = make_auth_header()
    # Projects route raises NotImplementedError at the service layer — that's expected.
    # We only verify auth passes (not 401).
    response = client.get("/api/v1/projects", headers=headers)
    assert response.status_code != 401


def test_expired_token_returns_401(client):
    import time
    token = jwt.encode(
        {"sub": "00000000-0000-0000-0000-000000000001", "exp": int(time.time()) - 1},
        JWT_SECRET,
        algorithm="HS256",
    )
    response = client.get("/api/v1/projects", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 401


def test_invalid_token_returns_401(client):
    response = client.get("/api/v1/projects", headers={"Authorization": "Bearer not.a.token"})
    assert response.status_code == 401


def test_missing_auth_header_returns_401(client):
    response = client.get("/api/v1/projects")
    assert response.status_code == 401
