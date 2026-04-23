from datetime import datetime
from pydantic import BaseModel, Field


class CaseCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255, description="Case name")
    description: str | None = Field(None, description="Case description")
    court: str | None = Field(None, max_length=255, description="Court name")
    case_number: str | None = Field(None, max_length=100, description="Court case number")


class CaseUpdate(BaseModel):
    name: str | None = Field(None, min_length=1, max_length=255)
    description: str | None = None
    court: str | None = None
    case_number: str | None = None
    status: str | None = Field(None, pattern="^(active|closed|archived)$")


class CaseResponse(BaseModel):
    id: int
    name: str
    description: str | None
    court: str | None
    case_number: str | None
    status: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class CaseListResponse(BaseModel):
    items: list[CaseResponse]
    total: int
