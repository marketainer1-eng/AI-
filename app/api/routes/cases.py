"""
app/api/routes/cases.py
========================
Case CRUD endpoints.

POST   /cases                  — create case
GET    /cases                  — list cases (paginated)
GET    /cases/{case_id}        — get case
PATCH  /cases/{case_id}        — partial update
GET    /cases/{case_id}/audit-logs  — audit trail
"""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.db.base import get_db
from app.api.schemas.case import CaseCreate, CaseUpdate, CaseResponse, CaseListResponse
from app.api.schemas.audit import AuditLogResponse, AuditLogListResponse
from app.services.case_service import CaseService
from app.services.audit_service import AuditService
from app.core.exceptions import CaseNotFoundError

router = APIRouter()


def get_case_service(db: Session = Depends(get_db)) -> CaseService:
    return CaseService(db)


def get_audit_service(db: Session = Depends(get_db)) -> AuditService:
    return AuditService(db)


# ── Create ────────────────────────────────────────────────────────────────────

@router.post(
    "",
    response_model=CaseResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new litigation case",
)
def create_case(
    body: CaseCreate,
    svc: CaseService = Depends(get_case_service),
) -> CaseResponse:
    """
    Create a new case.  The case begins in **active** status.

    - **name**: required, max 255 chars
    - **court**: optional court name
    - **case_number**: optional official docket number (must be unique if provided)
    """
    case = svc.create_case(body)
    return CaseResponse.model_validate(case)


# ── List ──────────────────────────────────────────────────────────────────────

@router.get(
    "",
    response_model=CaseListResponse,
    summary="List all cases (paginated)",
)
def list_cases(
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(100, ge=1, le=500, description="Maximum records to return"),
    svc: CaseService = Depends(get_case_service),
) -> CaseListResponse:
    """Return a paginated list of all cases, newest first."""
    items, total = svc.list_cases(skip=skip, limit=limit)
    return CaseListResponse(
        items=[CaseResponse.model_validate(c) for c in items],
        total=total,
        skip=skip,
        limit=limit,
    )


# ── Get ───────────────────────────────────────────────────────────────────────

@router.get(
    "/{case_id}",
    response_model=CaseResponse,
    summary="Get a case by ID",
)
def get_case(
    case_id: int,
    svc: CaseService = Depends(get_case_service),
) -> CaseResponse:
    try:
        case = svc.get_case(case_id)
    except CaseNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    return CaseResponse.model_validate(case)


# ── Update ────────────────────────────────────────────────────────────────────

@router.patch(
    "/{case_id}",
    response_model=CaseResponse,
    summary="Partially update a case",
)
def update_case(
    case_id: int,
    body: CaseUpdate,
    svc: CaseService = Depends(get_case_service),
) -> CaseResponse:
    """
    Update any subset of name, description, court, case_number, status.
    Fields omitted from the body are left unchanged.
    """
    try:
        case = svc.update_case(case_id, body)
    except CaseNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    return CaseResponse.model_validate(case)


# ── Audit log ─────────────────────────────────────────────────────────────────

@router.get(
    "/{case_id}/audit-logs",
    response_model=AuditLogListResponse,
    summary="Get audit log for a case",
)
def get_audit_logs(
    case_id: int,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    action: str | None = Query(None, description="Filter by action type (e.g. 'file_uploaded')"),
    svc: AuditService = Depends(get_audit_service),
) -> AuditLogListResponse:
    """
    Return the audit trail for a case, newest first.

    Optionally filter by a specific `action` value (e.g. `evidence_created`).
    """
    try:
        items, total = svc.get_audit_logs(
            case_id=case_id, skip=skip, limit=limit, action_filter=action
        )
    except CaseNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    return AuditLogListResponse(
        items=[AuditLogResponse.model_validate(e) for e in items],
        total=total,
        skip=skip,
        limit=limit,
    )
