from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.base import get_db
from app.api.schemas.reference import ReferenceCreate, ReferenceResponse
from app.services.reference_service import ReferenceService
from app.core.exceptions import EvidenceNotFoundError, DocumentNotFoundError

router = APIRouter()


def get_reference_service(db: Session = Depends(get_db)) -> ReferenceService:
    return ReferenceService(db)


@router.post("", response_model=ReferenceResponse, status_code=status.HTTP_201_CREATED)
def create_reference(
    body: ReferenceCreate,
    svc: ReferenceService = Depends(get_reference_service),
) -> ReferenceResponse:
    """
    Link a DocumentAnchor to an Evidence.
    This is the canonical reference connection.
    Updates the anchor status to 'linked'.
    """
    try:
        ref = svc.create_reference(data=body)
    except (EvidenceNotFoundError, DocumentNotFoundError) as e:
        raise HTTPException(status_code=404, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    return ReferenceResponse.model_validate(ref)


@router.get("/{reference_id}", response_model=ReferenceResponse)
def get_reference(
    reference_id: int,
    svc: ReferenceService = Depends(get_reference_service),
) -> ReferenceResponse:
    """Get a reference by ID."""
    ref = svc.get_reference(reference_id)
    if ref is None:
        raise HTTPException(status_code=404, detail=f"Reference {reference_id} not found")
    return ReferenceResponse.model_validate(ref)


@router.delete("/{reference_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_reference(
    reference_id: int,
    svc: ReferenceService = Depends(get_reference_service),
) -> None:
    """Unlink a reference (sets status to superseded, updates anchor to unlinked)."""
    ref = svc.get_reference(reference_id)
    if ref is None:
        raise HTTPException(status_code=404, detail=f"Reference {reference_id} not found")
    svc.deactivate_reference(reference_id)
