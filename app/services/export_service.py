import json
from datetime import datetime
from pathlib import Path
from sqlalchemy.orm import Session

from app.api.schemas.export import ExportRequest, ExportResponse
from app.repositories.case_repository import CaseRepository
from app.repositories.document_repository import DocumentRepository
from app.repositories.file_repository import FileRepository
from app.repositories.integrity_repository import AuditLogRepository
from app.services.render_service import RenderService
from app.services.integrity_service import IntegrityService
from app.core.config import settings
from app.core.exceptions import CaseNotFoundError, IntegrityViolationError


class ExportService:
    def __init__(self, db: Session):
        self.db = db
        self.case_repo = CaseRepository(db)
        self.doc_repo = DocumentRepository(db)
        self.file_repo = FileRepository(db)
        self.audit = AuditLogRepository(db)

    def export_case(self, case_id: int, request: ExportRequest) -> ExportResponse:
        case = self.case_repo.get_by_id(case_id)
        if case is None:
            raise CaseNotFoundError(case_id)

        # Integrity check before export
        integrity_svc = IntegrityService(self.db)
        report = integrity_svc.run_integrity_check(case_id)
        if not report.is_passed:
            raise IntegrityViolationError(
                "Integrity check failed before export",
                errors=[v["message"] for v in report.violations],
            )

        render_svc = RenderService(self.db)
        preview = render_svc.render_preview(case_id=case_id)

        # Create export directory
        timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
        export_dir = settings.export_path / f"case_{case_id}_{timestamp}"
        export_dir.mkdir(parents=True, exist_ok=True)

        exported_files: list[str] = []

        # Export rendered document DOCX
        if request.include_document and preview.document_preview:
            from app.renderers.document_renderer import DocumentRenderer
            renderer = DocumentRenderer()
            docs = self.doc_repo.get_by_case(case_id)
            if docs:
                doc = docs[0]
                sf = self.file_repo.get_by_id(doc.source_file_id)
                if sf and Path(sf.storage_path).exists():
                    out_path = export_dir / f"document_rendered_{doc.id}.docx"
                    renderer.export_docx(
                        docx_path=Path(sf.storage_path),
                        placeholder_map={},  # RenderService already resolved
                        output_path=out_path,
                        paragraphs=preview.document_preview.paragraphs,
                    )
                    exported_files.append(str(out_path))

        # Export evidence list DOCX
        if request.include_evidence_list:
            from app.renderers.evidence_list_renderer import EvidenceListRenderer
            renderer = EvidenceListRenderer()
            out_path = export_dir / "evidence_list.docx"
            renderer.export_docx(
                entries=preview.evidence_list_preview,
                output_path=out_path,
            )
            exported_files.append(str(out_path))

        # Export file rename manifest JSON
        if request.include_rename_manifest:
            manifest_path = export_dir / "file_rename_manifest.json"
            manifest = [
                {
                    "source_file_id": e.source_file_id,
                    "current_filename": e.current_filename,
                    "planned_filename": e.planned_filename,
                }
                for e in preview.file_rename_preview
            ]
            manifest_path.write_text(
                json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8"
            )
            exported_files.append(str(manifest_path))

        self.audit.log(
            action="export_generated",
            case_id=case_id,
            entity_type="Case",
            entity_id=case_id,
            detail={"export_dir": str(export_dir), "files": exported_files},
        )
        self.db.commit()

        return ExportResponse(
            case_id=case_id,
            export_path=str(export_dir),
            exported_files=exported_files,
            exported_at=datetime.utcnow(),
        )
