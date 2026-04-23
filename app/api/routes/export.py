from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.base import get_db
from app.api.schemas.export import ExportRequest, ExportResponse
from app.services.export_service import ExportService
from app.core.exceptions import CaseNotFoundError, IntegrityViolationError

router = APIRouter()


def get_export_service(db: Session = Depends(get_db)) -> ExportService:
    return ExportService(db)


@router.post("/{case_id}/export", response_model=ExportResponse)
def export_case(
    case_id: int,
    body: ExportRequest,
    svc: ExportService = Depends(get_export_service),
) -> ExportResponse:
    """
    Final export of case artifacts:
    - Rendered document DOCX (evidence numbers substituted)
    - Evidence list DOCX
    - File rename manifest JSON
    Runs integrity check before export. Fails if integrity check does not pass.
    """
    try:
        result = svc.export_case(case_id=case_id, request=body)
    except CaseNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except IntegrityViolationError as e:
        raise HTTPException(
            status_code=409,
            detail={"message": "Integrity check failed before export", "errors": e.errors},
        )
    return result
