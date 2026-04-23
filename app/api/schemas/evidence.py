from datetime import datetime
from pydantic import BaseModel, Field


class EvidenceCreate(BaseModel):
    party: str = Field(
        "plaintiff",
        pattern="^(plaintiff|defendant)$",
        description="plaintiff=갑, defendant=을",
    )
    label: str = Field(..., min_length=1, max_length=512, description="Evidence label")
    description: str | None = None
    sort_order: int = Field(0, ge=0, description="Sort order (determines rendered number)")
    source_file_ids: list[int] = Field(
        default_factory=list, description="SourceFile IDs to attach"
    )


class EvidenceUpdate(BaseModel):
    label: str | None = Field(None, min_length=1, max_length=512)
    description: str | None = None
    sort_order: int | None = Field(None, ge=0)
    is_active: bool | None = None


class EvidenceFileLinkResponse(BaseModel):
    id: int
    evidence_id: int
    source_file_id: int
    file_order: int

    model_config = {"from_attributes": True}


class EvidenceResponse(BaseModel):
    id: int
    case_id: int
    party: str
    label: str
    description: str | None
    sort_order: int
    is_active: bool
    created_at: datetime
    updated_at: datetime
    file_links: list[EvidenceFileLinkResponse] = []

    model_config = {"from_attributes": True}


class EvidenceListResponse(BaseModel):
    items: list[EvidenceResponse]
    total: int
