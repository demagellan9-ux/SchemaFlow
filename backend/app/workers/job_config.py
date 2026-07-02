from dataclasses import dataclass, field
from uuid import UUID


@dataclass(frozen=True)
class FileJobConfig:
    upload_id: UUID
    filename: str
    storage_path: str
    schema_id: UUID
    mapping_id: UUID


@dataclass(frozen=True)
class JobConfig:
    job_id: UUID
    project_id: UUID
    schema_id: UUID
    callback_url: str
    files: list[FileJobConfig] = field(default_factory=list)
