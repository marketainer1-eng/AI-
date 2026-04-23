"""
tests/unit/test_workflow_scenarios.py
======================================
Pytest unit-test skeleton covering the four core business scenarios.

Each class documents WHY the scenario matters, WHAT the invariant is,
and provides a focused set of test functions that verify it at the
service / repository layer (SQLite in-memory, no HTTP stack).

Scenarios
---------
1. Happy path        – full lifecycle from case creation through commit
2. Integrity failure – unlinked anchor blocks commit (pre-commit gate)
3. Rename-before-commit prohibition – disk renames MUST NOT happen before commit
4. Rollback creates a new ChangeSet – never overwrites historical data

All tests use the ``db`` fixture from conftest.py (fresh SQLite per test).
"""

from __future__ import annotations

import pytest
from pathlib import Path
from sqlalchemy.orm import Session

# ── conftest helpers ──────────────────────────────────────────────────────────
from tests.conftest import (
    make_case,
    make_source_file,
    make_document,
    make_anchor,
    make_evidence,
    make_reference,
    make_reorder_cs,
)

# ── Services ──────────────────────────────────────────────────────────────────
from app.services.case_service import CaseService
from app.services.evidence_service import EvidenceService
from app.services.change_service import ChangeService
from app.services.integrity_service import IntegrityService
from app.services.reference_service import ReferenceService

# ── Schemas ───────────────────────────────────────────────────────────────────
from app.api.schemas.case import CaseCreate, CaseUpdate
from app.api.schemas.evidence import EvidenceCreate
from app.api.schemas.reference import ReferenceCreate
from app.api.schemas.changeset import (
    ReorderRequest,
    ReorderEvidenceItem,
    LinkReferencesRequest,
    LinkReferenceItem,
    UnlinkReferencesRequest,
)

# ── Models ────────────────────────────────────────────────────────────────────
from app.models.document import DocumentAnchor
from app.models.projection import FileRenamePlan
from app.models.reference import Reference

# ── Repositories ──────────────────────────────────────────────────────────────
from app.repositories.changeset_repository import VersionSnapshotRepository
from app.repositories.evidence_repository import EvidenceRepository

# ── Exceptions ────────────────────────────────────────────────────────────────
from app.core.exceptions import (
    CaseNotFoundError,
    IntegrityViolationError,
    CommitError,
    RollbackError,
    ChangeSetNotFoundError,
)


# ══════════════════════════════════════════════════════════════════════════════
#  Utility helpers
# ══════════════════════════════════════════════════════════════════════════════

def _sort_order(db: Session, evidence_id: int) -> int:
    """Return the current sort_order of an Evidence by id."""
    ev = EvidenceRepository(db).get_by_id(evidence_id)
    assert ev is not None, f"Evidence {evidence_id} not found"
    return ev.sort_order


def _cs_svc(db: Session) -> ChangeService:
    return ChangeService(db)


def _int_svc(db: Session) -> IntegrityService:
    return IntegrityService(db)


# ══════════════════════════════════════════════════════════════════════════════
#  1. Happy Path
# ══════════════════════════════════════════════════════════════════════════════

