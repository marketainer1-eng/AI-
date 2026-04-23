"""
app/api/schemas/export.py
=========================
Request/Response Pydantic models for the Export endpoint.

The export endpoint:
1. Runs an integrity check — fails immediately if any violations exist.
2. Renders the document, evidence list, and file-rename manifest.
3. Writes artifacts to an export directory under settings.export_path.
"""

from __future__ import annotations

from datetime import datetime
from pydantic import BaseModel, Field


class ExportRequest(BaseModel):
    """POST /cases/{case_id}/export"""

    include_document: bool = Field(
        True,
        description="Export rendered document DOCX (placeholders substituted with evidence numbers)",
    )
    include_evidence_list: bool = Field(
        True,
        description="Export evidence list as a DOCX table",
    )
    include_rename_manifest: bool = Field(
        True,
        description=(
            "Export JSON manifest listing current → planned filenames "
            "for all evidence-attachment SourceFiles"
        ),
    )


class ExportResponse(BaseModel):
    """Response after a successful export."""

    case_id: int
    export_path: str = Field(description="Absolute path to the export directory on the server")
    exported_files: list[str] = Field(description="Absolute paths of each exported file")
    exported_at: datetime
