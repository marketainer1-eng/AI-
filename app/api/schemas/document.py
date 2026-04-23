"""
app/api/schemas/document.py
============================
Request/Response Pydantic models for Document and DocumentAnchor resources.

DocType values    : main_brief | exhibit_list | other
ParseStatus values: pending | parsed | error
AnchorStatus values: unlinked | linked
"""

from __future__ import annotations

from datetime import datetime
from pydantic import BaseModel, Field, field_validator


VALID_DOC_TYPES = ("main_brief", "exhibit_list", "other")
VALID_PARSE_STATUSES = ("pending", "parsed", "error")
VALID_ANCHOR_STATUSES = ("unlinked", "linked")


class DocumentCreate(BaseModel):
    """POST /cases/{case_id}/documents — register an already-uploaded DOCX as a Document."""

    source_file_id: int = Field(
        ...,
        gt=0,
        description="ID of the already-uploaded SourceFile (must be a .docx file)",
    )
    title: str = Field(
        ...,
        min_length=1,
        max_length=512,
        description="Display title (e.g. '준비서면 제1호')",
        examples=["준비서면 제1호"],
    )
    doc_type: str = Field(
        "main_brief",
        description=f"DocType: {' | '.join(VALID_DOC_TYPES)}",
    )

    @field_validator("doc_type")
    @classmethod
    def validate_doc_type(cls, v: str) -> str:
        if v not in VALID_DOC_TYPES:
            raise ValueError(f"doc_type must be one of {VALID_DOC_TYPES}")
        return v


class DocumentAnchorResponse(BaseModel):
    """A single evidence-reference placeholder extracted from the DOCX body."""

    id: int
    document_id: int
    placeholder_text: str = Field(
        description="Raw placeholder string extracted (e.g. '갑 제1호증')"
    )
    paragraph_index: int | None = Field(
        None, description="0-based paragraph index within the DOCX body"
    )
    char_offset: int | None = Field(
        None, description="Character offset of the placeholder within the paragraph"
    )
    context_snippet: str | None = Field(
        None, description="Surrounding text for human-readable context"
    )
    status: str = Field(description="AnchorStatus: unlinked | linked")
    created_at: datetime

    model_config = {"from_attributes": True}


class DocumentResponse(BaseModel):
    """Full document representation including computed anchor count."""

    id: int
    case_id: int
    source_file_id: int
    title: str
    doc_type: str = Field(description="DocType: main_brief | exhibit_list | other")
    parse_status: str = Field(description="ParseStatus: pending | parsed | error")
    parse_error: str | None
    parsed_at: datetime | None
    anchor_count: int = Field(
        0, description="Number of placeholders extracted (populated after parse)"
    )
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}

    @classmethod
    def from_orm_with_anchors(cls, doc: object) -> "DocumentResponse":
        """Build response and count anchors from ORM relationship."""
        data = cls.model_validate(doc)
        data.anchor_count = len(getattr(doc, "anchors", []))
        return data


class ParsePlaceholderResponse(BaseModel):
    """Result of POST /cases/{case_id}/documents/{document_id}/parse-placeholders."""

    document_id: int
    parse_status: str = Field(description="'parsed' on success, 'error' on failure")
    anchors_found: int = Field(description="Total number of distinct placeholders extracted")
    anchors: list[DocumentAnchorResponse]
    message: str = ""


class DocumentListResponse(BaseModel):
    """Paginated list of documents for a case."""

    items: list[DocumentResponse]
    total: int
    skip: int = 0
    limit: int = 100