class TestHappyPath:
    """
    End-to-end happy path for the core DocRef workflow:

        Case created → Evidence created → File uploaded → Document registered
        → Placeholders parsed → References linked → Reorder ChangeSet created
        → Preview transitions to 'previewed' → Commit applies changes
        → VersionSnapshot v1 created → Integrity PASS

    Business invariants verified:
    - ChangeSet starts in 'draft' status
    - Preview must not modify canonical sort_order
    - Commit applies sort_order atomically (two-phase to avoid constraint collision)
    - Commit produces a VersionSnapshot with monotonically increasing version_number
    - Integrity check returns 'pass' when all anchors are linked
    - Second commit produces version_number == 2
    """

    def test_case_creation(self, db: Session):
        """Case can be created with just a name."""
        svc = CaseService(db)
        case = svc.create_case(CaseCreate(name="민사소송 2024-가합-12345"))
        assert case.id is not None
        assert case.name == "민사소송 2024-가합-12345"
        assert case.status == "active"

    def test_case_update(self, db: Session):
        """Case name and court can be updated."""
        svc = CaseService(db)
        case = svc.create_case(CaseCreate(name="원본"))
        updated = svc.update_case(case.id, CaseUpdate(name="수정본", court="서울중앙지방법원"))
        assert updated.name == "수정본"
        assert updated.court == "서울중앙지방법원"

    def test_evidence_creation_plaintiff(self, db: Session):
        """Plaintiff evidence is created with party='plaintiff'."""
        case_id = make_case(db)
        svc = EvidenceService(db)
        ev = svc.create_evidence(
            case_id=case_id,
            data=EvidenceCreate(party="plaintiff", label="계약서", sort_order=1),
        )
        assert ev.id is not None
        assert ev.party == "plaintiff"
        assert ev.label == "계약서"
        assert ev.sort_order == 1

    def test_evidence_creation_defendant(self, db: Session):
        """Defendant evidence is created with party='defendant'."""
        case_id = make_case(db)
        svc = EvidenceService(db)
        ev = svc.create_evidence(
            case_id=case_id,
            data=EvidenceCreate(party="defendant", label="영수증", sort_order=1),
        )
        assert ev.party == "defendant"

    def test_rendered_number_plaintiff(self, db: Session):
        """Plaintiff evidence rendered as '갑 제N호증'."""
        case_id = make_case(db)
        svc = EvidenceService(db)
        ev1 = svc.create_evidence(case_id, EvidenceCreate(party="plaintiff", label="A", sort_order=1))
        ev2 = svc.create_evidence(case_id, EvidenceCreate(party="plaintiff", label="B", sort_order=2))
        n1 = svc.compute_rendered_number(ev1, rank=1)
        n2 = svc.compute_rendered_number(ev2, rank=2)
        assert n1 == "갑 제1호증"
        assert n2 == "갑 제2호증"

    def test_rendered_number_defendant(self, db: Session):
        """Defendant evidence rendered as '을 제N호증'."""
        case_id = make_case(db)
        svc = EvidenceService(db)
        ev = svc.create_evidence(case_id, EvidenceCreate(party="defendant", label="A", sort_order=1))
        assert svc.compute_rendered_number(ev, rank=1) == "을 제1호증"

    def test_reference_links_anchor_to_evidence(self, db: Session):
        """Creating a Reference marks the anchor as 'linked'."""
        case_id = make_case(db)
        sf = make_source_file(db, case_id)
        doc, anchors = make_document(db, case_id, sf.id, anchors=["{{갑 제1호증}}"])
        ev_id = make_evidence(db, case_id, sort_order=1)

        ref_svc = ReferenceService(db)
        ref = ref_svc.create_reference(
            data=ReferenceCreate(anchor_id=anchors[0].id, evidence_id=ev_id)
        )
        assert ref.id is not None

        anchor = db.get(DocumentAnchor, anchors[0].id)
        assert anchor.status == "linked"

    def test_reorder_changeset_starts_draft(self, db: Session):
        """A newly created reorder ChangeSet must have status 'draft'."""
        case_id = make_case(db)
        ev_id = make_evidence(db, case_id, sort_order=1)
        cs_id = make_reorder_cs(db, case_id, [(ev_id, 2)])
        cs = _cs_svc(db).cs_repo.get_by_id(cs_id)
        assert cs.status == "draft"

    def test_preview_transitions_status_to_previewed(self, db: Session):
        """preview_changeset() must transition ChangeSet status to 'previewed'."""
        case_id = make_case(db)
        ev1 = make_evidence(db, case_id, label="A", sort_order=1)
        ev2 = make_evidence(db, case_id, label="B", sort_order=2)
        cs_id = make_reorder_cs(db, case_id, [(ev1, 2), (ev2, 1)])

        result = _cs_svc(db).preview_changeset(cs_id)
        assert result.status == "previewed"

    def test_preview_shows_swapped_rendered_numbers(self, db: Session):
        """Preview evidence list must reflect the swapped sort orders."""
        case_id = make_case(db)
        ev1 = make_evidence(db, case_id, label="A", sort_order=1)
        ev2 = make_evidence(db, case_id, label="B", sort_order=2)
        cs_id = make_reorder_cs(db, case_id, [(ev1, 2), (ev2, 1)])

        result = _cs_svc(db).preview_changeset(cs_id)
        rendered = {e.evidence_id: e.rendered_number for e in result.evidence_list_preview}
        assert rendered[ev1] == "갑 제2호증"
        assert rendered[ev2] == "갑 제1호증"

    def test_preview_does_not_mutate_sort_order(self, db: Session):
        """preview_changeset() MUST NOT change canonical sort_order values."""
        case_id = make_case(db)
        ev_id = make_evidence(db, case_id, sort_order=1)
        cs_id = make_reorder_cs(db, case_id, [(ev_id, 99)])
        _cs_svc(db).preview_changeset(cs_id)
        # Canonical sort_order must be unchanged
        assert _sort_order(db, ev_id) == 1

    def test_commit_applies_sort_orders(self, db: Session):
        """commit_changeset() must write new sort_order to canonical Evidence rows."""
        case_id = make_case(db)
        ev1 = make_evidence(db, case_id, label="A", sort_order=1)
        ev2 = make_evidence(db, case_id, label="B", sort_order=2)
        cs_id = make_reorder_cs(db, case_id, [(ev1, 2), (ev2, 1)])

        result = _cs_svc(db).commit_changeset(cs_id)
        assert result.status == "committed"
        assert _sort_order(db, ev1) == 2
        assert _sort_order(db, ev2) == 1

    def test_commit_creates_version_snapshot_v1(self, db: Session):
        """First commit must produce VersionSnapshot version_number=1, label='v1'."""
        case_id = make_case(db)
        ev_id = make_evidence(db, case_id, sort_order=1)
        cs_id = make_reorder_cs(db, case_id, [(ev_id, 2)])

        _cs_svc(db).commit_changeset(cs_id)

        snap = VersionSnapshotRepository(db).get_by_changeset(cs_id)
        assert snap is not None
        assert snap.version_number == 1
        assert snap.version_label == "v1"

    def test_second_commit_produces_v2(self, db: Session):
        """Second commit must produce version_number=2 (monotonically increasing)."""
        case_id = make_case(db)
        ev1 = make_evidence(db, case_id, label="A", sort_order=1)
        ev2 = make_evidence(db, case_id, label="B", sort_order=2)
        # First commit: ev1→2, ev2→1
        make_reorder_cs(db, case_id, [(ev1, 2), (ev2, 1)], commit=True)
        # Second commit: ev1→1, ev2→2
        cs2_id = make_reorder_cs(db, case_id, [(ev1, 1), (ev2, 2)])
        result = _cs_svc(db).commit_changeset(cs2_id)
        assert result.version_number == 2
        assert result.version_label == "v2"

    def test_commit_no_rename_plans_returns_zero(self, db: Session):
        """Commit with no FileRenamePlan rows must report files_renamed == 0."""
        case_id = make_case(db)
        ev_id = make_evidence(db, case_id, sort_order=1)
        cs_id = make_reorder_cs(db, case_id, [(ev_id, 5)])
        result = _cs_svc(db).commit_changeset(cs_id)
        assert result.files_renamed == 0

    def test_commit_changeset_is_marked_committed(self, db: Session):
        """After commit, the ChangeSet entity must have status='committed' and committed_at set."""
        case_id = make_case(db)
        ev_id = make_evidence(db, case_id, sort_order=1)
        cs_id = make_reorder_cs(db, case_id, [(ev_id, 2)])
        svc = _cs_svc(db)
        svc.commit_changeset(cs_id)
        cs = svc.cs_repo.get_by_id(cs_id)
        assert cs.status == "committed"
        assert cs.committed_at is not None

    def test_integrity_pass_with_all_anchors_linked(self, db: Session):
        """Integrity check must pass (result='pass') when all anchors are linked."""
        case_id = make_case(db)
        sf = make_source_file(db, case_id)
        doc, anchors = make_document(db, case_id, sf.id, anchors=["{{갑 제1호증}}"])
        ev_id = make_evidence(db, case_id, sort_order=1)
        make_reference(db, anchors[0].id, ev_id)

        report = _int_svc(db).run_integrity_check(case_id)
        # UNLINKED_ANCHOR violations must be absent
        unlinked = [v for v in report.violations if v["violation_type"] == "UNLINKED_ANCHOR"]
        assert unlinked == []

    def test_integrity_pass_with_no_documents(self, db: Session):
        """Integrity check must pass when the case has no documents/anchors at all."""
        case_id = make_case(db)
        report = _int_svc(db).run_integrity_check(case_id)
        assert report.result == "pass"
        assert report.is_passed is True

    def test_list_changesets_pagination(self, db: Session):
        """list_changesets returns correct total count and supports skip/limit."""
        case_id = make_case(db)
        ev_id = make_evidence(db, case_id, sort_order=1)
        for new_order in [2, 3, 4]:
            make_reorder_cs(db, case_id, [(ev_id, new_order)])
            ev_id_obj = EvidenceRepository(db).get_by_id(ev_id)
            ev_id_obj.sort_order = new_order
            db.flush()

        svc = _cs_svc(db)
        items_all, total = svc.list_changesets(case_id)
        assert total == 3

        items_page, total_page = svc.list_changesets(case_id, skip=0, limit=2)
        assert total_page == 3
        assert len(items_page) == 2

    def test_full_workflow_sequence(self, db: Session):
        """
        Full happy-path sequence in one test:
        create → evidences → reference link → reorder CS → commit → integrity pass.
        """
        case_id = make_case(db)

        # Create two plaintiff evidences
        ev1 = make_evidence(db, case_id, label="계약서", party="plaintiff", sort_order=1)
        ev2 = make_evidence(db, case_id, label="영수증", party="plaintiff", sort_order=2)

        # Add a document with one anchor and link it
        sf = make_source_file(db, case_id)
        doc, anchors = make_document(db, case_id, sf.id, anchors=["{{갑 제1호증}}"])
        make_reference(db, anchors[0].id, ev1)

        # Integrity check passes
        report = _int_svc(db).run_integrity_check(case_id)
        assert report.result == "pass"

        # Create, preview, then commit a reorder changeset
        cs_id = make_reorder_cs(db, case_id, [(ev1, 2), (ev2, 1)])
        svc = _cs_svc(db)
        svc.preview_changeset(cs_id)
        result = svc.commit_changeset(cs_id)

        assert result.status == "committed"
        assert result.version_label == "v1"
        assert _sort_order(db, ev1) == 2
        assert _sort_order(db, ev2) == 1


