"""
app/repositories/document_repository.py
=========================================
Repositories for Document and DocumentAnchor.
"""

from __future__ import annotations

from datetime import datetime
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.document import Document, DocumentAnchor
from app.repositories.base import BaseRepository


class DocumentRepository(BaseRepository[Document]):
    def __init__(self, db: Session):
        super().__init__(db, Document)

    def get_by_id(self, document_id: int) -> Document | None:
        return (
            self.db.query(Document)
            .filter(Document.id == document_id)
            .first()
        )

    def get_by_case(
        self, case_id: int, skip: int = 0, limit: int = 100
    ) -> list[Document]:
        return (
            self.db.query(Document)
            .filter(Document.case_id == case_id)
            .order_by(Document.created_at.asc())
            .offset(skip)
            .limit(limit)
            .all()
        )

    def count_by_case(self, case_id: int) -> int:
        return (
            self.db.query(func.count(Document.id))
            .filter(Document.case_id == case_id)
            .scalar()
            or 0
        )

    def get_by_case_and_id(self, case_id: int, document_id: int) -> Document | None:
        return (
            self.db.query(Document)
            .filter(Document.case_id == case_id, Document.id == document_id)
            .first()
        )

    def create(
        self,
        case_id: int,
        source_file_id: int,
        title: str,
        doc_type: str,
    ) -> Document:
        doc = Document(
            case_id=case_id,
            source_file_id=source_file_id,
            title=title,
            doc_type=doc_type,
        )
        return self.add(doc)

    def update_parse_status(
        self,
        document: Document,
        status: str,
        error: str | None = None,
        parsed_at: datetime | None = None,
    ) -> Document:
        document.parse_status = status
        document.parse_error = error
        document.parsed_at = parsed_at
        self.db.flush()
        self.db.refresh(document)
        return document


class AnchorRepository(BaseRepository[DocumentAnchor]):
    def __init__(self, db: Session):
        super().__init__(db, DocumentAnchor)

    def get_by_document(self, document_id: int) -> list[DocumentAnchor]:
        return (
            self.db.query(DocumentAnchor)
            .filter(DocumentAnchor.document_id == document_id)
            .order_by(DocumentAnchor.paragraph_index.asc())
            .all()
        )

    def get_by_case(self, case_id: int) -> list[DocumentAnchor]:
        """Return all anchors for all documents belonging to a case."""
        return (
            self.db.query(DocumentAnchor)
            .join(Document, DocumentAnchor.document_id == Document.id)
            .filter(Document.case_id == case_id)
            .order_by(DocumentAnchor.document_id.asc(), DocumentAnchor.paragraph_index.asc())
            .all()
        )

    def get_unlinked_by_case(self, case_id: int) -> list[DocumentAnchor]:
        """Return unlinked anchors for a case (used by integrity check)."""
        return (
            self.db.query(DocumentAnchor)
            .join(Document, DocumentAnchor.document_id == Document.id)
            .filter(Document.case_id == case_id, DocumentAnchor.status == "unlinked")
            .all()
        )

    def delete_by_document(self, document_id: int) -> int:
        count = (
            self.db.query(DocumentAnchor)
            .filter(DocumentAnchor.document_id == document_id)
            .delete()
        )
        self.db.flush()
        return count

    def create(
        self,
        document_id: int,
        placeholder_text: str,
        paragraph_index: int | None,
        char_offset: int | None,
        context_snippet: str | None,
    ) -> DocumentAnchor:
        anchor = DocumentAnchor(
            document_id=document_id,
            placeholder_text=placeholder_text,
            paragraph_index=paragraph_index,
            char_offset=char_offset,
            context_snippet=context_snippet,
        )
        return self.add(anchor)
