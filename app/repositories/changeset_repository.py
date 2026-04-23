from datetime import datetime
from sqlalchemy.orm import Session
from app.models.changeset import ChangeSet, ChangeOperation
from app.models.projection import DocumentProjection, EvidenceListProjection, FileRenamePlan
from app.models.snapshot import VersionSnapshot
from app.repositories.base import BaseRepository


class ChangeSetRepository(BaseRepository[ChangeSet]):
    def __init__(self, db: Session):
        super().__init__(db, ChangeSet)

    def get_by_id(self, change_set_id: int) -> ChangeSet | None:
        return self.db.query(ChangeSet).filter(ChangeSet.id == change_set_id).first()

    def get_by_case(self, case_id: int) -> list[ChangeSet]:
        return (
            self.db.query(ChangeSet)
            .filter(ChangeSet.case_id == case_id)
            .order_by(ChangeSet.created_at.desc())
            .all()
        )

    def get_committed_by_case(self, case_id: int) -> list[ChangeSet]:
        return (
            self.db.query(ChangeSet)
            .filter(ChangeSet.case_id == case_id, ChangeSet.status == "committed")
            .order_by(ChangeSet.committed_at.desc())
            .all()
        )

    def create(
        self, case_id: int, description: str | None = None, rolled_back_from_id: int | None = None
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


class VersionSnapshotRepository(BaseRepository[VersionSnapshot]):
    def __init__(self, db: Session):
        super().__init__(db, VersionSnapshot)

    def get_by_changeset(self, change_set_id: int) -> VersionSnapshot | None:
        return (
            self.db.query(VersionSnapshot)
            .filter(VersionSnapshot.change_set_id == change_set_id)
            .first()
        )

    def create(
        self,
        change_set_id: int,
        version_label: str,
        evidence_snapshot: list,
        reference_snapshot: list,
        file_link_snapshot: list,
    ) -> VersionSnapshot:
        snap = VersionSnapshot(
            change_set_id=change_set_id,
            version_label=version_label,
            evidence_snapshot=evidence_snapshot,
            reference_snapshot=reference_snapshot,
            file_link_snapshot=file_link_snapshot,
        )
        return self.add(snap)
