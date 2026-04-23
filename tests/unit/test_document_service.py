"""
Unit tests for DocumentService.

Scenarios covered
-----------------
Happy path
  - register_document creates a Document with correct fields
  - list_documents returns (items, total)
  - get_document returns the correct Document
  - list_anchors returns existing anchors for a document
  - parse_placeholders on a real DOCX extracts anchors and updates parse_status

Edge / failure cases
  - register with missing case raises CaseNotFoundError
  - register with missing source_file raises SourceFileNotFoundError
  - get_document with wrong id raises DocumentNotFoundError
  - parse_placeholders on non-existent file raises or returns 0 anchors
  - parse_placeholders idempotent: running twice replaces old anchors
"""

from __future__ import annotations

import tempfile
from pathlib import Path

import pytest
from sqlalchemy.orm import Session

from tests.conftest import make_case, make_source_file

from app.services.document_service import DocumentService
from app.api.schemas.document import DocumentCreate
from app.core.exceptions import (
    CaseNotFoundError,
    SourceFileNotFoundError,
    DocumentNotFoundError,
)


def _make_real_docx(paragraphs: list[str]) -> Path:
    """Create a temporary DOCX with given paragraphs and return its path."""
    from docx import Document as DocxDoc
    doc = DocxDoc()
    for p in paragraphs:
        doc.add_paragraph(p)
    tmp = tempfile.NamedTemporaryFile(suffix=".docx", delete=False)
    doc.save(tmp.name)
    tmp.close()
    return Path(tmp.name)


class TestRegisterDocument:
    def test_register_creates_document(self, db: Session):
        case_id = make_case(db)
        sf = make_source_file(db, case_id)
        svc = DocumentService(db)
        doc = svc.register_document(
            case_id=case_id,
            data=DocumentCreate(
                source_file_id=sf.id,
                title="2024 준비서면",
                doc_type="main_brief",
            ),
        )
        assert doc.id is not None
        assert doc.title == "2024 준비서면"
        assert doc.doc_type == "main_brief"
        assert doc.case_id == case_id

    def test_register_case_not_found(self, db: Session):
        svc = DocumentService(db)
        with pytest.raises(CaseNotFoundError):
            svc.register_document(
                case_id=99999,
                data=DocumentCreate(source_file_id=1, title="X", doc_type="main_brief"),
            )

    def test_register_source_file_not_found(self, db: Session):
        case_id = make_case(db)
        svc = DocumentService(db)
        with pytest.raises(SourceFileNotFoundError):
            svc.register_document(
                case_id=case_id,
                data=DocumentCreate(source_file_id=99999, title="X", doc_type="main_brief"),
            )

    def test_register_default_parse_status_is_pending(self, db: Session):
        case_id = make_case(db)
        sf = make_source_file(db, case_id)
        svc = DocumentService(db)
        doc = svc.register_document(
            case_id=case_id,
            data=DocumentCreate(source_file_id=sf.id, title="T", doc_type="main_brief"),
        )
        assert doc.parse_status == "pending"


class TestListDocuments:
    def test_list_empty(self, db: Session):
        case_id = make_case(db)
        svc = DocumentService(db)
        items, total = svc.list_documents(case_id)
        assert items == []
        assert total == 0

    def test_list_returns_registered(self, db: Session):
        case_id = make_case(db)
        # documents.source_file_id has a UNIQUE constraint — each document
        # must reference a different SourceFile row.
        sf1 = make_source_file(db, case_id, filename="brief.docx")
        sf2 = make_source_file(db, case_id, filename="exhibit.docx")
        svc = DocumentService(db)
        svc.register_document(
            case_id=case_id,
            data=DocumentCreate(source_file_id=sf1.id, title="A", doc_type="main_brief"),
        )
        svc.register_document(
            case_id=case_id,
            data=DocumentCreate(source_file_id=sf2.id, title="B", doc_type="exhibit_list"),
        )
        items, total = svc.list_documents(case_id)
        assert total == 2

    def test_list_case_not_found(self, db: Session):
        svc = DocumentService(db)
        with pytest.raises(CaseNotFoundError):
            svc.list_documents(99999)


