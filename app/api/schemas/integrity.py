"""
app/api/schemas/integrity.py
=============================
Request/Response Pydantic models for IntegrityReport.

IntegrityResult values: pass | fail

Violation types:
- UNLINKED_ANCHOR          — a DocumentAnchor has no active Reference
- REFERENCE_TO_INACTIVE_EVIDENCE — active Reference points to inactive Evidence
- MISSING_SOURCE_FILE_RECORD     — EvidenceFileLink's SourceFile row is gone
- MISSING_FILE_ON_DISK           — SourceFile row exists but the file is missing

Warning types:
- DUPLICATE_SORT_ORDER — two evidences share the same sort_order in a party
"""

from __future__ import annotations

from datetime import datetime
from pydantic import BaseModel, Field


class IntegrityViolation(BaseModel):
    """A hard violation that causes the integrity check to fail."""

    violation_type: str = Field(
        description=(
            "UNLINKED_ANCHOR | REFERENCE_TO_INACTIVE_EVIDENCE | "
            "MISSING_SOURCE_FILE_RECORD | MISSING_FILE_ON_DISK"
        )
    )
    entity_type: str = Field(description="ORM model class name, e.g. 'DocumentAnchor'")
    entity_id: int | None
    message: str
    detail: dict = {}


class IntegrityWarning(BaseModel):
    """A soft issue that does not block the check but should be reviewed."""

    warning_type: str = Field(description="DUPLICATE_SORT_ORDER | ...")
    entity_type: str
    entity_id: int | None
    message: str


class IntegrityReportResponse(BaseModel):
    """Full integrity report as returned by the API."""

    id: int
    case_id: int
    result: str = Field(description="IntegrityResult: pass | fail")
    is_passed: bool
    violation_count: int
    violations: list[IntegrityViolation]
    warning_count: int
    warnings: list[IntegrityWarning]
    checked_at: datetime

    model_config = {"from_attributes": True}
