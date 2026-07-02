from fastapi import APIRouter

from app.api.v1.routes import projects, uploads, schemas, mappings, transformations, jobs

api_router = APIRouter()

api_router.include_router(projects.router, prefix="/projects", tags=["projects"])
api_router.include_router(uploads.router, prefix="/uploads", tags=["uploads"])
api_router.include_router(schemas.router, prefix="/schemas", tags=["schemas"])
api_router.include_router(mappings.router, prefix="/mappings", tags=["mappings"])
api_router.include_router(transformations.router, prefix="/transformations", tags=["transformations"])
api_router.include_router(jobs.router, prefix="/jobs", tags=["jobs"])
