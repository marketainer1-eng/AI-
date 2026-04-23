"""
app/api/schemas/evidence.py
============================
Request/Response Pydantic models for Evidence and EvidenceFileLink resources.

EvidenceParty values: plaintiff (갑) | defendant (을)

rendered_number is a computed property (not stored in DB):
  plaintiff → 갑 제{sort_order}호증
  defendant → 을 제{sort_order}호증
"""

from __future__ import annotations

from datetime import datetime
from pydantic import BaseModel, Field, field_validator


VALID_PARTIES = ("plaintiff", "defendant")


class EvidenceCreate(BaseModel):
    """POST /cases/{case_id}/evidences — create a new evidence record."""

    party: str = Field(
        "plaintiff",
        description="EvidenceParty: plaintiff (갑) | defendant (을)",
    )
    label: str = Field(
        ...,
        min_length=1,
        max_length=512,
        description="Human-readable evidence description (e.g. '계약서 사본')",
        examples=["계약서 사본"],
    )
    description: str | None = Field(None, description="Additional detail or notes")
    sort_order: int = Field(
        0,
        ge=0,
        description=(
            "Ordering within (case, party). "
            "Rendered number = rank by sort_order (1-based). "
            "If 0, auto-assigned to max_existing + 1."
        ),
    )
    source_file_ids: list[int] = Field(
        default_factory=list,
        description="SourceFile IDs to attach as backing files (in display order)",
    )

    @field_validator("party")
    @classmethod
    def validate_party(cls, v: str) -> str:
        if v not in VALID_PARTIES:
            raise ValueError(f"party must be one of {VALID_PARTIES}")
        return v


class EvidenceUpdate(BaseModel):
    """PATCH /cases/{case_id}/evidences/{evidence_id} — partial update."""

    label: str | None = Field(None, min_length=1, max_length=512)
    description: str | None = None
    sort_order: int | None = Field(None, ge=1, description="New sort position (1-based)")
    is_active: bool | None = Field(
        None, description="Soft-delete flag (False = deactivated)"
    )


class EvidenceFileLinkCreate(BaseModel):
    """Body for manually attaching a single file to an evidence record."""

    source_file_id: int = Field(..., gt=0)
    file_order: int = Field(0, ge=0, description="Display order within the evidence")


class EvidenceFileLinkResponse(BaseModel):
    id: int
    evidence_id: int
    source_file_id: int
    file_order: int = Field(description="Display order within the evidence")

    model_config = {"from_attributes": True}


class EvidenceResponse(BaseModel):
    """Full evidence representation returned by the API."""

    id: int
    case_id: int
    party: str = Field(description="EvidenceParty: plaintiff | defendant")
    label: str
    description: str | None
    sort_order: int
    is_active: bool
    rendered_number: str = Field(
        "",
        description=(
            "Computed display number (e.g. '갑 제1호증'). "
            "Derived from party + 1-based rank by sort_order. Not stored in DB."
        ),
    )
    file_links: list[EvidenceFileLinkResponse] = []
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}

    @classmethod
    def from_orm_with_number(cls, evidence: object) -> "EvidenceResponse":
        """Build response with computed rendered_number from ORM object."""
        data = cls.model_validate(evidence)
        party_char = "갑" if data.party == "plaintiff" else "을"
        data.rendered_number = f"{party_char} 제{data.sort_order}호증"
        return data


class EvidenceListResponse(BaseModel):
    """Paginated list of evidences for a case."""

    items: list[EvidenceResponse]
    total: int
    skip: int = 0
    limit: int = 100