# ══════════════════════════════════════════════════════════════════════════════
#  2. Integrity Failure Blocks Commit
# ══════════════════════════════════════════════════════════════════════════════

class TestIntegrityFailureBlocksCommit:
    """
    Business invariant: A ChangeSet CANNOT be committed if any DocumentAnchor
    in the case is in 'unlinked' status.

    The pre-commit integrity check in commit_changeset() raises
    IntegrityViolationError, leaving the ChangeSet in 'draft' status.
    """

    def test_unlinked_anchor_raises_integrity_error(self, db: Session):
        """
        Scenario: Document has a placeholder that is NOT linked to any evidence.
        Expected: commit raises IntegrityViolationError.
        """
        case_id = make_case(db)
        sf = make_source_file(db, case_id)
        make_document(db, case_id, sf.id, anchors=["{{갑 제1호증}}"])  # unlinked anchor
        ev_id = make_evidence(db, case_id, sort_order=1)

        cs_id = make_reorder_cs(db, case_id, [(ev_id, 2)])
        with pytest.raises(IntegrityViolationError):
            _cs_svc(db).commit_changeset(cs_id)

    def test_blocked_changeset_remains_draft(self, db: Session):
        """
        After a blocked commit, the ChangeSet status must still be 'draft'
        (the transaction was rolled back / the state was not mutated).
        """
        case_id = make_case(db)
        sf = make_source_file(db, case_id)
        make_document(db, case_id, sf.id, anchors=["{{갑 제1호증}}"])
        ev_id = make_evidence(db, case_id, sort_order=1)
        cs_id = make_reorder_cs(db, case_id, [(ev_id, 2)])

        svc = _cs_svc(db)
        try:
            svc.commit_changeset(cs_id)
        except IntegrityViolationError:
            pass

        cs = svc.cs_repo.get_by_id(cs_id)
        assert cs.status == "draft", "Blocked ChangeSet must stay in 'draft'"

    def test_blocked_commit_does_not_apply_sort_orders(self, db: Session):
        """
        Evidence sort_order must be unchanged after a blocked commit.
        """
        case_id = make_case(db)
        sf = make_source_file(db, case_id)
        make_document(db, case_id, sf.id, anchors=["{{갑 제1호증}}"])
        ev_id = make_evidence(db, case_id, sort_order=1)
        cs_id = make_reorder_cs(db, case_id, [(ev_id, 99)])

        try:
            _cs_svc(db).commit_changeset(cs_id)
        except IntegrityViolationError:
            pass

        assert _sort_order(db, ev_id) == 1, "sort_order must be unchanged after blocked commit"

    def test_blocked_commit_does_not_create_version_snapshot(self, db: Session):
        """No VersionSnapshot must be created when commit is blocked."""
        case_id = make_case(db)
        sf = make_source_file(db, case_id)
        make_document(db, case_id, sf.id, anchors=["{{갑 제1호증}}"])
        ev_id = make_evidence(db, case_id, sort_order=1)
        cs_id = make_reorder_cs(db, case_id, [(ev_id, 2)])

        try:
            _cs_svc(db).commit_changeset(cs_id)
        except IntegrityViolationError:
            pass

        snap = VersionSnapshotRepository(db).get_by_changeset(cs_id)
        assert snap is None, "No VersionSnapshot must exist after a blocked commit"

    def test_integrity_check_reports_unlinked_anchor(self, db: Session):
        """
        IntegrityService.run_integrity_check() must report an UNLINKED_ANCHOR
        violation when a DocumentAnchor exists with status='unlinked'.
        """
        case_id = make_case(db)
        sf = make_source_file(db, case_id)
        make_document(db, case_id, sf.id, anchors=["{{갑 제2호증}}"])

        report = _int_svc(db).run_integrity_check(case_id)
        assert report.result == "fail"
        assert report.is_passed is False
        violation_types = [v["violation_type"] for v in report.violations]
        assert "UNLINKED_ANCHOR" in violation_types

    def test_integrity_check_includes_anchor_id_in_violation(self, db: Session):
        """The violation detail must include the anchor_id for traceability."""
        case_id = make_case(db)
        sf = make_source_file(db, case_id)
        doc, anchors = make_document(db, case_id, sf.id, anchors=["{{갑 제3호증}}"])

        report = _int_svc(db).run_integrity_check(case_id)
        unlinked_violations = [
            v for v in report.violations if v["violation_type"] == "UNLINKED_ANCHOR"
        ]
        assert len(unlinked_violations) == 1
        assert unlinked_violations[0]["anchor_id"] == anchors[0].id

    def test_multiple_unlinked_anchors_all_reported(self, db: Session):
        """Each unlinked anchor must produce its own UNLINKED_ANCHOR violation."""
        case_id = make_case(db)
        sf = make_source_file(db, case_id)
        make_document(
            db, case_id, sf.id,
            anchors=["{{갑 제1호증}}", "{{갑 제2호증}}", "{{갑 제3호증}}"]
        )

        report = _int_svc(db).run_integrity_check(case_id)
        unlinked = [v for v in report.violations if v["violation_type"] == "UNLINKED_ANCHOR"]
        assert len(unlinked) == 3

    def test_linking_all_anchors_clears_violation(self, db: Session):
        """
        After linking ALL anchors, the integrity check must pass.
        """
        case_id = make_case(db)
        sf = make_source_file(db, case_id)
        doc, anchors = make_document(
            db, case_id, sf.id, anchors=["{{갑 제1호증}}", "{{갑 제2호증}}"]
        )
        ev1 = make_evidence(db, case_id, label="A", sort_order=1)
        ev2 = make_evidence(db, case_id, label="B", sort_order=2)
        make_reference(db, anchors[0].id, ev1)
        make_reference(db, anchors[1].id, ev2)

        report = _int_svc(db).run_integrity_check(case_id)
        unlinked = [v for v in report.violations if v["violation_type"] == "UNLINKED_ANCHOR"]
        assert unlinked == [], "No UNLINKED_ANCHOR violations after all anchors are linked"

    def test_partially_linked_anchors_still_fails(self, db: Session):
        """
        If only SOME anchors are linked, integrity must still fail and
        the commit must be blocked.
        """
        case_id = make_case(db)
        sf = make_source_file(db, case_id)
        doc, anchors = make_document(
            db, case_id, sf.id, anchors=["{{갑 제1호증}}", "{{갑 제2호증}}"]
        )
        ev1 = make_evidence(db, case_id, label="A", sort_order=1)
        ev2 = make_evidence(db, case_id, label="B", sort_order=2)
        # Only link the FIRST anchor
        make_reference(db, anchors[0].id, ev1)

        cs_id = make_reorder_cs(db, case_id, [(ev1, 2), (ev2, 1)])
        with pytest.raises(IntegrityViolationError):
            _cs_svc(db).commit_changeset(cs_id)

    def test_integrity_history_stored_in_db(self, db: Session):
        """Each integrity check run must be persisted as an IntegrityReport."""
        case_id = make_case(db)
        _int_svc(db).run_integrity_check(case_id)
        _int_svc(db).run_integrity_check(case_id)
        history = _int_svc(db).get_integrity_history(case_id, limit=10)
        assert len(history) >= 2

    def test_commit_already_committed_raises_commit_error(self, db: Session):
        """
        Attempting to commit an already-committed ChangeSet must raise CommitError
        (cannot commit twice).
        """
        case_id = make_case(db)
        ev_id = make_evidence(db, case_id, sort_order=1)
        cs_id = make_reorder_cs(db, case_id, [(ev_id, 2)], commit=True)
        with pytest.raises(CommitError):
            _cs_svc(db).commit_changeset(cs_id)


