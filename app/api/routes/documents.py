from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.base import get_db
from app.api.schemas.document import (
    DocumentCreate,
    DocumentResponse,
    ParsePlaceholderResponse,
)
from app.services.document_service import DocumentService
from app.core.exceptions import CaseNotFoundError, DocumentNotFoundError, ParseError

router = APIRouter()


def get_document_service(db: Session = Depends(get_db)) -> DocumentService:
    return DocumentService(db)


@router.post(
    "/{case_id}/documents",
    response_model=DocumentResponse,
    status_code=status.HTTP_201_CREATED,
)
def register_document(
    case_id: int,
    body: DocumentCreate,
    svc: DocumentService = Depends(get_document_service),
) -> DocumentResponse:
    """Register a DOCX SourceFile as a Document under the case."""
    try:
        doc = svc.register_document(case_id=case_id, data=body)
    except CaseNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    return DocumentResponse.model_validate(doc)


@router.get("/{case_id}/documents", response_model=list[DocumentResponse])
def list_documents(
    case_id: int,
    svc: DocumentService = Depends(get_document_service),
) -> list[DocumentResponse]:
    """List all documents for a case."""
    try:
        docs = svc.list_documents(case_id=case_id)
    except CaseNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    return [DocumentResponse.model_validate(d) for d in docs]


@router.post(
    "/{case_id}/documents/{document_id}/parse-placeholders",
    response_model=ParsePlaceholderResponse,
)
def parse_placeholders(
    case_id: int,
    document_id: int,
    svc: DocumentService = Depends(get_document_service),
) -> ParsePlaceholderResponse:
    """
    Parse the DOCX file and extract all evidence placeholders.
    Placeholders are stored as DocumentAnchor records (unlinked state).
    """
    try:
        result = svc.parse_placeholders(case_id=case_id, document_id=document_id)
    except CaseNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except DocumentNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except ParseError as e:
        raise HTTPException(status_code=422, detail=str(e))
    return result
