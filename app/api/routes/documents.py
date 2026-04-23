"""
app/api/routes/documents.py
=============================
Document and DocumentAnchor endpoints (mounted under /cases).

POST  /cases/{case_id}/documents                                 — register document
GET   /cases/{case_id}/documents                                 — list documents
GET   /cases/{case_id}/documents/{document_id}                   — get document
POST  /cases/{case_id}/documents/{document_id}/parse-placeholders — parse DOCX
GET   /cases/{case_id}/documents/{document_id}/anchors           — list anchors
"""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.db.base import get_db
from app.api.schemas.document import (
    DocumentCreate,
    DocumentResponse,
    DocumentListResponse,
    DocumentAnchorResponse,
    ParsePlaceholderResponse,
)
from app.services.document_service import DocumentService
from app.core.exceptions import (
    CaseNotFoundError,
    DocumentNotFoundError,
    SourceFileNotFoundError,
    ParseError,
    InvalidFileTypeError,
)

router = APIRouter()


def get_document_service(db: Session = Depends(get_db)) -> DocumentService:
    return DocumentService(db)


# ── Register ──────────────────────────────────────────────────────────────────

@router.post(
    "/{case_id}/documents",
    response_model=DocumentResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a DOCX file as a Document",
)
def register_document(
    case_id: int,
    body: DocumentCreate,
    svc: DocumentService = Depends(get_document_service),
) -> DocumentResponse:
    """
    Register an already-uploaded SourceFile as a Document.

    The SourceFile **must** be a `.docx` file.  After registration, call
    `POST /parse-placeholders` to extract evidence-reference anchors from it.
    """
    try:
        doc = svc.register_document(case_id=case_id, data=body)
    except CaseNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except SourceFileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except InvalidFileTypeError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    return DocumentResponse.from_orm_with_anchors(doc)


# ── List ──────────────────────────────────────────────────────────────────────

@router.get(
    "/{case_id}/documents",
    response_model=DocumentListResponse,
    summary="List all documents for a case",
)
def list_documents(
    case_id: int,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    svc: DocumentService = Depends(get_document_service),
) -> DocumentListResponse:
    try:
        items, total = svc.list_documents(case_id=case_id, skip=skip, limit=limit)
    except CaseNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    return DocumentListResponse(
        items=[DocumentResponse.from_orm_with_anchors(d) for d in items],
        total=total,
        skip=skip,
        limit=limit,
    )


# ── Get ───────────────────────────────────────────────────────────────────────

@router.get(
    "/{case_id}/documents/{document_id}",
    response_model=DocumentResponse,
    summary="Get a specific document",
)
def get_document(
    case_id: int,
    document_id: int,
    svc: DocumentService = Depends(get_document_service),
) -> DocumentResponse:
    try:
        doc = svc.get_document(case_id=case_id, document_id=document_id)
    except (CaseNotFoundError, DocumentNotFoundError) as e:
        raise HTTPException(status_code=404, detail=str(e))
    return DocumentResponse.from_orm_with_anchors(doc)


# ── Parse placeholders ────────────────────────────────────────────────────────

@router.post(
    "/{case_id}/documents/{document_id}/parse-placeholders",
    response_model=ParsePlaceholderResponse,
    summary="Parse evidence-reference placeholders from the DOCX",
)
def parse_placeholders(
    case_id: int,
    document_id: int,
    svc: DocumentService = Depends(get_document_service),
) -> ParsePlaceholderResponse:
    """
    Read the DOCX file and extract all evidence-reference placeholders
    (e.g. `갑 제1호증`).  Results are stored as **DocumentAnchor** records.

    This endpoint is **idempotent** — calling it multiple times re-extracts
    anchors and clears previously created ones.

    Prerequisite: the SourceFile must be present on disk.
    """
    try:
        result = svc.parse_placeholders(case_id=case_id, document_id=document_id)
    except CaseNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except DocumentNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except SourceFileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except ParseError as e:
        raise HTTPException(status_code=422, detail=str(e))
    return result


# ── List anchors ──────────────────────────────────────────────────────────────

@router.get(
    "/{case_id}/documents/{document_id}/anchors",
    response_model=list[DocumentAnchorResponse],
    summary="List all placeholder anchors for a document",
)
def list_anchors(
    case_id: int,
    document_id: int,
    svc: DocumentService = Depends(get_document_service),
) -> list[DocumentAnchorResponse]:
    """
    Return all DocumentAnchor records for a document.

    Anchors are created by `parse-placeholders`.  Each anchor tracks whether it
    has been linked to an Evidence (status: `unlinked` → `linked`).
    """
    try:
        anchors = svc.list_anchors(case_id=case_id, document_id=document_id)
    except (CaseNotFoundError, DocumentNotFoundError) as e:
        raise HTTPException(status_code=404, detail=str(e))
    return [DocumentAnchorResponse.model_validate(a) for a in anchors]
