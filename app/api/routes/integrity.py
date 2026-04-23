"""
app/api/routes/integrity.py
============================
Integrity check endpoints (mounted under /cases).

GET /cases/{case_id}/integrity-check         — run integrity check + persist report
GET /cases/{case_id}/integrity-check/history — past check reports
"""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.db.base import get_db
from app.api.schemas.integrity import IntegrityReportResponse
from app.services.integrity_service import IntegrityService
from app.core.exceptions import CaseNotFoundError

router = APIRouter()


def get_integrity_service(db: Session = Depends(get_db)) -> IntegrityService:
    return IntegrityService(db)


# ── Run check ─────────────────────────────────────────────────────────────────

@router.get(
    "/{case_id}/integrity-check",
    response_model=IntegrityReportResponse,
    summary="Run a full integrity check on a case",
)
def integrity_check(
    case_id: int,
    svc: IntegrityService = Depends(get_integrity_service),
) -> IntegrityReportResponse:
    """
    Run a full integrity check on the case and persist an `IntegrityReport`.

    Checks performed:
    1. **UNLINKED_ANCHOR** — every `DocumentAnchor` must be linked to an Evidence.
    2. **REFERENCE_TO_INACTIVE_EVIDENCE** — active References must not point to
       inactive (soft-deleted) Evidences.
    3. **MISSING_SOURCE_FILE_RECORD** — every `EvidenceFileLink` must point to
       an existing `SourceFile` row.
    4. **MISSING_FILE_ON_DISK** — every `SourceFile` must exist on disk.

    Warnings (non-blocking):
    - **DUPLICATE_SORT_ORDER** — two evidences in the same party share the same
      sort_order (can happen during manual edits; use a reorder ChangeSet to fix).

    The report is stored and returned.  `is_passed = True` ↔ no violations.
    """
    try:
        report = svc.run_integrity_check(case_id=case_id)
    except CaseNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    return IntegrityReportResponse.model_validate(report)


# ── History ───────────────────────────────────────────────────────────────────

@router.get(
    "/{case_id}/integrity-check/history",
    response_model=list[IntegrityReportResponse],
    summary="Get recent integrity check reports for a case",
)
def integrity_check_history(
    case_id: int,
    limit: int = Query(10, ge=1, le=100, description="Maximum number of past reports to return"),
    svc: IntegrityService = Depends(get_integrity_service),
) -> list[IntegrityReportResponse]:
    """Return the last **N** integrity check reports for a case, newest first."""
    try:
        reports = svc.get_integrity_history(case_id=case_id, limit=limit)
    except CaseNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    return [IntegrityReportResponse.model_validate(r) for r in reports]
