from datetime import datetime
from pathlib import Path
from sqlalchemy.orm import Session

from app.models.document import Document, DocumentAnchor
from app.repositories.document_repository import DocumentRepository, AnchorRepository
from app.repositories.case_repository import CaseRepository
from app.repositories.file_repository import FileRepository
from app.repositories.integrity_repository import AuditLogRepository
from app.api.schemas.document import DocumentCreate, ParsePlaceholderResponse, DocumentAnchorResponse
from app.parsers.docx_parser import DocxParser
from app.core.exceptions import (
    CaseNotFoundError,
    DocumentNotFoundError,
    SourceFileNotFoundError,
    ParseError,
)
from app.core.config import settings


class DocumentService:
    def __init__(self, db: Session):
        self.db = db
        self.doc_repo = DocumentRepository(db)
        self.anchor_repo = AnchorRepository(db)
        self.case_repo = CaseRepository(db)
        self.file_repo = FileRepository(db)
        self.audit = AuditLogRepository(db)
        self.parser = DocxParser()

    def register_document(self, case_id: int, data: DocumentCreate) -> Document:
        if self.case_repo.get_by_id(case_id) is None:
            raise CaseNotFoundError(case_id)

        sf = self.file_repo.get_by_case_and_id(case_id, data.source_file_id)
        if sf is None:
            raise SourceFileNotFoundError(data.source_file_id)

        if not sf.original_filename.lower().endswith(".docx"):
            raise ValueError(f"File {sf.original_filename} is not a DOCX file")

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
        return doc

    def list_documents(self, case_id: int) -> list[Document]:
        if self.case_repo.get_by_id(case_id) is None:
            raise CaseNotFoundError(case_id)
        return self.doc_repo.get_by_case(case_id)

    def parse_placeholders(self, case_id: int, document_id: int) -> ParsePlaceholderResponse:
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

        # Clear existing anchors for re-parse
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
            anchors_found=len(created_anchors),
            anchors=[DocumentAnchorResponse.model_validate(a) for a in created_anchors],
        )
