"""
app/api/schemas/preview.py
==========================
Request/Response Pydantic models for render preview operations.

The render system is a pure read-only projection layer:
- It does NOT modify any canonical data.
- It applies ChangeSet reorder overrides in-memory.
- Results can optionally be persisted as DocumentProjection /
  EvidenceListProjection / FileRenamePlan records for later commit.
"""

from __future__ import annotations

from pydantic import BaseModel, Field


# ── Request models ────────────────────────────────────────────────────────────

class RenderPreviewRequest(BaseModel):
    """
    POST /cases/{case_id}/render-preview

    If change_set_id is provided, the reorder operations of that ChangeSet are
    applied in-memory before rendering.  The canonical data is NOT changed.
    """

    change_set_id: int | None = Field(
        None,
        description=(
            "Optional ChangeSet ID.  If omitted, renders from the current "
            "canonical state (committed evidence sort_orders)."
        ),
    )


# ── Leaf preview models ───────────────────────────────────────────────────────

class EvidenceListEntryPreview(BaseModel):
    """A single evidence row in the rendered evidence-list preview."""

    evidence_id: int
    rendered_number: str = Field(
        description="Computed number string, e.g. '갑 제1호증'"
    )
    rendered_label: str
    rendered_description: str | None
    sort_order_snapshot: int = Field(
        description="The sort_order value used for rendering (may differ from DB if ChangeSet is applied)"
    )


class FileRenameEntryPreview(BaseModel):
    """
    A single file whose name will change if the ChangeSet is committed.
    current_filename  → the stored filename right now.
    planned_filename  → the filename after evidence numbers are applied.
    """

    source_file_id: int
    current_filename: str
    planned_filename: str


class DocumentPreview(BaseModel):
    """Rendered document body — paragraphs with placeholders substituted."""

    document_id: int
    paragraphs: list[str] = Field(
        description="Document body paragraphs with evidence-number substitution applied"
    )
    content_hash: str = Field(
        description="SHA-256 (first 16 hex chars) of the rendered paragraph list"
    )


# ── Top-level response models ─────────────────────────────────────────────────

class RenderPreviewResponse(BaseModel):
    """
    POST /cases/{case_id}/render-preview — full render preview response.
    """

    case_id: int
    change_set_id: int | None
    document_preview: DocumentPreview | None = Field(
        None,
        description=(
            "Rendered document body.  None if no Document is registered for the case "
            "or if the DOCX file is not on disk."
        ),
    )
    evidence_list_preview: list[EvidenceListEntryPreview] = Field(
        description="Ordered list of all active evidences with their rendered numbers"
    )
    file_rename_preview: list[FileRenameEntryPreview] = Field(
        description="List of files whose names will change on commit"
    )


class ChangeSetPreviewRequest(BaseModel):
    """POST /changes/{change_set_id}/preview — no body required."""
    pass


class ChangeSetPreviewResponse(BaseModel):
    """
    POST /changes/{change_set_id}/preview

    A focused preview of just the ChangeSet's effect (evidence list + renames).
    Does NOT include a full document re-render for performance.
    """

    change_set_id: int
    status: str = Field(description="ChangeSetStatus after preview: 'previewed'")
    evidence_list_preview: list[EvidenceListEntryPreview]
    file_rename_preview: list[FileRenameEntryPreview]
