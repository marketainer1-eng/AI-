"""
app/api/routes/export.py
=========================
Export endpoint (mounted under /cases).

POST /cases/{case_id}/export — run integrity check, render, write artifacts to disk
"""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.base import get_db
from app.api.schemas.export import ExportRequest, ExportResponse
from app.services.export_service import ExportService
from app.core.exceptions import CaseNotFoundError, IntegrityViolationError, ExportError

router = APIRouter()


def get_export_service(db: Session = Depends(get_db)) -> ExportService:
    return ExportService(db)


@router.post(
    "/{case_id}/export",
    response_model=ExportResponse,
    summary="Export case artifacts (rendered DOCX, evidence list, rename manifest)",
)
def export_case(
    case_id: int,
    body: ExportRequest,
    svc: ExportService = Depends(get_export_service),
) -> ExportResponse:
    """
    Export all case artifacts to the server's export directory.

    **Prerequisites:** integrity check must pass (HTTP 409 if it fails).

    Exported artifacts (controlled by request body flags):
    - **Rendered document DOCX** — evidence-number placeholders substituted.
    - **Evidence list DOCX** — table of all active evidences with rendered numbers.
    - **File rename manifest JSON** — array of `{source_file_id, current_filename, planned_filename}`.

    Returns the export directory path and list of individual file paths.
    """
    try:
        result = svc.export_case(case_id=case_id, request=body)
    except CaseNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except IntegrityViolationError as e:
        raise HTTPException(
            status_code=409,
            detail={
                "message": "Integrity check failed — export blocked",
                "errors": e.errors,
            },
        )
    except ExportError as e:
        raise HTTPException(status_code=500, detail=str(e))
    return result