class TestGetDocument:
    def test_get_found(self, db: Session):
        case_id = make_case(db)
        sf = make_source_file(db, case_id)
        svc = DocumentService(db)
        doc = svc.register_document(
            case_id=case_id,
            data=DocumentCreate(source_file_id=sf.id, title="T", doc_type="main_brief"),
        )
        found = svc.get_document(case_id=case_id, document_id=doc.id)
        assert found.id == doc.id

    def test_get_not_found(self, db: Session):
        case_id = make_case(db)
        svc = DocumentService(db)
        with pytest.raises(DocumentNotFoundError):
            svc.get_document(case_id=case_id, document_id=99999)


class TestParsePlaceholders:
    def test_parse_extracts_anchors(self, db: Session):
        case_id = make_case(db)
        docx_path = _make_real_docx([
            "이 사건 {{갑 제1호증}} 참조.",
            "{{갑 제2호증}} 및 {{을 제1호증}} 참조.",
        ])
        sf = make_source_file(db, case_id, storage_path=str(docx_path))
        svc = DocumentService(db)
        doc = svc.register_document(
            case_id=case_id,
            data=DocumentCreate(source_file_id=sf.id, title="T", doc_type="main_brief"),
        )
        result = svc.parse_placeholders(case_id=case_id, document_id=doc.id)
        assert result.anchors_found == 3
        placeholders = {a.placeholder_text for a in result.anchors}
        assert "{{갑 제1호증}}" in placeholders
        assert "{{갑 제2호증}}" in placeholders
        assert "{{을 제1호증}}" in placeholders

    def test_parse_updates_parse_status_to_parsed(self, db: Session):
        case_id = make_case(db)
        docx_path = _make_real_docx(["{{갑 제1호증}}"])
        sf = make_source_file(db, case_id, storage_path=str(docx_path))
        svc = DocumentService(db)
        doc = svc.register_document(
            case_id=case_id,
            data=DocumentCreate(source_file_id=sf.id, title="T", doc_type="main_brief"),
        )
        svc.parse_placeholders(case_id=case_id, document_id=doc.id)
        db.refresh(doc)
        assert doc.parse_status == "parsed"

    def test_parse_is_idempotent(self, db: Session):
        """Running parse twice replaces old anchors — count does not double."""
        case_id = make_case(db)
        docx_path = _make_real_docx(["{{갑 제1호증}}", "{{갑 제2호증}}"])
        sf = make_source_file(db, case_id, storage_path=str(docx_path))
        svc = DocumentService(db)
        doc = svc.register_document(
            case_id=case_id,
            data=DocumentCreate(source_file_id=sf.id, title="T", doc_type="main_brief"),
        )
        svc.parse_placeholders(case_id=case_id, document_id=doc.id)
        result2 = svc.parse_placeholders(case_id=case_id, document_id=doc.id)
        assert result2.anchors_found == 2

    def test_parse_no_placeholders_returns_zero(self, db: Session):
        case_id = make_case(db)
        docx_path = _make_real_docx(["플레이스홀더 없음"])
        sf = make_source_file(db, case_id, storage_path=str(docx_path))
        svc = DocumentService(db)
        doc = svc.register_document(
            case_id=case_id,
            data=DocumentCreate(source_file_id=sf.id, title="T", doc_type="main_brief"),
        )
        result = svc.parse_placeholders(case_id=case_id, document_id=doc.id)
        assert result.anchors_found == 0

    def test_list_anchors_after_parse(self, db: Session):
        case_id = make_case(db)
        docx_path = _make_real_docx(["{{갑 제1호증}}"])
        sf = make_source_file(db, case_id, storage_path=str(docx_path))
        svc = DocumentService(db)
        doc = svc.register_document(
            case_id=case_id,
            data=DocumentCreate(source_file_id=sf.id, title="T", doc_type="main_brief"),
        )
        svc.parse_placeholders(case_id=case_id, document_id=doc.id)
        anchors = svc.list_anchors(case_id=case_id, document_id=doc.id)
        assert len(anchors) == 1
        assert anchors[0].placeholder_text == "{{갑 제1호증}}"
