"""
Unit tests for EvidenceService.
"""

import pytest
from sqlalchemy.orm import Session

from app.services.case_service import CaseService
from app.services.evidence_service import EvidenceService
from app.api.schemas.case import CaseCreate
from app.api.schemas.evidence import EvidenceCreate, EvidenceUpdate
from app.core.exceptions import CaseNotFoundError, EvidenceNotFoundError


def _make_case(db: Session, name: str = "테스트 사건") -> int:
    svc = CaseService(db)
    case = svc.create_case(CaseCreate(name=name))
    return case.id


class TestEvidenceService:
    def test_create_evidence_plaintiff(self, db: Session):
        case_id = _make_case(db)
        svc = EvidenceService(db)
        e = svc.create_evidence(
            case_id=case_id,
            data=EvidenceCreate(party="plaintiff", label="계약서 사본", sort_order=0),
        )
        assert e.id is not None
        assert e.party == "plaintiff"
        assert e.label == "계약서 사본"
        assert e.sort_order == 1  # auto-appended since sort_order=0

    def test_create_evidence_defendant(self, db: Session):
        case_id = _make_case(db)
        svc = EvidenceService(db)
        e = svc.create_evidence(
            case_id=case_id,
            data=EvidenceCreate(party="defendant", label="답변서", sort_order=1),
        )
        assert e.party == "defendant"
        assert e.sort_order == 1

    def test_create_evidence_auto_sort_order(self, db: Session):
        case_id = _make_case(db)
        svc = EvidenceService(db)
        e1 = svc.create_evidence(case_id=case_id, data=EvidenceCreate(party="plaintiff", label="A", sort_order=0))
        e2 = svc.create_evidence(case_id=case_id, data=EvidenceCreate(party="plaintiff", label="B", sort_order=0))
        e3 = svc.create_evidence(case_id=case_id, data=EvidenceCreate(party="plaintiff", label="C", sort_order=0))
        assert e1.sort_order == 1
        assert e2.sort_order == 2
        assert e3.sort_order == 3

    def test_list_evidences_empty(self, db: Session):
        case_id = _make_case(db)
        svc = EvidenceService(db)
        items = svc.list_evidences(case_id=case_id)
        assert items == []

    def test_list_evidences_by_party(self, db: Session):
        case_id = _make_case(db)
        svc = EvidenceService(db)
        svc.create_evidence(case_id=case_id, data=EvidenceCreate(party="plaintiff", label="갑 증거", sort_order=0))
        svc.create_evidence(case_id=case_id, data=EvidenceCreate(party="defendant", label="을 증거", sort_order=0))
        plaintiffs = svc.list_evidences(case_id=case_id, party="plaintiff")
        defendants = svc.list_evidences(case_id=case_id, party="defendant")
        assert len(plaintiffs) == 1
        assert len(defendants) == 1

    def test_get_evidence_not_found(self, db: Session):
        case_id = _make_case(db)
        svc = EvidenceService(db)
        with pytest.raises(EvidenceNotFoundError):
            svc.get_evidence(case_id=case_id, evidence_id=99999)

    def test_update_evidence_label(self, db: Session):
        case_id = _make_case(db)
        svc = EvidenceService(db)
        e = svc.create_evidence(case_id=case_id, data=EvidenceCreate(party="plaintiff", label="원래 레이블", sort_order=0))
        updated = svc.update_evidence(case_id=case_id, evidence_id=e.id, data=EvidenceUpdate(label="바뀐 레이블"))
        assert updated.label == "바뀐 레이블"

    def test_compute_rendered_number_plaintiff(self, db: Session):
        case_id = _make_case(db)
        svc = EvidenceService(db)
        e = svc.create_evidence(case_id=case_id, data=EvidenceCreate(party="plaintiff", label="X", sort_order=3))
        number = svc.compute_rendered_number(e, rank=3)
        assert number == "갑 제3호증"

    def test_compute_rendered_number_defendant(self, db: Session):
        case_id = _make_case(db)
        svc = EvidenceService(db)
        e = svc.create_evidence(case_id=case_id, data=EvidenceCreate(party="defendant", label="Y", sort_order=1))
        number = svc.compute_rendered_number(e, rank=1)
        assert number == "을 제1호증"

    def test_evidence_case_not_found(self, db: Session):
        svc = EvidenceService(db)
        with pytest.raises(CaseNotFoundError):
            svc.create_evidence(case_id=99999, data=EvidenceCreate(party="plaintiff", label="X", sort_order=0))
