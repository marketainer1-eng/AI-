from datetime import datetime
from pydantic import BaseModel, Field


class ReorderEvidenceItem(BaseModel):
    evidence_id: int
    new_sort_order: int = Field(..., ge=0)


class ReorderRequest(BaseModel):
    items: list[ReorderEvidenceItem] = Field(
        ..., min_length=1, description="List of evidence IDs with their new sort_order values"
    )
    description: str | None = None


class ChangeOperationResponse(BaseModel):
    id: int
    op_type: str
    sequence: int
    payload: dict
    status: str

    model_config = {"from_attributes": True}


class ChangeSetResponse(BaseModel):
    id: int
    case_id: int
    status: str
    description: str | None
    rolled_back_from_id: int | None
    created_at: datetime
    committed_at: datetime | None
    operations: list[ChangeOperationResponse] = []

    model_config = {"from_attributes": True}


class CommitRequest(BaseModel):
    pass


class CommitResponse(BaseModel):
    change_set_id: int
    status: str
    committed_at: datetime
    version_label: str
    files_renamed: int


class RollbackRequest(BaseModel):
    target_change_set_id: int = Field(..., description="ChangeSet ID to roll back to")


class RollbackResponse(BaseModel):
    new_change_set_id: int
    rolled_back_from_id: int
    status: str
    message: str
