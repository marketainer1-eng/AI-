"""
app/api/routes/evidences.py
=============================
Evidence CRUD + EvidenceFileLink endpoints (mounted under /cases).

POST   /cases/{case_id}/evidences                           — create evidence
GET    /cases/{case_id}/evidences                           — list evidences
GET    /cases/{case_id}/evidences/{evidence_id}             — get evidence
PATCH  /cases/{case_id}/evidences/{evidence_id}             — update evidence
DELETE /cases/{case_id}/evidences/{evidence_id}             — soft delete (deactivate)
GET    /cases/{case_id}/evidences/{evidence_id}/references  — active references for evidence
POST   /cases/{case_id}/evidences/{evidence_id}/files       — attach a file to evidence
DELETE /cases/{case_id}/evidences/{evidence_id}/files/{link_id} — remove file link
"""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.db.base import get_db
from app.api.schemas.evidence import (
    EvidenceCreate,
    EvidenceUpdate,
    EvidenceFileLinkCreate,
    EvidenceFileLinkResponse,
    EvidenceResponse,
    EvidenceListResponse,
)
from app.api.schemas.reference import ReferenceResponse
from app.services.evidence_service import EvidenceService
from app.services.reference_service import ReferenceService
from app.core.exceptions import (
    CaseNotFoundError,
    EvidenceNotFoundError,
    SourceFileNotFoundError,
)

router = APIRouter()


def get_evidence_service(db: Session = Depends(get_db)) -> EvidenceService:
    return EvidenceService(db)


def get_reference_service(db: Session = Depends(get_db)) -> ReferenceService:
    return ReferenceService(db)


# ── Create ────────────────────────────────────────────────────────────────────

@router.post(
    "/{case_id}/evidences",
    response_model=EvidenceResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new evidence record",
)
def create_evidence(
    case_id: int,
    body: EvidenceCreate,
    svc: EvidenceService = Depends(get_evidence_service),
) -> EvidenceResponse:
    """
    Create a new evidence record (갑 or 을).

    - **sort_order = 0**: auto-assigned to `max_existing + 1` within the party.
    - **source_file_ids**: optionally attach backing files at creation time.
    - **rendered_number** is computed in the response (not stored in DB).
    """
    try:
        evidence = svc.create_evidence(case_id=case_id, data=body)
    except CaseNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except SourceFileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    return EvidenceResponse.from_orm_with_number(evidence)


# ── List ──────────────────────────────────────────────────────────────────────

@router.get(
    "/{case_id}/evidences",
    response_model=EvidenceListResponse,
    summary="List evidences for a case",
)
def list_evidences(
    case_id: int,
    party: str | None = Query(None, description="Filter: plaintiff | defendant"),
    include_inactive: bool = Query(False, description="Include soft-deleted evidences"),
    skip: int = Query(0, ge=0),
    limit: int = Query(200, ge=1, le=1000),
    svc: EvidenceService = Depends(get_evidence_service),
) -> EvidenceListResponse:
    """
    Return evidences for a case, ordered by (party, sort_order) ascending.

    Optionally filter by **party** (`plaintiff` or `defendant`).
    """
    try:
        items, total = svc.list_evidences(
            case_id=case_id,
            party=party,
            include_inactive=include_inactive,
            skip=skip,
            limit=limit,
        )
    except CaseNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    return EvidenceListResponse(
        items=[EvidenceResponse.from_orm_with_number(e) for e in items],
        total=total,
        skip=skip,
        limit=limit,
    )


# ── Get ───────────────────────────────────────────────────────────────────────

@router.get(
    "/{case_id}/evidences/{evidence_id}",
    response_model=EvidenceResponse,
    summary="Get a specific evidence",
)
def get_evidence(
    case_id: int,
    evidence_id: int,
    svc: EvidenceService = Depends(get_evidence_service),
) -> EvidenceResponse:
    try:
        e = svc.get_evidence(case_id=case_id, evidence_id=evidence_id)
    except (CaseNotFoundError, EvidenceNotFoundError) as e_:
        raise HTTPException(status_code=404, detail=str(e_))
    return EvidenceResponse.from_orm_with_number(e)


