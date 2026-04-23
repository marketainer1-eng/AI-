"""
Unit tests for IntegrityService.
"""

import pytest
from sqlalchemy.orm import Session

from app.services.case_service import CaseService
from app.services.evidence_service import EvidenceService
from app.services.reference_service import ReferenceService
from app.services.integrity_service import IntegrityService
from app.api.schemas.case import CaseCreate
from app.api.schemas.evidence import EvidenceCreate
from app.api.schemas.reference import ReferenceCreate
from app.models.source_file import SourceFile
from app.models.document import Document, DocumentAnchor
from app.core.exceptions import CaseNotFoundError


def _make_case(db: Session) -> int:
    return CaseService(db).create_case(CaseCreate(name="무결성 테스트")).id


def _add_anchor(db: Session, case_id: int, placeholder: str = "{{갑 제1호증}}") -> int:
    sf = SourceFile(
        case_id=case_id,
        original_filename="brief.docx",
        stored_filename=f"sf_{placeholder}.docx",
        storage_path="/tmp/nonexistent.docx",
        role="document",
    )
    db.add(sf)
    db.flush()
    doc = Document(
        case_id=case_id,
        source_file_id=sf.id,
        title="준비서면",
        doc_type="main_brief",
    )
    db.add(doc)
    db.flush()
    anchor = DocumentAnchor(
        document_id=doc.id,
        placeholder_text=placeholder,
        paragraph_index=0,
        char_offset=0,
        status="unlinked",
    )
    db.add(anchor)
    db.flush()
    return anchor.id


class TestIntegrityService:
    def test_pass_with_no_anchors_no_evidences(self, db: Session):
        case_id = _make_case(db)
        svc = IntegrityService(db)
        report = svc.run_integrity_check(case_id)
        assert report.is_passed is True
        assert report.violation_count == 0

    def test_fail_unlinked_anchor(self, db: Session):
        case_id = _make_case(db)
        _add_anchor(db, case_id)
        svc = IntegrityService(db)
        report = svc.run_integrity_check(case_id)
        assert report.is_passed is False
        assert any(v["violation_type"] == "UNLINKED_ANCHOR" for v in report.violations)

    def test_pass_when_all_anchors_linked(self, db: Session):
        case_id = _make_case(db)
        anchor_id = _add_anchor(db, case_id)
        ev_svc = EvidenceService(db)
        ev = ev_svc.create_evidence(case_id=case_id, data=EvidenceCreate(party="plaintiff", label="A", sort_order=1))
        ref_svc = ReferenceService(db)
        ref_svc.create_reference(data=ReferenceCreate(anchor_id=anchor_id, evidence_id=ev.id))

        svc = IntegrityService(db)
        report = svc.run_integrity_check(case_id)
        # The anchor is linked but the SourceFile doesn't exist on disk
        # → should produce MISSING_FILE_ON_DISK but NOT UNLINKED_ANCHOR
        unlinked = [v for v in report.violations if v["violation_type"] == "UNLINKED_ANCHOR"]
        assert unlinked == []

    def test_case_not_found(self, db: Session):
        svc = IntegrityService(db)
        with pytest.raises(CaseNotFoundError):
            svc.run_integrity_check(99999)

    def test_report_stored_in_db(self, db: Session):
        case_id = _make_case(db)
        svc = IntegrityService(db)
        report = svc.run_integrity_check(case_id)
        assert report.id is not None
        assert report.case_id == case_id

    def test_integrity_history_returns_reports(self, db: Session):
        case_id = _make_case(db)
        svc = IntegrityService(db)
        svc.run_integrity_check(case_id)
        svc.run_integrity_check(case_id)
        history = svc.get_integrity_history(case_id=case_id, limit=10)
        assert len(history) == 2
