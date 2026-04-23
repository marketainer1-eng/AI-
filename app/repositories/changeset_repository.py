"""
app/repositories/changeset_repository.py
=========================================
Repositories for ChangeSet, ChangeOperation, and VersionSnapshot.

ChangeSet lifecycle:
  draft → previewed → committed
              ↳ rolled_back  (set on the ORIGINAL CS when a rollback is issued)

VersionSnapshot:
  Created once per committed ChangeSet.
  Immutable — contains evidence, reference, and file-link state at commit time.
"""

from __future__ import annotations

from datetime import datetime
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.changeset import ChangeSet, ChangeOperation
from app.models.projection import DocumentProjection, EvidenceListProjection, FileRenamePlan
from app.models.snapshot import VersionSnapshot
from app.repositories.base import BaseRepository


class ChangeSetRepository(BaseRepository[ChangeSet]):
    def __init__(self, db: Session):
        super().__init__(db, ChangeSet)

    def get_by_id(self, change_set_id: int) -> ChangeSet | None:
        return (
            self.db.query(ChangeSet)
            .filter(ChangeSet.id == change_set_id)
            .first()
        )

    def get_by_case(
        self, case_id: int, skip: int = 0, limit: int = 50
    ) -> list[ChangeSet]:
        return (
            self.db.query(ChangeSet)
            .filter(ChangeSet.case_id == case_id)
            .order_by(ChangeSet.created_at.desc())
            .offset(skip)
            .limit(limit)
            .all()
        )

    def count_by_case(self, case_id: int) -> int:
        return (
            self.db.query(func.count(ChangeSet.id))
            .filter(ChangeSet.case_id == case_id)
            .scalar()
            or 0
        )

    def get_committed_by_case(self, case_id: int) -> list[ChangeSet]:
        return (
            self.db.query(ChangeSet)
            .filter(ChangeSet.case_id == case_id, ChangeSet.status == "committed")
            .order_by(ChangeSet.committed_at.desc())
            .all()
        )

    def create(
        self,
        case_id: int,
        description: str | None = None,
        rolled_back_from_id: int | None = None,
    ) -> ChangeSet:
        cs = ChangeSet(
            case_id=case_id,
            description=description,
            rolled_back_from_id=rolled_back_from_id,
        )
        return self.add(cs)

    def update_status(self, cs: ChangeSet, status: str) -> ChangeSet:
        cs.status = status
        if status == "committed":
            cs.committed_at = datetime.utcnow()
        self.db.flush()
        self.db.refresh(cs)
        return cs


class ChangeOperationRepository(BaseRepository[ChangeOperation]):
    def __init__(self, db: Session):
        super().__init__(db, ChangeOperation)

    def get_by_changeset(self, change_set_id: int) -> list[ChangeOperation]:
        return (
            self.db.query(ChangeOperation)
            .filter(ChangeOperation.change_set_id == change_set_id)
            .order_by(ChangeOperation.sequence.asc())
            .all()
        )

    def create(
        self, change_set_id: int, op_type: str, sequence: int, payload: dict
    ) -> ChangeOperation:
        op = ChangeOperation(
            change_set_id=change_set_id,
            op_type=op_type,
            sequence=sequence,
            payload=payload,
        )
        return self.add(op)

    def count_by_changeset(self, change_set_id: int) -> int:
        return (
            self.db.query(func.count(ChangeOperation.id))
            .filter(ChangeOperation.change_set_id == change_set_id)
            .scalar()
            or 0
        )


class VersionSnapshotRepository(BaseRepository[VersionSnapshot]):
    def __init__(self, db: Session):
        super().__init__(db, VersionSnapshot)

    def get_by_changeset(self, change_set_id: int) -> VersionSnapshot | None:
        return (
            self.db.query(VersionSnapshot)
            .filter(VersionSnapshot.change_set_id == change_set_id)
            .first()
        )

    def get_by_case(
        self, case_id: int, skip: int = 0, limit: int = 50
    ) -> list[VersionSnapshot]:
        return (
            self.db.query(VersionSnapshot)
            .filter(VersionSnapshot.case_id == case_id)
            .order_by(VersionSnapshot.version_number.asc())
            .offset(skip)
            .limit(limit)
            .all()
        )

    def count_by_case(self, case_id: int) -> int:
        return (
            self.db.query(func.count(VersionSnapshot.id))
            .filter(VersionSnapshot.case_id == case_id)
            .scalar()
            or 0
        )

    def get_next_version_number(self, case_id: int) -> int:
        """Return the next monotonically-increasing version_number for a case."""
        result = (
            self.db.query(func.max(VersionSnapshot.version_number))
            .filter(VersionSnapshot.case_id == case_id)
            .scalar()
        )
        return (result or 0) + 1

    def create(
        self,
        change_set_id: int,
        case_id: int,
        version_label: str,
        version_number: int,
        evidence_snapshot: list,
        reference_snapshot: list,
        file_link_snapshot: list,
    ) -> VersionSnapshot:
        snap = VersionSnapshot(
            change_set_id=change_set_id,
            case_id=case_id,
            version_label=version_label,
            version_number=version_number,
            evidence_snapshot=evidence_snapshot,
            reference_snapshot=reference_snapshot,
            file_link_snapshot=file_link_snapshot,
        )
        return self.add(snap)
