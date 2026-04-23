from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.base import get_db
from app.api.schemas.case import CaseCreate, CaseUpdate, CaseResponse, CaseListResponse
from app.services.case_service import CaseService
from app.core.exceptions import CaseNotFoundError

router = APIRouter()


def get_case_service(db: Session = Depends(get_db)) -> CaseService:
    return CaseService(db)


@router.post("", response_model=CaseResponse, status_code=status.HTTP_201_CREATED)
def create_case(
    body: CaseCreate,
    svc: CaseService = Depends(get_case_service),
) -> CaseResponse:
    """Create a new case."""
    case = svc.create_case(body)
    return CaseResponse.model_validate(case)


@router.get("", response_model=CaseListResponse)
def list_cases(
    svc: CaseService = Depends(get_case_service),
) -> CaseListResponse:
    """List all cases."""
    cases = svc.list_cases()
    return CaseListResponse(items=[CaseResponse.model_validate(c) for c in cases], total=len(cases))


@router.get("/{case_id}", response_model=CaseResponse)
def get_case(
    case_id: int,
    svc: CaseService = Depends(get_case_service),
) -> CaseResponse:
    """Get a case by ID."""
    try:
        case = svc.get_case(case_id)
    except CaseNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    return CaseResponse.model_validate(case)


@router.patch("/{case_id}", response_model=CaseResponse)
def update_case(
    case_id: int,
    body: CaseUpdate,
    svc: CaseService = Depends(get_case_service),
) -> CaseResponse:
    """Update a case."""
    try:
        case = svc.update_case(case_id, body)
    except CaseNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    return CaseResponse.model_validate(case)
