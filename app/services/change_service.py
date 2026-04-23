from datetime import datetime
from sqlalchemy.orm import Session

from app.models.changeset import ChangeSet
from app.api.schemas.changeset import (
    ReorderRequest,
    LinkReferencesRequest,
    UnlinkReferencesRequest,
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

    # ── ChangeSet factory methods ─────────────────────────────────────────────

    def list_changesets(
        self, case_id: int, skip: int = 0, limit: int = 50
    ) -> tuple[list[ChangeSet], int]:
        if self.case_repo.get_by_id(case_id) is None:
            raise CaseNotFoundError(case_id)
        items = self.cs_repo.get_by_case(case_id, skip=skip, limit=limit)
        total = self.cs_repo.count_by_case(case_id)
        return items, total

    def get_changeset(self, case_id: int, change_set_id: int) -> ChangeSet:
        if self.case_repo.get_by_id(case_id) is None:
            raise CaseNotFoundError(case_id)
        cs = self.cs_repo.get_by_id(change_set_id)
        if cs is None or cs.case_id != case_id:
            raise ChangeSetNotFoundError(change_set_id)
        return cs

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

    def create_link_references_changeset(
        self, case_id: int, request: LinkReferencesRequest
    ) -> ChangeSet:
        """Create a ChangeSet containing link_reference operations."""
        if self.case_repo.get_by_id(case_id) is None:
            raise CaseNotFoundError(case_id)

        from app.repositories.document_repository import AnchorRepository
        anchor_repo = AnchorRepository(self.db)

        cs = self.cs_repo.create(case_id=case_id, description=request.description)
        for seq, item in enumerate(request.links):
            anchor = anchor_repo.get(item.anchor_id)
            if anchor is None:
                raise ValueError(f"DocumentAnchor {item.anchor_id} not found")
            evidence = self.evidence_repo.get_by_case_and_id(case_id, item.evidence_id)
            if evidence is None:
                raise ValueError(
                    f"Evidence {item.evidence_id} does not belong to case {case_id}"
                )
            self.op_repo.create(
                change_set_id=cs.id,
                op_type="link_reference",
                sequence=seq,
                payload={
                    "anchor_id": item.anchor_id,
                    "evidence_id": item.evidence_id,
                    "note": item.note,
                },
            )
        self.db.commit()
        self.db.refresh(cs)
        return cs

    def create_unlink_references_changeset(
        self, case_id: int, request: UnlinkReferencesRequest
    ) -> ChangeSet:
        """Create a ChangeSet containing unlink_reference operations."""
        if self.case_repo.get_by_id(case_id) is None:
            raise CaseNotFoundError(case_id)

        cs = self.cs_repo.create(case_id=case_id, description=request.description)
        for seq, ref_id in enumerate(request.reference_ids):
            ref = self.ref_repo.get_by_id(ref_id)
            if ref is None:
                raise ValueError(f"Reference {ref_id} not found")
            self.op_repo.create(
                change_set_id=cs.id,
                op_type="unlink_reference",
                sequence=seq,
                payload={"reference_id": ref_id},
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

        # Run integrity check before commit.
        # For link_reference operations: the changeset IS resolving unlinked anchors,
        # so we exclude the anchors that are *about to be linked* from the
        # UNLINKED_ANCHOR check.  All other violations still block the commit.
        integrity_svc = IntegrityService(self.db)
        report = integrity_svc.run_integrity_check(cs.case_id)
        if not report.is_passed:
            # Collect anchor IDs that this changeset will link
            link_op_anchor_ids: set[int] = set()
            for op in cs.operations:
                if op.op_type == "link_reference":
                    aid = op.payload.get("anchor_id")
                    if aid is not None:
                        link_op_anchor_ids.add(aid)

            # Filter out UNLINKED_ANCHOR violations for anchors being linked in this CS
            filtered_violations = [
                v for v in report.violations
                if not (
                    v.get("violation_type") == "UNLINKED_ANCHOR"
                    and v.get("anchor_id") in link_op_anchor_ids
                )
            ]
            if filtered_violations:
                raise IntegrityViolationError(
                    "Integrity check failed — cannot commit",
                    errors=[v["message"] for v in filtered_violations],
                )

        # Take snapshot BEFORE applying changes
        snapshot_data = self._take_snapshot(cs.case_id)

        # Apply all operations
        files_renamed = 0
        for op in cs.operations:
            if op.op_type == "reorder_evidence":
                items = op.payload.get("items", [])
                # ── Two-phase sort_order update ──────────────────────────────
                # The unique constraint (case_id, party, sort_order) prevents a
                # single-pass bulk UPDATE when values are swapped (transient
                # collision).  Workaround: first shift every affected row to a
                # large negative temporary value, then apply the final values.
                #
                # We use -(evidence_id * 10000) as a temporary sentinel so that
                # no two affected rows collide with each other during phase 1.
                # Negative values never conflict with real sort_orders (≥ 0).
                for item in items:
                    e = self.evidence_repo.get_by_id(item["evidence_id"])
                    if e:
                        e.sort_order = -(e.id * 10000)   # phase 1: temp value
                self.db.flush()                           # flush phase 1

                for item in items:
                    e = self.evidence_repo.get_by_id(item["evidence_id"])
                    if e:
                        e.sort_order = item["new_sort_order"]  # phase 2: real value
                self.db.flush()                           # flush phase 2

            elif op.op_type == "link_reference":
                from app.repositories.document_repository import AnchorRepository
                anchor_repo = AnchorRepository(self.db)
                from app.models.reference import Reference
                anchor_id = op.payload.get("anchor_id")
                evidence_id = op.payload.get("evidence_id")
                note = op.payload.get("note")
                # Supersede existing active reference
                existing = self.ref_repo.get_active_by_anchor(anchor_id)
                if existing:
                    existing.status = "superseded"
                    self.db.flush()
                new_ref = self.ref_repo.create(
                    anchor_id=anchor_id, evidence_id=evidence_id, note=note
                )
                # Mark anchor as linked
                anchor = anchor_repo.get(anchor_id)
                if anchor:
                    anchor.status = "linked"
                self.db.flush()

            elif op.op_type == "unlink_reference":
                from app.repositories.document_repository import AnchorRepository
                anchor_repo = AnchorRepository(self.db)
                from app.models.reference import Reference
                ref_id = op.payload.get("reference_id")
                ref = self.ref_repo.get_by_id(ref_id)
                if ref:
                    ref.status = "superseded"
                    anchor = anchor_repo.get(ref.anchor_id)
                    if anchor:
                        anchor.status = "unlinked"
                self.db.flush()

            elif op.op_type == "relabel_evidence":
                e = self.evidence_repo.get_by_id(op.payload.get("evidence_id"))
                if e:
                    if "label" in op.payload:
                        e.label = op.payload["label"]
                    if "description" in op.payload:
                        e.description = op.payload.get("description")
                self.db.flush()

            elif op.op_type in ("activate_evidence", "deactivate_evidence"):
                e = self.evidence_repo.get_by_id(op.payload.get("evidence_id"))
                if e:
                    e.is_active = (op.op_type == "activate_evidence")
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

        # Determine version number (monotonically increasing per case)
        version_number = self.snap_repo.get_next_version_number(cs.case_id)
        version_label = f"v{version_number}"

        self.snap_repo.create(
            change_set_id=change_set_id,
            case_id=cs.case_id,
            version_label=version_label,
            version_number=version_number,
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
            version_number=version_number,
            files_renamed=files_renamed,
            operations_applied=len(cs.operations),
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

        # Apply snapshot: restore sort_orders (two-phase to avoid unique constraint)
        entries_with_evidence = [
            (entry, self.evidence_repo.get_by_id(entry["id"]))
            for entry in snapshot.evidence_snapshot
        ]
        # Phase 1: shift to temp negative values
        for entry, e in entries_with_evidence:
            if e:
                e.sort_order = -(e.id * 10000)
        self.db.flush()
        # Phase 2: apply snapshot values
        for entry, e in entries_with_evidence:
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
            version_label=snapshot.version_label,
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
