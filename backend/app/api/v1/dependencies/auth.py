from fastapi import Depends

from app.core.security import AuthenticatedUser, get_current_user

# Re-export for ergonomic import in route modules.
# Route handlers use: current_user: AuthenticatedUser = Depends(require_user)
require_user = get_current_user

__all__ = ["AuthenticatedUser", "require_user"]
