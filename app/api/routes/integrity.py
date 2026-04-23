from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.base import get_db
from app.api.schemas.integrity import IntegrityReportResponse
from app.services.integrity_service import IntegrityService
from app.core.exceptions import CaseNotFoundError

router = APIRouter()


def get_integrity_service(db: Session = Depends(get_db)) -> IntegrityService:
    return IntegrityService(db)


@router.get("/{case_id}/integrity-check", response_model=IntegrityReportResponse)
def integrity_check(
    case_id: int,
    svc: IntegrityService = Depends(get_integrity_service),
) -> IntegrityReportResponse:
    """
    Run a full integrity check on the case.
    Checks:
    - All DocumentAnchors are linked to an Evidence (via Reference)
    - All active References point to active Evidences
    - All EvidenceFileLinks point to existing SourceFiles on disk
    - No duplicate sort_orders within the same party
    Stores and returns an IntegrityReport.
    """
    try:
        report = svc.run_integrity_check(case_id=case_id)
    except CaseNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    return IntegrityReportResponse.model_validate(report)


@router.get("/{case_id}/integrity-check/history", response_model=list[IntegrityReportResponse])
def integrity_check_history(
    case_id: int,
    limit: int = 10,
    svc: IntegrityService = Depends(get_integrity_service),
) -> list[IntegrityReportResponse]:
    """Get the last N integrity check reports for a case."""
    try:
        reports = svc.get_integrity_history(case_id=case_id, limit=limit)
    except CaseNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    return [IntegrityReportResponse.model_validate(r) for r in reports]
