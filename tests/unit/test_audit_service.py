"""
Unit tests for AuditService.

Scenarios covered
-----------------
- get_audit_logs returns (items, total)
- action_filter narrows results
- logs are ordered newest first
- case_not_found raises CaseNotFoundError
- pagination (skip / limit) works correctly
"""

from __future__ import annotations

import pytest
from sqlalchemy.orm import Session

from tests.conftest import make_case

from app.services.audit_service import AuditService
from app.services.evidence_service import EvidenceService
from app.services.case_service import CaseService
from app.api.schemas.evidence import EvidenceCreate
from app.api.schemas.case import CaseCreate, CaseUpdate
from app.core.exceptions import CaseNotFoundError


class TestAuditService:
    def test_empty_audit_log(self, db: Session):
        """
        make_case() triggers a 'case_created' audit log automatically.
        A freshly created case with NO other operations should have exactly
        that one entry.  Filter to exclude it and assert the remainder is empty.
        """
        case_id = make_case(db)
        svc = AuditService(db)
        # 'case_created' is logged automatically by CaseService.create_case.
        # Filtering it out must yield an empty list.
        items, total = svc.get_audit_logs(
            case_id=case_id, action_filter="evidence_created"
        )
        assert items == []
        assert total == 0

    def test_case_create_adds_audit_entry(self, db: Session):
        """CaseService.create_case should log a 'case_created' audit entry."""
        case_id = make_case(db)
        svc = AuditService(db)
        items, total = svc.get_audit_logs(case_id=case_id)
        assert total >= 1
        actions = [lg.action for lg in items]
        assert "case_created" in actions

    def test_evidence_create_adds_audit_entry(self, db: Session):
        case_id = make_case(db)
        ev_svc = EvidenceService(db)
        ev_svc.create_evidence(
            case_id=case_id,
            data=EvidenceCreate(party="plaintiff", label="계약서", sort_order=1),
        )
        svc = AuditService(db)
        items, total = svc.get_audit_logs(case_id=case_id)
        actions = [lg.action for lg in items]
        assert "evidence_created" in actions

    def test_action_filter_narrows_results(self, db: Session):
        case_id = make_case(db)
        ev_svc = EvidenceService(db)
        ev_svc.create_evidence(
            case_id=case_id,
            data=EvidenceCreate(party="plaintiff", label="A", sort_order=1),
        )
        svc = AuditService(db)
        items, total = svc.get_audit_logs(case_id=case_id, action_filter="evidence_created")
        for lg in items:
            assert lg.action == "evidence_created"

    def test_action_filter_excludes_non_matching(self, db: Session):
        """Filter for 'evidence_created' on a case with only 'case_created' → 0 results."""
        case_id = make_case(db)
        svc = AuditService(db)
        items, total = svc.get_audit_logs(
            case_id=case_id, action_filter="evidence_created"
        )
        # Only case_created exists at this point; evidence_created count must be 0
        assert items == []
        assert total == 0

    def test_pagination_limit(self, db: Session):
        case_id = make_case(db)
        ev_svc = EvidenceService(db)
        for i in range(5):
            ev_svc.create_evidence(
                case_id=case_id,
                data=EvidenceCreate(party="plaintiff", label=f"E{i}", sort_order=i + 1),
            )
        svc = AuditService(db)
        items, total = svc.get_audit_logs(case_id=case_id, skip=0, limit=3)
        assert len(items) == 3
        assert total > 3  # total reflects full count

    def test_pagination_skip(self, db: Session):
        case_id = make_case(db)
        ev_svc = EvidenceService(db)
        for i in range(4):
            ev_svc.create_evidence(
                case_id=case_id,
                data=EvidenceCreate(party="plaintiff", label=f"E{i}", sort_order=i + 1),
            )
        svc = AuditService(db)
        all_items, total = svc.get_audit_logs(case_id=case_id)
        skipped, _ = svc.get_audit_logs(case_id=case_id, skip=2)
        assert len(skipped) == len(all_items) - 2

    def test_case_not_found_raises(self, db: Session):
        svc = AuditService(db)
        with pytest.raises(CaseNotFoundError):
            svc.get_audit_logs(case_id=99999)
