"""
Unit tests for CaseService.
Uses SQLite in-memory DB via conftest.py fixtures.
"""

import pytest
from sqlalchemy.orm import Session

from app.services.case_service import CaseService
from app.api.schemas.case import CaseCreate, CaseUpdate
from app.core.exceptions import CaseNotFoundError


class TestCaseService:
    def test_create_case_minimal(self, db: Session):
        svc = CaseService(db)
        case = svc.create_case(CaseCreate(name="테스트 사건"))
        assert case.id is not None
        assert case.name == "테스트 사건"
        assert case.status == "active"
        assert case.court is None
        assert case.case_number is None

    def test_create_case_full(self, db: Session):
        svc = CaseService(db)
        case = svc.create_case(
            CaseCreate(
                name="손해배상 청구",
                court="서울중앙지방법원",
                case_number="2024가합12345",
                description="계약 위반에 따른 손해배상",
            )
        )
        assert case.court == "서울중앙지방법원"
        assert case.case_number == "2024가합12345"

    def test_list_cases_empty(self, db: Session):
        svc = CaseService(db)
        cases, total = svc.list_cases()
        assert cases == []
        assert total == 0

    def test_list_cases_multiple(self, db: Session):
        svc = CaseService(db)
        svc.create_case(CaseCreate(name="사건 A"))
        svc.create_case(CaseCreate(name="사건 B"))
        svc.create_case(CaseCreate(name="사건 C"))
        cases, total = svc.list_cases()
        assert len(cases) == 3
        assert total == 3

    def test_get_case_found(self, db: Session):
        svc = CaseService(db)
        created = svc.create_case(CaseCreate(name="찾을 사건"))
        found = svc.get_case(created.id)
        assert found.id == created.id
        assert found.name == "찾을 사건"

    def test_get_case_not_found(self, db: Session):
        svc = CaseService(db)
        with pytest.raises(CaseNotFoundError):
            svc.get_case(99999)

    def test_update_case_name(self, db: Session):
        svc = CaseService(db)
        case = svc.create_case(CaseCreate(name="원래 이름"))
        updated = svc.update_case(case.id, CaseUpdate(name="바뀐 이름"))
        assert updated.name == "바뀐 이름"

    def test_update_case_status(self, db: Session):
        svc = CaseService(db)
        case = svc.create_case(CaseCreate(name="상태 변경 사건"))
        updated = svc.update_case(case.id, CaseUpdate(status="closed"))
        assert updated.status == "closed"

    def test_update_case_not_found(self, db: Session):
        svc = CaseService(db)
        with pytest.raises(CaseNotFoundError):
            svc.update_case(99999, CaseUpdate(name="없는 사건"))
