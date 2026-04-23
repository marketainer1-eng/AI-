"""
app/api/schemas/reference.py
============================
Request/Response Pydantic models for the Reference resource.

A Reference links one DocumentAnchor to one Evidence.

ReferenceStatus values: active | superseded

Business rules:
- Each DocumentAnchor can have at most ONE active Reference at a time.
- Creating a new Reference for an anchor that already has one supersedes the old one.
- Deleting (unlinking) a Reference sets its status to 'superseded' and
  resets the anchor status to 'unlinked'.
"""

from __future__ import annotations

from datetime import datetime
from pydantic import BaseModel, Field


class ReferenceCreate(BaseModel):
    """POST /references — link a DocumentAnchor to an Evidence."""

    anchor_id: int = Field(
        ...,
        gt=0,
        description="DocumentAnchor ID obtained from the parse-placeholders response",
    )
    evidence_id: int = Field(
        ...,
        gt=0,
        description="Evidence ID to associate with this placeholder",
    )
    note: str | None = Field(
        None,
        max_length=1000,
        description="Optional note explaining this reference link",
    )


class ReferenceUnlinkRequest(BaseModel):
    """Optional body for DELETE /references/{reference_id}."""

    note: str | None = Field(None, description="Reason for unlinking (stored in note)")


class ReferenceResponse(BaseModel):
    """Full reference representation, with denormalized context fields."""

    id: int
    anchor_id: int
    evidence_id: int
    status: str = Field(description="ReferenceStatus: active | superseded")
    note: str | None

    # Denormalized fields — populated by the service, not stored in DB
    placeholder_text: str | None = Field(
        None, description="Placeholder text from the linked DocumentAnchor"
    )
    evidence_label: str | None = Field(
        None, description="Label of the linked Evidence"
    )
    rendered_number: str | None = Field(
        None,
        description=(
            "Computed evidence number at response time "
            "(e.g. '갑 제1호증'). Derived from sort_order."
        ),
    )
    created_at: datetime

    model_config = {"from_attributes": True}


class ReferenceListResponse(BaseModel):
    """Paginated list of references."""

    items: list[ReferenceResponse]
    total: int
    skip: int = 0
    limit: int = 100
