from datetime import datetime
from pydantic import BaseModel, Field


class SourceFileResponse(BaseModel):
    id: int
    case_id: int
    original_filename: str
    stored_filename: str
    storage_path: str
    file_size_bytes: int | None
    mime_type: str | None
    file_hash: str | None
    role: str
    created_at: datetime

    model_config = {"from_attributes": True}


class SourceFileListResponse(BaseModel):
    items: list[SourceFileResponse]
    total: int
