from typing import Annotated, AsyncGenerator

from fastapi import Depends
from supabase._async.client import AsyncClient

from app.db.supabase_client import db_dependency

DatabaseDep = Annotated[AsyncClient, Depends(db_dependency)]

__all__ = ["DatabaseDep"]
