from pathlib import Path
from sqlalchemy.orm import Session

from app.models.integrity import IntegrityReport
from app.repositories.case_repository import CaseRepository
from app.repositories.document_repository import AnchorRepository
from app.repositories.evidence_repository import EvidenceRepository, EvidenceFileLinkRepository
from app.repositories.reference_repository import ReferenceRepository
from app.repositories.integrity_repository import IntegrityReportRepository, AuditLogRepository
from app.core.exceptions import CaseNotFoundError
from app.core.config import settings


class IntegrityService:
    def __init__(self, db: Session):
        self.db = db
        self.case_repo = CaseRepository(db)
        self.evidence_repo = EvidenceRepository(db)
        self.anchor_repo = AnchorRepository(db)
        self.ref_repo = ReferenceRepository(db)
        self.file_link_repo = EvidenceFileLinkRepository(db)
        self.report_repo = IntegrityReportRepository(db)
        self.audit = AuditLogRepository(db)

    def run_integrity_check(self, case_id: int) -> IntegrityReport:
        if self.case_repo.get_by_id(case_id) is None:
            raise CaseNotFoundError(case_id)

        violations: list[dict] = []
        warnings: list[dict] = []

        # 1. Check unlinked anchors
        from app.models.document import DocumentAnchor, Document
        unlinked_anchors = (
            self.db.query(DocumentAnchor)
            .join(Document, DocumentAnchor.document_id == Document.id)
            .filter(Document.case_id == case_id, DocumentAnchor.status == "unlinked")
            .all()
        )
        for anchor in unlinked_anchors:
            violations.append({
                "violation_type": "UNLINKED_ANCHOR",
                "anchor_id": anchor.id,          # used by commit_changeset to filter
                "entity_type": "DocumentAnchor",
                "entity_id": anchor.id,
                "message": f"Anchor '{anchor.placeholder_text}' (id={anchor.id}) is not linked to any Evidence",
                "detail": {"placeholder_text": anchor.placeholder_text},
            })

        # 2. Check references pointing to inactive evidences
        active_refs = self.ref_repo.get_all_active_by_case(case_id)
        for ref in active_refs:
            evidence = self.evidence_repo.get_by_id(ref.evidence_id)
            if evidence and not evidence.is_active:
                violations.append({
                    "violation_type": "REFERENCE_TO_INACTIVE_EVIDENCE",
                    "entity_type": "Reference",
                    "entity_id": ref.id,
                    "message": f"Reference {ref.id} points to inactive Evidence {ref.evidence_id}",
                    "detail": {"evidence_id": ref.evidence_id},
                })

        # 3. Check EvidenceFileLinks pointing to missing files on disk
        evidences = self.evidence_repo.get_by_case(case_id)
        for evidence in evidences:
            links = self.file_link_repo.get_by_evidence(evidence.id)
            for link in links:
                from app.repositories.file_repository import FileRepository
                file_repo = FileRepository(self.db)
                sf = file_repo.get_by_id(link.source_file_id)
                if sf is None:
                    violations.append({
                        "violation_type": "MISSING_SOURCE_FILE_RECORD",
                        "entity_type": "EvidenceFileLink",
                        "entity_id": link.id,
                        "message": f"EvidenceFileLink {link.id} references non-existent SourceFile {link.source_file_id}",
                        "detail": {"source_file_id": link.source_file_id},
                    })
                elif not Path(sf.storage_path).exists():
                    violations.append({
                        "violation_type": "MISSING_FILE_ON_DISK",
                        "entity_type": "SourceFile",
                        "entity_id": sf.id,
                        "message": f"SourceFile {sf.id} ({sf.original_filename}) does not exist on disk at {sf.storage_path}",
                        "detail": {"storage_path": sf.storage_path},
                    })

        # 4. Warn on duplicate sort_orders within same party
        for party in ["plaintiff", "defendant"]:
            party_evidences = self.evidence_repo.get_by_case(case_id, party=party)
            sort_orders = [e.sort_order for e in party_evidences]
            if len(sort_orders) != len(set(sort_orders)):
                from collections import Counter
                dupes = [k for k, v in Counter(sort_orders).items() if v > 1]
                warnings.append({
                    "warning_type": "DUPLICATE_SORT_ORDER",
                    "entity_type": "Evidence",
                    "entity_id": None,
                    "message": f"Duplicate sort_order values in party '{party}': {dupes}",
                })

        is_passed = len(violations) == 0
        result = "pass" if is_passed else "fail"

        report = self.report_repo.create(
            case_id=case_id,
            result=result,
            is_passed=is_passed,
            violations=violations,
            warnings=warnings,
        )
        self.audit.log(
            action="integrity_checked",
            case_id=case_id,
            entity_type="IntegrityReport",
            entity_id=report.id,
            detail={"result": result, "violations": len(violations), "warnings": len(warnings)},
        )
        self.db.commit()
        return report

    def get_integrity_history(self, case_id: int, limit: int = 10) -> list[IntegrityReport]:
        if self.case_repo.get_by_id(case_id) is None:
            raise CaseNotFoundError(case_id)
        return self.report_repo.get_history(case_id, limit=limit)
