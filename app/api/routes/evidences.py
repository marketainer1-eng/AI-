from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.base import get_db
from app.api.schemas.evidence import (
    EvidenceCreate,
    EvidenceUpdate,
    EvidenceResponse,
    EvidenceListResponse,
)
from app.services.evidence_service import EvidenceService
from app.core.exceptions import CaseNotFoundError, EvidenceNotFoundError

router = APIRouter()


def get_evidence_service(db: Session = Depends(get_db)) -> EvidenceService:
    return EvidenceService(db)


@router.post(
    "/{case_id}/evidences",
    response_model=EvidenceResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_evidence(
    case_id: int,
    body: EvidenceCreate,
    svc: EvidenceService = Depends(get_evidence_service),
) -> EvidenceResponse:
    """Create a new evidence record under a case."""
    try:
        evidence = svc.create_evidence(case_id=case_id, data=body)
    except CaseNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    return EvidenceResponse.model_validate(evidence)


@router.get("/{case_id}/evidences", response_model=EvidenceListResponse)
def list_evidences(
    case_id: int,
    party: str | None = None,
    svc: EvidenceService = Depends(get_evidence_service),
) -> EvidenceListResponse:
    """List evidences for a case. Optionally filter by party (plaintiff|defendant)."""
    try:
        items = svc.list_evidences(case_id=case_id, party=party)
    except CaseNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    return EvidenceListResponse(
        items=[EvidenceResponse.model_validate(e) for e in items],
        total=len(items),
    )


@router.get("/{case_id}/evidences/{evidence_id}", response_model=EvidenceResponse)
def get_evidence(
    case_id: int,
    evidence_id: int,
    svc: EvidenceService = Depends(get_evidence_service),
) -> EvidenceResponse:
    """Get a specific evidence."""
    try:
        e = svc.get_evidence(case_id=case_id, evidence_id=evidence_id)
    except (CaseNotFoundError, EvidenceNotFoundError) as e_:
        raise HTTPException(status_code=404, detail=str(e_))
    return EvidenceResponse.model_validate(e)


@router.patch("/{case_id}/evidences/{evidence_id}", response_model=EvidenceResponse)
def update_evidence(
    case_id: int,
    evidence_id: int,
    body: EvidenceUpdate,
    svc: EvidenceService = Depends(get_evidence_service),
) -> EvidenceResponse:
    """Update label, description, sort_order, or is_active of an evidence."""
    try:
        e = svc.update_evidence(case_id=case_id, evidence_id=evidence_id, data=body)
    except (CaseNotFoundError, EvidenceNotFoundError) as e_:
        raise HTTPException(status_code=404, detail=str(e_))
    return EvidenceResponse.model_validate(e)
