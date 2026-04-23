"""
app/services/document_service.py
==================================
Business logic for Document registration and placeholder parsing.
"""

from __future__ import annotations

from datetime import datetime
from pathlib import Path
from sqlalchemy.orm import Session

from app.models.document import Document, DocumentAnchor
from app.repositories.document_repository import DocumentRepository, AnchorRepository
from app.repositories.case_repository import CaseRepository
from app.repositories.file_repository import FileRepository
from app.repositories.integrity_repository import AuditLogRepository
from app.api.schemas.document import (
    DocumentCreate,
    ParsePlaceholderResponse,
    DocumentAnchorResponse,
    DocumentResponse,
)
from app.parsers.docx_parser import DocxParser
from app.core.exceptions import (
    CaseNotFoundError,
    DocumentNotFoundError,
    SourceFileNotFoundError,
    ParseError,
    InvalidFileTypeError,
)


class DocumentService:
    def __init__(self, db: Session):
        self.db = db
        self.doc_repo = DocumentRepository(db)
        self.anchor_repo = AnchorRepository(db)
        self.case_repo = CaseRepository(db)
        self.file_repo = FileRepository(db)
        self.audit = AuditLogRepository(db)
        self.parser = DocxParser()

    # ── Register ──────────────────────────────────────────────────────────────

    def register_document(self, case_id: int, data: DocumentCreate) -> Document:
        """Register an already-uploaded DOCX SourceFile as a Document."""
        if self.case_repo.get_by_id(case_id) is None:
            raise CaseNotFoundError(case_id)

        sf = self.file_repo.get_by_case_and_id(case_id, data.source_file_id)
        if sf is None:
            raise SourceFileNotFoundError(data.source_file_id)

        if not sf.original_filename.lower().endswith(".docx"):
            raise InvalidFileTypeError(sf.original_filename, expected=".docx")

        doc = self.doc_repo.create(
            case_id=case_id,
            source_file_id=data.source_file_id,
            title=data.title,
            doc_type=data.doc_type,
        )
        self.audit.log(
            action="document_registered",
            case_id=case_id,
            entity_type="Document",
            entity_id=doc.id,
            detail={"title": doc.title, "source_file_id": data.source_file_id},
        )
        self.db.commit()
        self.db.refresh(doc)
        return doc

    # ── List / Get ────────────────────────────────────────────────────────────

    def list_documents(
        self, case_id: int, skip: int = 0, limit: int = 100
    ) -> tuple[list[Document], int]:
        if self.case_repo.get_by_id(case_id) is None:
            raise CaseNotFoundError(case_id)
        items = self.doc_repo.get_by_case(case_id, skip=skip, limit=limit)
        total = self.doc_repo.count_by_case(case_id)
        return items, total

    def get_document(self, case_id: int, document_id: int) -> Document:
        if self.case_repo.get_by_id(case_id) is None:
            raise CaseNotFoundError(case_id)
        doc = self.doc_repo.get_by_case_and_id(case_id, document_id)
        if doc is None:
            raise DocumentNotFoundError(document_id)
        return doc

    def list_anchors(
        self, case_id: int, document_id: int
    ) -> list[DocumentAnchor]:
        """Return all anchors for a document (after parse-placeholders)."""
        _ = self.get_document(case_id, document_id)  # validates ownership
        return self.anchor_repo.get_by_document(document_id)

    # ── Parse placeholders ────────────────────────────────────────────────────

    def parse_placeholders(
        self, case_id: int, document_id: int
    ) -> ParsePlaceholderResponse:
        """
        Read the DOCX file and extract all evidence-reference placeholders.

        Clears any previously extracted anchors and re-creates them from scratch,
        so this endpoint is safe to call multiple times.
        """
        if self.case_repo.get_by_id(case_id) is None:
            raise CaseNotFoundError(case_id)

        doc = self.doc_repo.get_by_case_and_id(case_id, document_id)
        if doc is None:
            raise DocumentNotFoundError(document_id)

        sf = self.file_repo.get_by_id(doc.source_file_id)
        if sf is None:
            raise SourceFileNotFoundError(doc.source_file_id)

        file_path = Path(sf.storage_path)
        if not file_path.exists():
            raise ParseError(f"DOCX file not found on disk: {file_path}")

        try:
            anchors_data = self.parser.extract_placeholders(file_path)
        except Exception as e:
            self.doc_repo.update_parse_status(doc, "error", error=str(e))
            self.db.commit()
            raise ParseError(f"Failed to parse DOCX: {e}") from e

        # Clear existing anchors for idempotent re-parse
        self.anchor_repo.delete_by_document(document_id)

        created_anchors: list[DocumentAnchor] = []
        for a in anchors_data:
            anchor = self.anchor_repo.create(
                document_id=document_id,
                placeholder_text=a["placeholder_text"],
                paragraph_index=a.get("paragraph_index"),
                char_offset=a.get("char_offset"),
                context_snippet=a.get("context_snippet"),
            )
            created_anchors.append(anchor)

        self.doc_repo.update_parse_status(doc, "parsed", parsed_at=datetime.utcnow())
        self.audit.log(
            action="document_parsed",
            case_id=case_id,
            entity_type="Document",
            entity_id=document_id,
            detail={"anchors_found": len(created_anchors)},
        )
        self.db.commit()

        return ParsePlaceholderResponse(
            document_id=document_id,
            parse_status="parsed",
            anchors_found=len(created_anchors),
            anchors=[DocumentAnchorResponse.model_validate(a) for a in created_anchors],
            message=f"Extracted {len(created_anchors)} placeholders successfully",
        )
