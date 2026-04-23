from datetime import datetime
from sqlalchemy.orm import Session

from app.models.changeset import ChangeSet
from app.api.schemas.changeset import (
    ReorderRequest,
    ChangeSetResponse,
    CommitResponse,
    RollbackResponse,
)
from app.api.schemas.preview import ChangeSetPreviewResponse
from app.repositories.changeset_repository import (
    ChangeSetRepository,
    ChangeOperationRepository,
    VersionSnapshotRepository,
)
from app.repositories.case_repository import CaseRepository
from app.repositories.evidence_repository import EvidenceRepository, EvidenceFileLinkRepository
from app.repositories.file_repository import FileRepository
from app.repositories.reference_repository import ReferenceRepository
from app.repositories.integrity_repository import AuditLogRepository
from app.services.render_service import RenderService
from app.services.integrity_service import IntegrityService
from app.storage.local_storage import LocalStorage
from app.core.exceptions import (
    CaseNotFoundError,
    ChangeSetNotFoundError,
    IntegrityViolationError,
    CommitError,
    RollbackError,
)


class ChangeService:
    def __init__(self, db: Session):
        self.db = db
        self.case_repo = CaseRepository(db)
        self.cs_repo = ChangeSetRepository(db)
        self.op_repo = ChangeOperationRepository(db)
        self.snap_repo = VersionSnapshotRepository(db)
        self.evidence_repo = EvidenceRepository(db)
        self.file_link_repo = EvidenceFileLinkRepository(db)
        self.file_repo = FileRepository(db)
        self.ref_repo = ReferenceRepository(db)
        self.audit = AuditLogRepository(db)
        self.storage = LocalStorage()

    def create_reorder_changeset(self, case_id: int, request: ReorderRequest) -> ChangeSet:
        if self.case_repo.get_by_id(case_id) is None:
            raise CaseNotFoundError(case_id)

        # Validate all evidence IDs belong to this case
        for item in request.items:
            e = self.evidence_repo.get_by_case_and_id(case_id, item.evidence_id)
            if e is None:
                raise ValueError(
                    f"Evidence {item.evidence_id} does not belong to case {case_id}"
                )

        cs = self.cs_repo.create(case_id=case_id, description=request.description)
        self.op_repo.create(
            change_set_id=cs.id,
            op_type="reorder_evidence",
            sequence=0,
            payload={
                "items": [
                    {"evidence_id": item.evidence_id, "new_sort_order": item.new_sort_order}
                    for item in request.items
                ]
            },
        )
        self.db.commit()
        self.db.refresh(cs)
        return cs

    def preview_changeset(self, change_set_id: int) -> ChangeSetPreviewResponse:
        cs = self.cs_repo.get_by_id(change_set_id)
        if cs is None:
            raise ChangeSetNotFoundError(change_set_id)

        render_svc = RenderService(self.db)
        preview = render_svc.render_preview(
            case_id=cs.case_id, change_set_id=change_set_id
        )

        self.cs_repo.update_status(cs, "previewed")
        self.db.commit()

        return ChangeSetPreviewResponse(
            change_set_id=change_set_id,
            status="previewed",
            evidence_list_preview=preview.evidence_list_preview,
            file_rename_preview=preview.file_rename_preview,
        )

    def commit_changeset(self, change_set_id: int) -> CommitResponse:
        cs = self.cs_repo.get_by_id(change_set_id)
        if cs is None:
            raise ChangeSetNotFoundError(change_set_id)

        if cs.status == "committed":
            raise CommitError(f"ChangeSet {change_set_id} is already committed")

        # Run integrity check before commit
        integrity_svc = IntegrityService(self.db)
        report = integrity_svc.run_integrity_check(cs.case_id)
        if not report.is_passed:
            raise IntegrityViolationError(
                "Integrity check failed — cannot commit",
                errors=[v["message"] for v in report.violations],
            )

        # Take snapshot BEFORE applying changes
        snapshot_data = self._take_snapshot(cs.case_id)

        # Apply all operations
        files_renamed = 0
        for op in cs.operations:
            if op.op_type == "reorder_evidence":
                for item in op.payload.get("items", []):
                    e = self.evidence_repo.get_by_id(item["evidence_id"])
                    if e:
                        e.sort_order = item["new_sort_order"]
                self.db.flush()

            op.status = "applied"
            self.db.flush()

        # Execute file renames on disk
        from app.models.projection import FileRenamePlan
        pending_renames = (
            self.db.query(FileRenamePlan)
            .filter(
                FileRenamePlan.change_set_id == change_set_id,
                FileRenamePlan.status == "planned",
            )
            .all()
        )
        for plan in pending_renames:
            sf = self.file_repo.get_by_id(plan.source_file_id)
            if sf:
                try:
                    new_path = self.storage.rename_file(
                        current_path=sf.storage_path,
                        new_filename=plan.planned_filename,
                    )
                    sf.storage_path = new_path
                    sf.original_filename = plan.planned_filename
                    plan.status = "committed"
                    plan.committed_at = datetime.utcnow()
                    files_renamed += 1
                except Exception as e:
                    raise CommitError(f"File rename failed: {e}") from e
            self.db.flush()

        # Count committed changeSets for version label
        committed_count = len(self.cs_repo.get_committed_by_case(cs.case_id))
        version_label = f"v{committed_count + 1}"

        self.snap_repo.create(
            change_set_id=change_set_id,
            version_label=version_label,
            **snapshot_data,
        )
        self.cs_repo.update_status(cs, "committed")

        self.audit.log(
            action="change_committed",
            case_id=cs.case_id,
            entity_type="ChangeSet",
            entity_id=change_set_id,
            detail={"version_label": version_label, "files_renamed": files_renamed},
        )
        self.db.commit()

        return CommitResponse(
            change_set_id=change_set_id,
            status="committed",
            committed_at=cs.committed_at or datetime.utcnow(),
            version_label=version_label,
            files_renamed=files_renamed,
        )

    def rollback(self, case_id: int, target_change_set_id: int) -> RollbackResponse:
        if self.case_repo.get_by_id(case_id) is None:
            raise CaseNotFoundError(case_id)

        target_cs = self.cs_repo.get_by_id(target_change_set_id)
        if target_cs is None or target_cs.case_id != case_id:
            raise ChangeSetNotFoundError(target_change_set_id)

        snapshot = self.snap_repo.get_by_changeset(target_change_set_id)
        if snapshot is None:
            raise RollbackError(
                f"No VersionSnapshot for ChangeSet {target_change_set_id}. Cannot rollback."
            )

        # Apply snapshot: restore sort_orders
        for entry in snapshot.evidence_snapshot:
            e = self.evidence_repo.get_by_id(entry["id"])
            if e:
                e.sort_order = entry["sort_order"]
                e.is_active = entry.get("is_active", True)
        self.db.flush()

        # Restore references statuses
        from app.models.reference import Reference
        for entry in snapshot.reference_snapshot:
            ref = self.db.get(Reference, entry["id"])
            if ref:
                ref.status = entry["status"]
        self.db.flush()

        # Create rollback changeset (new entity — does NOT overwrite target)
        rollback_cs = self.cs_repo.create(
            case_id=case_id,
            description=f"Rollback to {snapshot.version_label} (from ChangeSet {target_change_set_id})",
            rolled_back_from_id=target_change_set_id,
        )
        self.cs_repo.update_status(rollback_cs, "committed")

        self.audit.log(
            action="rollback_executed",
            case_id=case_id,
            entity_type="ChangeSet",
            entity_id=rollback_cs.id,
            detail={
                "target_change_set_id": target_change_set_id,
                "version_label": snapshot.version_label,
            },
        )
        self.db.commit()

        return RollbackResponse(
            new_change_set_id=rollback_cs.id,
            rolled_back_from_id=target_change_set_id,
            status="committed",
            message=f"Successfully rolled back to {snapshot.version_label}",
        )

    def _take_snapshot(self, case_id: int) -> dict:
        """Capture current canonical state for snapshot."""
        evidences = self.evidence_repo.get_by_case(case_id)
        evidence_snapshot = [
            {"id": e.id, "sort_order": e.sort_order, "is_active": e.is_active}
            for e in evidences
        ]

        refs = self.ref_repo.get_all_active_by_case(case_id)
        reference_snapshot = [
            {"id": r.id, "anchor_id": r.anchor_id, "evidence_id": r.evidence_id, "status": r.status}
            for r in refs
        ]

        all_evidences = self.evidence_repo.get_by_case(case_id)
        file_link_snapshot: list[dict] = []
        for e in all_evidences:
            links = self.file_link_repo.get_by_evidence(e.id)
            for link in links:
                file_link_snapshot.append(
                    {
                        "id": link.id,
                        "evidence_id": link.evidence_id,
                        "source_file_id": link.source_file_id,
                        "file_order": link.file_order,
                    }
                )

        return {
            "evidence_snapshot": evidence_snapshot,
            "reference_snapshot": reference_snapshot,
            "file_link_snapshot": file_link_snapshot,
        }