# ── Update ────────────────────────────────────────────────────────────────────

@router.patch(
    "/{case_id}/evidences/{evidence_id}",
    response_model=EvidenceResponse,
    summary="Partially update an evidence record",
)
def update_evidence(
    case_id: int,
    evidence_id: int,
    body: EvidenceUpdate,
    svc: EvidenceService = Depends(get_evidence_service),
) -> EvidenceResponse:
    """
    Update `label`, `description`, `sort_order`, or `is_active`.
    All fields are optional — omitted fields are left unchanged.

    Note: changing `sort_order` directly may conflict with the unique constraint
    `(case_id, party, sort_order)`.  Use a **reorder ChangeSet** for bulk reorders.
    """
    try:
        e = svc.update_evidence(case_id=case_id, evidence_id=evidence_id, data=body)
    except (CaseNotFoundError, EvidenceNotFoundError) as e_:
        raise HTTPException(status_code=404, detail=str(e_))
    return EvidenceResponse.from_orm_with_number(e)


# ── Soft delete ───────────────────────────────────────────────────────────────

@router.delete(
    "/{case_id}/evidences/{evidence_id}",
    response_model=EvidenceResponse,
    summary="Deactivate (soft-delete) an evidence record",
)
def delete_evidence(
    case_id: int,
    evidence_id: int,
    svc: EvidenceService = Depends(get_evidence_service),
) -> EvidenceResponse:
    """
    Set `is_active = False` on the evidence.  The record is **not** physically
    deleted.  Active References pointing to this evidence will fail the next
    integrity check.
    """
    try:
        e = svc.delete_evidence(case_id=case_id, evidence_id=evidence_id)
    except (CaseNotFoundError, EvidenceNotFoundError) as e_:
        raise HTTPException(status_code=404, detail=str(e_))
    return EvidenceResponse.from_orm_with_number(e)


# ── References for an evidence ────────────────────────────────────────────────

@router.get(
    "/{case_id}/evidences/{evidence_id}/references",
    response_model=list[ReferenceResponse],
    summary="Get active references for a specific evidence",
)
def list_evidence_references(
    case_id: int,
    evidence_id: int,
    ev_svc: EvidenceService = Depends(get_evidence_service),
    ref_svc: ReferenceService = Depends(get_reference_service),
) -> list[ReferenceResponse]:
    """
    Return all **active** References that point to this evidence.
    Used to see which document placeholders are linked to this evidence.
    """
    try:
        # Validate evidence belongs to case
        _ = ev_svc.get_evidence(case_id=case_id, evidence_id=evidence_id)
        refs = ref_svc.list_references_by_evidence(case_id=case_id, evidence_id=evidence_id)
    except (CaseNotFoundError, EvidenceNotFoundError) as e:
        raise HTTPException(status_code=404, detail=str(e))
    return [ref_svc.build_response(r) for r in refs]


# ── File link management ──────────────────────────────────────────────────────

@router.post(
    "/{case_id}/evidences/{evidence_id}/files",
    response_model=EvidenceFileLinkResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Attach a file to an evidence record",
)
def add_file_link(
    case_id: int,
    evidence_id: int,
    body: EvidenceFileLinkCreate,
    svc: EvidenceService = Depends(get_evidence_service),
) -> EvidenceFileLinkResponse:
    """Link an additional SourceFile to an existing evidence record."""
    try:
        link = svc.add_file_link(case_id=case_id, evidence_id=evidence_id, data=body)
    except (CaseNotFoundError, EvidenceNotFoundError) as e:
        raise HTTPException(status_code=404, detail=str(e))
    except SourceFileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    return EvidenceFileLinkResponse.model_validate(link)


@router.delete(
    "/{case_id}/evidences/{evidence_id}/files/{link_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Remove a file link from an evidence record",
)
def remove_file_link(
    case_id: int,
    evidence_id: int,
    link_id: int,
    svc: EvidenceService = Depends(get_evidence_service),
) -> None:
    try:
        svc.remove_file_link(case_id=case_id, evidence_id=evidence_id, link_id=link_id)
    except (CaseNotFoundError, EvidenceNotFoundError) as e:
        raise HTTPException(status_code=404, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
