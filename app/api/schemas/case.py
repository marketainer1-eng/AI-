"""
app/api/schemas/case.py
=======================
Request/Response Pydantic models for the Case resource.

CaseStatus values: active | closed
"""

from __future__ import annotations

from datetime import datetime
from pydantic import BaseModel, Field, field_validator


VALID_STATUSES = ("active", "closed")


class CaseCreate(BaseModel):
    """POST /cases — create a new litigation case."""

    name: str = Field(
        ...,
        min_length=1,
        max_length=255,
        description="Human-readable case name (e.g. '서울고법 2024나12345 손해배상')",
        examples=["손해배상 청구 사건"],
    )
    description: str | None = Field(None, description="Free-text case description")
    court: str | None = Field(
        None,
        max_length=255,
        description="Court name (e.g. '서울중앙지방법원')",
        examples=["서울중앙지방법원"],
    )
    case_number: str | None = Field(
        None,
        max_length=100,
        description="Official docket number (e.g. '2024가합12345')",
        examples=["2024가합12345"],
    )


class CaseUpdate(BaseModel):
    """PATCH /cases/{case_id} — partial update (all fields optional)."""

    name: str | None = Field(None, min_length=1, max_length=255)
    description: str | None = None
    court: str | None = None
    case_number: str | None = None
    status: str | None = Field(
        None,
        description=f"CaseStatus: {' | '.join(VALID_STATUSES)}",
    )

    @field_validator("status")
    @classmethod
    def validate_status(cls, v: str | None) -> str | None:
        if v is not None and v not in VALID_STATUSES:
            raise ValueError(f"status must be one of {VALID_STATUSES}")
        return v


class CaseResponse(BaseModel):
    """Single case representation returned by the API."""

    id: int
    name: str
    description: str | None
    court: str | None
    case_number: str | None
    status: str = Field(description="CaseStatus: active | closed")
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class CaseListResponse(BaseModel):
    """Paginated list of cases."""

    items: list[CaseResponse]
    total: int
    skip: int = 0
    limit: int = 100
