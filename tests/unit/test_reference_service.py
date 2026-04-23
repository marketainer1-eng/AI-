"""
Unit tests for ReferenceService.
"""

import pytest
from sqlalchemy.orm import Session

from app.services.case_service import CaseService
from app.services.evidence_service import EvidenceService
from app.services.reference_service import ReferenceService
from app.repositories.document_repository import DocumentRepository, AnchorRepository
from app.repositories.file_repository import FileRepository
from app.api.schemas.case import CaseCreate
from app.api.schemas.evidence import EvidenceCreate
from app.api.schemas.reference import ReferenceCreate
from app.models.source_file import SourceFile
from app.models.document import Document, DocumentAnchor


def _setup(db: Session):
    """Create case, source_file, document, anchor, evidence and return their IDs."""
    # Case
    case_svc = CaseService(db)
    case = case_svc.create_case(CaseCreate(name="참조 테스트 사건"))

    # SourceFile (minimal — no disk file needed for ref tests)
    sf = SourceFile(
        case_id=case.id,
        original_filename="brief.docx",
        stored_filename="abc123.docx",
        storage_path="/tmp/abc123.docx",
        role="document",
    )
    db.add(sf)
    db.flush()

    # Document
    doc = Document(
        case_id=case.id,
        source_file_id=sf.id,
        title="준비서면",
        doc_type="main_brief",
    )
    db.add(doc)
    db.flush()

    # Anchor
    anchor = DocumentAnchor(
        document_id=doc.id,
        placeholder_text="{{갑 제1호증}}",
        paragraph_index=0,
        char_offset=10,
        status="unlinked",
    )
    db.add(anchor)
    db.flush()

    # Evidence
    ev_svc = EvidenceService(db)
    evidence = ev_svc.create_evidence(
        case_id=case.id,
        data=EvidenceCreate(party="plaintiff", label="계약서", sort_order=1),
    )

    return case.id, anchor.id, evidence.id


class TestReferenceService:
    def test_create_reference(self, db: Session):
        case_id, anchor_id, evidence_id = _setup(db)
        svc = ReferenceService(db)
        ref = svc.create_reference(
            data=ReferenceCreate(anchor_id=anchor_id, evidence_id=evidence_id)
        )
        assert ref.id is not None
        assert ref.anchor_id == anchor_id
        assert ref.evidence_id == evidence_id
        assert ref.status == "active"

    def test_create_reference_marks_anchor_linked(self, db: Session):
        case_id, anchor_id, evidence_id = _setup(db)
        svc = ReferenceService(db)
        svc.create_reference(data=ReferenceCreate(anchor_id=anchor_id, evidence_id=evidence_id))
        anchor = db.get(DocumentAnchor, anchor_id)
        assert anchor.status == "linked"

    def test_create_reference_supersedes_existing(self, db: Session):
        case_id, anchor_id, evidence_id = _setup(db)
        ev_svc = EvidenceService(db)
        evidence2 = ev_svc.create_evidence(
            case_id=case_id,
            data=EvidenceCreate(party="plaintiff", label="각서", sort_order=2),
        )
        svc = ReferenceService(db)
        ref1 = svc.create_reference(data=ReferenceCreate(anchor_id=anchor_id, evidence_id=evidence_id))
        ref2 = svc.create_reference(data=ReferenceCreate(anchor_id=anchor_id, evidence_id=evidence2.id))

        db.refresh(ref1)
        assert ref1.status == "superseded"
        assert ref2.status == "active"

    def test_deactivate_reference(self, db: Session):
        case_id, anchor_id, evidence_id = _setup(db)
        svc = ReferenceService(db)
        ref = svc.create_reference(data=ReferenceCreate(anchor_id=anchor_id, evidence_id=evidence_id))
        svc.deactivate_reference(ref.id)

        from app.models.reference import Reference
        db.refresh(ref)
        assert ref.status == "superseded"
        anchor = db.get(DocumentAnchor, anchor_id)
        assert anchor.status == "unlinked"

    def test_get_reference(self, db: Session):
        case_id, anchor_id, evidence_id = _setup(db)
        svc = ReferenceService(db)
        ref = svc.create_reference(data=ReferenceCreate(anchor_id=anchor_id, evidence_id=evidence_id))
        found = svc.get_reference(ref.id)
        assert found is not None
        assert found.id == ref.id

    def test_get_reference_none(self, db: Session):
        from app.core.exceptions import ReferenceNotFoundError
        svc = ReferenceService(db)
        with pytest.raises(ReferenceNotFoundError):
            svc.get_reference(99999)