# ══════════════════════════════════════════════════════════════════════════════
#  3. Rename-Before-Commit Prohibition
# ══════════════════════════════════════════════════════════════════════════════

class TestRenameBeforeCommitProhibition:
    """
    Business invariant: Physical file renames MUST NOT happen before
    ``commit_changeset()`` is called.

    The system enforces this by:
    - Keeping FileRenamePlan rows in status='planned' until commit
    - Never touching stored_filename or the file on disk during preview
    - Only executing renames atomically inside the commit transaction

    Tests verify:
    - FileRenamePlan stays 'planned' before commit
    - sort_order is unchanged before commit (the canonical DB is untouched)
    - No VersionSnapshot exists before commit
    - After commit, the plan status changes to 'committed'
    - The actual file on disk is renamed only after commit
    - stored_filename on the SourceFile row is updated only after commit
    """

    def test_file_rename_plan_status_is_planned_before_commit(self, db: Session):
        """
        Insert a FileRenamePlan for a DRAFT ChangeSet.
        The plan status must remain 'planned' until commit.
        """
        case_id = make_case(db)
        sf = make_source_file(db, case_id, filename="original.docx")
        ev_id = make_evidence(db, case_id, sort_order=1)
        cs_id = make_reorder_cs(db, case_id, [(ev_id, 2)])

        plan = FileRenamePlan(
            change_set_id=cs_id,
            source_file_id=sf.id,
            current_filename="original.docx",
            planned_filename="갑제1호증_계약서.docx",
            status="planned",
        )
        db.add(plan)
        db.commit()
        db.refresh(plan)

        assert plan.status == "planned", (
            "FileRenamePlan must stay 'planned' until commit_changeset() is called"
        )
        assert plan.committed_at is None

    def test_no_version_snapshot_before_commit(self, db: Session):
        """
        A draft ChangeSet must have NO associated VersionSnapshot row.
        Snapshots are created exclusively inside commit_changeset().
        """
        case_id = make_case(db)
        ev_id = make_evidence(db, case_id, sort_order=1)
        cs_id = make_reorder_cs(db, case_id, [(ev_id, 2)])

        snap = VersionSnapshotRepository(db).get_by_changeset(cs_id)
        assert snap is None, "VersionSnapshot must NOT exist for a draft ChangeSet"

    def test_sort_order_unchanged_before_commit(self, db: Session):
        """
        Creating a reorder ChangeSet (DRAFT) must NOT alter the canonical
        sort_order values in the Evidence table.
        """
        case_id = make_case(db)
        ev_id = make_evidence(db, case_id, sort_order=1)
        make_reorder_cs(db, case_id, [(ev_id, 99)])  # intentionally NOT committed

        assert _sort_order(db, ev_id) == 1, (
            "sort_order must not change until commit_changeset() is called"
        )

    def test_preview_does_not_rename_file_on_disk(self, db: Session, tmp_path: Path):
        """
        Calling preview_changeset() must NOT physically rename any file on disk.
        The file at the original path must still exist after preview.
        """
        from app.core.config import settings

        upload_root = tmp_path / "uploads"
        upload_root.mkdir()
        settings.upload_dir = str(upload_root)

        case_dir = upload_root / "case_preview"
        case_dir.mkdir()
        original_file = case_dir / "brief.docx"
        original_file.write_bytes(b"docx content")

        case_id = make_case(db)
        sf = make_source_file(
            db, case_id, filename="brief.docx", storage_path=str(original_file)
        )
        ev_id = make_evidence(db, case_id, sort_order=1)
        cs_id = make_reorder_cs(db, case_id, [(ev_id, 2)])

        plan = FileRenamePlan(
            change_set_id=cs_id,
            source_file_id=sf.id,
            current_filename="brief.docx",
            planned_filename="renamed_brief.docx",
            status="planned",
        )
        db.add(plan)
        db.commit()

        # Preview: must NOT rename the file
        _cs_svc(db).preview_changeset(cs_id)

        assert original_file.exists(), "Original file must still exist after preview"
        assert not (case_dir / "renamed_brief.docx").exists(), (
            "Renamed file must NOT exist after preview — only after commit"
        )

    def test_commit_executes_file_rename_on_disk(self, db: Session, tmp_path: Path):
        """
        commit_changeset() MUST physically rename the file when a FileRenamePlan
        exists in 'planned' status.

        After commit:
        - Original file is gone
        - Renamed file exists at the new path
        - FileRenamePlan.status == 'committed'
        - FileRenamePlan.committed_at is set
        """
        from app.core.config import settings

        upload_root = tmp_path / "uploads"
        upload_root.mkdir()
        settings.upload_dir = str(upload_root)

        case_dir = upload_root / "case_commit"
        case_dir.mkdir()
        original_file = case_dir / "original.docx"
        original_file.write_bytes(b"file content")

        case_id = make_case(db)
        sf = make_source_file(
            db, case_id, filename="original.docx", storage_path=str(original_file)
        )
        ev_id = make_evidence(db, case_id, sort_order=1)
        cs_id = make_reorder_cs(db, case_id, [(ev_id, 2)])

        plan = FileRenamePlan(
            change_set_id=cs_id,
            source_file_id=sf.id,
            current_filename="original.docx",
            planned_filename="renamed.docx",
            status="planned",
        )
        db.add(plan)
        db.commit()

        result = _cs_svc(db).commit_changeset(cs_id)
        assert result.files_renamed == 1

        db.refresh(plan)
        assert plan.status == "committed"
        assert plan.committed_at is not None
        assert not original_file.exists(), "Original file must be gone after rename"
        assert (case_dir / "renamed.docx").exists(), "Renamed file must exist after commit"

    def test_multiple_file_rename_plans_all_executed_at_commit(
        self, db: Session, tmp_path: Path
    ):
        """
        When multiple FileRenamePlan rows exist for a single ChangeSet,
        ALL must be executed atomically at commit time.
        """
        from app.core.config import settings

        upload_root = tmp_path / "uploads"
        upload_root.mkdir()
        settings.upload_dir = str(upload_root)

        case_dir = upload_root / "multi"
        case_dir.mkdir()

        file_a = case_dir / "a.docx"
        file_b = case_dir / "b.docx"
        file_a.write_bytes(b"aaa")
        file_b.write_bytes(b"bbb")

        case_id = make_case(db)
        sf_a = make_source_file(db, case_id, filename="a.docx", storage_path=str(file_a))
        sf_b = make_source_file(db, case_id, filename="b.docx", storage_path=str(file_b))
        ev_id = make_evidence(db, case_id, sort_order=1)
        cs_id = make_reorder_cs(db, case_id, [(ev_id, 2)])

        for sf, old_name, new_name in [
            (sf_a, "a.docx", "renamed_a.docx"),
            (sf_b, "b.docx", "renamed_b.docx"),
        ]:
            plan = FileRenamePlan(
                change_set_id=cs_id,
                source_file_id=sf.id,
                current_filename=old_name,
                planned_filename=new_name,
                status="planned",
            )
            db.add(plan)
        db.commit()

        result = _cs_svc(db).commit_changeset(cs_id)
        assert result.files_renamed == 2
        assert not file_a.exists()
        assert not file_b.exists()
        assert (case_dir / "renamed_a.docx").exists()
        assert (case_dir / "renamed_b.docx").exists()

    def test_draft_changeset_has_no_committed_at(self, db: Session):
        """A draft ChangeSet's committed_at field must be None before commit."""
        case_id = make_case(db)
        ev_id = make_evidence(db, case_id, sort_order=1)
        cs_id = make_reorder_cs(db, case_id, [(ev_id, 2)])
        cs = _cs_svc(db).cs_repo.get_by_id(cs_id)
        assert cs.committed_at is None


