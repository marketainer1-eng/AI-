from datetime import datetime
from pydantic import BaseModel, Field


class ReferenceCreate(BaseModel):
    anchor_id: int = Field(..., description="DocumentAnchor ID")
    evidence_id: int = Field(..., description="Evidence ID to link")
    note: str | None = None


class ReferenceResponse(BaseModel):
    id: int
    anchor_id: int
    evidence_id: int
    status: str
    note: str | None
    created_at: datetime

    model_config = {"from_attributes": True}
