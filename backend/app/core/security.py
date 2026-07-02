from dataclasses import dataclass
from uuid import UUID

from fastapi import HTTPException, Security, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt

from app.core.config import settings

bearer_scheme = HTTPBearer()


@dataclass(frozen=True)
class AuthenticatedUser:
    user_id: UUID
    email: str


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Security(bearer_scheme),
) -> AuthenticatedUser:
    # TODO: Validate against Supabase JWKS endpoint for production
    try:
        payload = jwt.decode(
            credentials.credentials,
            settings.jwt_secret,
            algorithms=[settings.jwt_algorithm],
        )
        user_id = payload.get("sub")
        email = payload.get("email", "")
        if user_id is None:
            raise ValueError("Missing sub claim")
        return AuthenticatedUser(user_id=UUID(user_id), email=email)
    except (JWTError, ValueError) as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        ) from exc