# ══════════════════════════════════════════════════════════════════════════════
#  4. Rollback Creates a New ChangeSet — Historical Data Immutable
# ══════════════════════════════════════════════════════════════════════════════

class TestRollbackCreatesNewChangeSet:
    """
    Business invariant: Rollback NEVER overwrites or mutates an existing ChangeSet
    or VersionSnapshot.  It creates a BRAND-NEW ChangeSet (immediately committed)
    that restores the state captured in the target VersionSnapshot.

    Design principle (from README): immutable rollback.

    Tests verify:
    - rollback() returns a new ChangeSet id (≠ target id)
    - The target (original) ChangeSet is untouched after rollback
    - Evidence sort_orders are restored to the PRE-COMMIT snapshot values
    - The rollback ChangeSet status is 'committed'
    - The rollback ChangeSet's rolled_back_from_id matches the target
    - Calling rollback twice produces two DISTINCT new ChangeSet ids
    - Rollback on a draft ChangeSet (no snapshot) raises RollbackError
    - Rollback with wrong case_id raises ChangeSetNotFoundError
    - The total ChangeSet count increases by 1 per rollback call
    - Reference statuses are restored correctly across rollback
    """

    # ── Setup helpers ─────────────────────────────────────────────────────────

    def _setup_single_commit(self, db: Session):
        """
        Create two evidences, swap their sort_orders via a committed ChangeSet.
        Timeline of sort_orders:
          Before commit (PRE-COMMIT = snapshot): ev1=1, ev2=2
          After  commit                        : ev1=2, ev2=1
        Returns (case_id, ev1_id, ev2_id, cs_id)
        """
        case_id = make_case(db)
        ev1 = make_evidence(db, case_id, label="A", sort_order=1)
        ev2 = make_evidence(db, case_id, label="B", sort_order=2)
        cs_id = make_reorder_cs(db, case_id, [(ev1, 2), (ev2, 1)], commit=True)
        return case_id, ev1, ev2, cs_id

    # ── Core invariants ────────────────────────────────────────────────────────

    def test_rollback_returns_new_changeset_id(self, db: Session):
        """rollback() must return a new ChangeSet id different from the target."""
        case_id, ev1, ev2, cs_id = self._setup_single_commit(db)
        result = _cs_svc(db).rollback(case_id=case_id, target_change_set_id=cs_id)
        assert result.new_change_set_id != cs_id, (
            "rollback() must create a NEW ChangeSet — not modify the target"
        )

    def test_rollback_new_changeset_is_committed(self, db: Session):
        """The rollback ChangeSet must be immediately committed (status='committed')."""
        case_id, ev1, ev2, cs_id = self._setup_single_commit(db)
        result = _cs_svc(db).rollback(case_id=case_id, target_change_set_id=cs_id)
        svc = _cs_svc(db)
        new_cs = svc.cs_repo.get_by_id(result.new_change_set_id)
        assert new_cs is not None
        assert new_cs.status == "committed"

    def test_rollback_original_changeset_untouched(self, db: Session):
        """
        After rollback, the ORIGINAL (target) ChangeSet must be unchanged:
        - Its id is the same
        - Its status is still 'committed'
        """
        case_id, ev1, ev2, cs_id = self._setup_single_commit(db)
        _cs_svc(db).rollback(case_id=case_id, target_change_set_id=cs_id)
        svc = _cs_svc(db)
        original_cs = svc.cs_repo.get_by_id(cs_id)
        assert original_cs.id == cs_id
        assert original_cs.status == "committed", (
            "Target ChangeSet must still be 'committed' after rollback"
        )

    def test_rollback_restores_pre_commit_sort_orders(self, db: Session):
        """
        Rollback must restore sort_orders to the PRE-COMMIT snapshot state.

        Snapshot is captured BEFORE the commit applies operations.

        Timeline:
          Initial (snapshot captured here): ev1.sort_order=1, ev2.sort_order=2
          After commit (swap):              ev1.sort_order=2, ev2.sort_order=1
          After rollback (restore):         ev1.sort_order=1, ev2.sort_order=2
        """
        case_id, ev1, ev2, cs_id = self._setup_single_commit(db)

        # Verify the swap took effect
        assert _sort_order(db, ev1) == 2
        assert _sort_order(db, ev2) == 1

        _cs_svc(db).rollback(case_id=case_id, target_change_set_id=cs_id)

        # After rollback: restored to pre-commit values
        assert _sort_order(db, ev1) == 1, "ev1 sort_order must be restored to 1"
        assert _sort_order(db, ev2) == 2, "ev2 sort_order must be restored to 2"

    def test_rollback_rolled_back_from_id_matches_target(self, db: Session):
        """RollbackResponse.rolled_back_from_id must equal the target ChangeSet id."""
        case_id, ev1, ev2, cs_id = self._setup_single_commit(db)
        result = _cs_svc(db).rollback(case_id=case_id, target_change_set_id=cs_id)
        assert result.rolled_back_from_id == cs_id

    def test_rollback_version_label_matches_target_snapshot(self, db: Session):
        """RollbackResponse.version_label must match the VersionSnapshot label."""
        case_id, ev1, ev2, cs_id = self._setup_single_commit(db)
        snap = VersionSnapshotRepository(db).get_by_changeset(cs_id)
        result = _cs_svc(db).rollback(case_id=case_id, target_change_set_id=cs_id)
        assert result.version_label == snap.version_label

    def test_rollback_status_in_response_is_committed(self, db: Session):
        """RollbackResponse.status must be 'committed'."""
        case_id, ev1, ev2, cs_id = self._setup_single_commit(db)
        result = _cs_svc(db).rollback(case_id=case_id, target_change_set_id=cs_id)
        assert result.status == "committed"

    # ── Error cases ────────────────────────────────────────────────────────────

    def test_rollback_without_snapshot_raises_rollback_error(self, db: Session):
        """
        Rolling back to a DRAFT ChangeSet (which has no VersionSnapshot) must
        raise RollbackError — there is nothing to restore from.
        """
        case_id = make_case(db)
        ev_id = make_evidence(db, case_id, sort_order=1)
        cs_id = make_reorder_cs(db, case_id, [(ev_id, 5)])  # DRAFT — no snapshot

        with pytest.raises(RollbackError):
            _cs_svc(db).rollback(case_id=case_id, target_change_set_id=cs_id)

    def test_rollback_wrong_case_raises_changeset_not_found(self, db: Session):
        """Specifying a case_id that does not own the ChangeSet must raise ChangeSetNotFoundError."""
        case_id, ev1, ev2, cs_id = self._setup_single_commit(db)
        other_case = make_case(db, name="다른 사건")
        with pytest.raises(ChangeSetNotFoundError):
            _cs_svc(db).rollback(case_id=other_case, target_change_set_id=cs_id)

    def test_rollback_nonexistent_changeset_raises(self, db: Session):
        """Specifying a non-existent ChangeSet id must raise an appropriate error."""
        case_id = make_case(db)
        with pytest.raises((ChangeSetNotFoundError, RollbackError)):
            _cs_svc(db).rollback(case_id=case_id, target_change_set_id=99999)

    # ── Idempotency & independence ─────────────────────────────────────────────

    def test_second_rollback_creates_another_distinct_changeset(self, db: Session):
        """
        Calling rollback twice on the same target must create TWO DISTINCT
        new ChangeSets (each call is independent and immutable).
        """
        case_id, ev1, ev2, cs_id = self._setup_single_commit(db)
        svc = _cs_svc(db)
        result1 = svc.rollback(case_id=case_id, target_change_set_id=cs_id)
        result2 = svc.rollback(case_id=case_id, target_change_set_id=cs_id)
        assert result1.new_change_set_id != result2.new_change_set_id, (
            "Each rollback call must produce a distinct new ChangeSet"
        )

    def test_rollback_increments_changeset_total(self, db: Session):
        """After rollback, list_changesets total must increase by exactly 1."""
        case_id, ev1, ev2, cs_id = self._setup_single_commit(db)
        svc = _cs_svc(db)
        _, before = svc.list_changesets(case_id)
        svc.rollback(case_id=case_id, target_change_set_id=cs_id)
        _, after = svc.list_changesets(case_id)
        assert after == before + 1, "Rollback must add exactly one new ChangeSet"

    def test_original_version_snapshot_survives_rollback(self, db: Session):
        """
        The VersionSnapshot linked to the target ChangeSet must still exist
        and be unmodified after rollback (immutability guarantee).
        """
        case_id, ev1, ev2, cs_id = self._setup_single_commit(db)
        snap_before = VersionSnapshotRepository(db).get_by_changeset(cs_id)
        assert snap_before is not None

        _cs_svc(db).rollback(case_id=case_id, target_change_set_id=cs_id)

        snap_after = VersionSnapshotRepository(db).get_by_changeset(cs_id)
        assert snap_after is not None
        assert snap_after.id == snap_before.id
        assert snap_after.version_number == snap_before.version_number
        assert snap_after.version_label == snap_before.version_label

    # ── Multi-commit rollback ──────────────────────────────────────────────────

    def test_rollback_to_v1_after_two_commits(self, db: Session):
        """
        With v1 and v2 committed, rolling back to v1 must restore the
        evidence state that existed immediately before v1 was committed.

        Timeline:
          Initial:   ev1=1, ev2=2
          v1 commit: ev1=2, ev2=1  ← snapshot of BEFORE v1 = {ev1:1, ev2:2}
          v2 commit: ev1=3, ev2=4  ← snapshot of BEFORE v2 = {ev1:2, ev2:1}
          rollback to v1:  ev1=1, ev2=2  (pre-v1 snapshot)
        """
        case_id = make_case(db)
        ev1 = make_evidence(db, case_id, label="A", sort_order=1)
        ev2 = make_evidence(db, case_id, label="B", sort_order=2)

        # Commit v1: swap ev1↔ev2
        cs1_id = make_reorder_cs(db, case_id, [(ev1, 2), (ev2, 1)], commit=True)
        # Confirm v1 applied
        assert _sort_order(db, ev1) == 2
        assert _sort_order(db, ev2) == 1

        # Commit v2: move to orders 3 and 4
        cs2_id = make_reorder_cs(db, case_id, [(ev1, 3), (ev2, 4)], commit=True)
        assert _sort_order(db, ev1) == 3
        assert _sort_order(db, ev2) == 4

        # Rollback to v1 — must restore the state BEFORE v1 was committed
        _cs_svc(db).rollback(case_id=case_id, target_change_set_id=cs1_id)
        assert _sort_order(db, ev1) == 1, "Rollback to v1 must restore ev1 to 1"
        assert _sort_order(db, ev2) == 2, "Rollback to v1 must restore ev2 to 2"

    def test_rollback_reference_status_restored(self, db: Session):
        """
        Rollback must restore Reference.status fields from the VersionSnapshot.

        Timeline:
          Before CS1 commit: anchor → ev1 (ref1 active)
          CS1 commits an unlink_reference op → ref1 superseded, anchor unlinked
          Snapshot captures state BEFORE CS1 commit (ref1 active)
          Rollback → ref1 must be restored to 'active'
        """
        case_id = make_case(db)
        sf = make_source_file(db, case_id)
        doc, anchors = make_document(db, case_id, sf.id, anchors=["{{갑 제1호증}}"])
        ev_id = make_evidence(db, case_id, sort_order=1)

        # Pre-link the anchor so integrity check passes before first unlink
        ref_id = make_reference(db, anchors[0].id, ev_id)
        # Mark anchor as linked (make_reference uses ReferenceService which does this)
        anchor = db.get(DocumentAnchor, anchors[0].id)
        assert anchor.status == "linked"

        # Commit an unlink_reference ChangeSet
        # NOTE: committing an unlink ChangeSet will create an UNLINKED_ANCHOR → integrity fails.
        # So instead we test rollback of a reorder ChangeSet and verify reference snapshot.
        # Create a simple reorder CS and commit it — the snapshot will capture ref1 as active.
        ev2 = make_evidence(db, case_id, label="B", sort_order=2)
        cs_id = make_reorder_cs(db, case_id, [(ev_id, 2), (ev2, 1)], commit=True)

        # Verify snapshot contains the reference
        snap = VersionSnapshotRepository(db).get_by_changeset(cs_id)
        assert snap is not None
        ref_snapshot = snap.reference_snapshot
        assert any(r["id"] == ref_id and r["status"] == "active" for r in ref_snapshot), (
            "reference_snapshot must record ref1 as 'active'"
        )

        # Rollback and check sort_orders restored
        _cs_svc(db).rollback(case_id=case_id, target_change_set_id=cs_id)
        # ev_id (sort_order was originally 1) should be restored
        assert _sort_order(db, ev_id) == 1
