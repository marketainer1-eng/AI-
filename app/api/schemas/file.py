"""
app/api/schemas/file.py
=======================
Request/Response Pydantic models for the SourceFile resource.

FileRole values: unknown | evidence_attachment | document
"""

from __future__ import annotations

from datetime import datetime
from pydantic import BaseModel, Field, field_validator


VALID_ROLES = ("unknown", "evidence_attachment", "document")


class SourceFileRoleUpdate(BaseModel):
    """PATCH /cases/{case_id}/files/{file_id}/role — change the role of a file."""

    role: str = Field(
        ...,
        description=f"FileRole: {' | '.join(VALID_ROLES)}",
    )

    @field_validator("role")
    @classmethod
    def validate_role(cls, v: str) -> str:
        if v not in VALID_ROLES:
            raise ValueError(f"role must be one of {VALID_ROLES}")
        return v


class SourceFileResponse(BaseModel):
    """Single source file representation."""

    id: int
    case_id: int
    original_filename: str = Field(description="Filename as provided by the uploader")
    stored_filename: str = Field(description="UUID-based immutable internal filename")
    storage_path: str
    file_size_bytes: int | None
    mime_type: str | None
    file_hash: str | None = Field(None, description="SHA-256 hex digest of the file content")
    role: str = Field(description="FileRole: unknown | evidence_attachment | document")
    created_at: datetime

    model_config = {"from_attributes": True}


class SourceFileListResponse(BaseModel):
    """Paginated list of source files for a case."""

    items: list[SourceFileResponse]
    total: int
    skip: int = 0
    limit: int = 100
