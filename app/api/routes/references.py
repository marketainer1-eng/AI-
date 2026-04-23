"""
app/api/routes/references.py
=============================
Reference (anchor ↔ evidence) endpoints.

POST   /references                    — link anchor to evidence
GET    /references/{reference_id}     — get reference
DELETE /references/{reference_id}     — unlink (supersede) reference
GET    /cases/{case_id}/references    — list all references for a case
"""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.db.base import get_db
from app.api.schemas.reference import (
    ReferenceCreate,
    ReferenceResponse,
    ReferenceListResponse,
)
from app.services.reference_service import ReferenceService
from app.core.exceptions import (
    AnchorNotFoundError,
    EvidenceNotFoundError,
    ReferenceNotFoundError,
)

router = APIRouter()


def get_reference_service(db: Session = Depends(get_db)) -> ReferenceService:
    return ReferenceService(db)


# ── Create ────────────────────────────────────────────────────────────────────

@router.post(
    "",
    response_model=ReferenceResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Link a DocumentAnchor to an Evidence",
)
def create_reference(
    body: ReferenceCreate,
    svc: ReferenceService = Depends(get_reference_service),
) -> ReferenceResponse:
    """
    Create a Reference that associates a `DocumentAnchor` with an `Evidence`.

    - Each anchor can have **at most one active** Reference at a time.
    - If the anchor already has an active Reference, it is **superseded** (not deleted).
    - The anchor status is updated to `linked`.

    Returns the new Reference with denormalized context fields
    (`placeholder_text`, `evidence_label`, `rendered_number`).
    """
    try:
        ref = svc.create_reference(data=body)
    except AnchorNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except EvidenceNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    return svc.build_response(ref)


# ── Get ───────────────────────────────────────────────────────────────────────

@router.get(
    "/{reference_id}",
    response_model=ReferenceResponse,
    summary="Get a reference by ID",
)
def get_reference(
    reference_id: int,
    svc: ReferenceService = Depends(get_reference_service),
) -> ReferenceResponse:
    try:
        ref = svc.get_reference(reference_id)
    except ReferenceNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    return svc.build_response(ref)


# ── Delete (unlink) ───────────────────────────────────────────────────────────

@router.delete(
    "/{reference_id}",
    response_model=ReferenceResponse,
    summary="Unlink (supersede) a reference",
)
def delete_reference(
    reference_id: int,
    svc: ReferenceService = Depends(get_reference_service),
) -> ReferenceResponse:
    """
    Deactivate a Reference by setting its status to `superseded`.

    The `DocumentAnchor` status is reset to `unlinked`.
    This action is recorded in the audit log.

    Note: this modifies **canonical** data immediately.  For tracked,
    reversible changes use `POST /cases/{id}/changes/unlink-references`.
    """
    try:
        ref = svc.deactivate_reference(reference_id)
    except ReferenceNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    return svc.build_response(ref)
