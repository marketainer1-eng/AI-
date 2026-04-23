"""
app/services/workflow_demo_service.py
======================================
Orchestration service for high-level workflow operations.

Responsibilities
----------------
- ``WorkflowDemoService.run_demo()``   – full end-to-end demo workflow
- ``WorkflowDemoService.get_status()`` – aggregate workflow state for a case

Design principles
-----------------
- CLI commands are thin: they call into this service and render results.
- All DB mutations go through existing service classes (no raw ORM here).
- ``run_demo()`` **internally** rolls back the DB session on any unhandled
  exception; the caller is guaranteed a clean state.
- Exceptions propagate upward after rollback; the CLI layer handles display.
- No python-docx fallback: if the library is missing a ``RuntimeError`` is
  raised immediately with a clear install instruction.
- Anchor / evidence count mismatch raises a ``RuntimeError`` reporting both
  counts.
- ``InMemoryUploadFile`` is the single upload helper used throughout this
  module; no ad-hoc helpers elsewhere.

Dataclasses (stdlib, no Pydantic) are used for return types so the CLI layer
can remain independent of the API schema layer.
"""

from __future__ import annotations

import io
import tempfile
from dataclasses import dataclass, field
from pathlib import Path
from typing import TYPE_CHECKING

from sqlalchemy.orm import Session

if TYPE_CHECKING:
    # Avoid circular imports at module load time
    from app.models.case import Case
    from app.models.source_file import SourceFile
    from app.models.document import Document, DocumentAnchor
    from app.models.evidence import Evidence
    from app.models.reference import Reference
    from app.models.changeset import ChangeSet
    from app.models.integrity import IntegrityReport


# ══════════════════════════════════════════════════════════════════════════════
#  Shared upload helper
# ══════════════════════════════════════════════════════════════════════════════

class InMemoryUploadFile:
    """
    Minimal UploadFile-compatible object backed by a filesystem path.

    Satisfies the duck-typed interface expected by ``LocalStorage.save()``
    (needs ``filename``, ``content_type``, and ``file`` / ``read()``).

    This is the single upload helper class used throughout the workflow demo
    service.  No other ad-hoc upload helpers should be created.

    Usage::

        upload = InMemoryUploadFile(path, content_type="application/pdf")
        source_file = file_service.upload_file(case_id, upload, role="evidence_attachment")
    """

    def __init__(self, path: Path, content_type: str = "application/octet-stream") -> None:
        self.filename: str = path.name
        self.content_type: str = content_type
        self.file: io.BytesIO = io.BytesIO(path.read_bytes())

    def read(self, n: int = -1) -> bytes:
        return self.file.read(n)


# ══════════════════════════════════════════════════════════════════════════════
#  Result dataclasses
# ══════════════════════════════════════════════════════════════════════════════

@dataclass
class DemoPreviewRow:
    """Single row of an evidence list (for display only)."""

    rendered_number: str
    rendered_label: str


@dataclass
class DemoStepResult:
    """Outcome of a single demo step."""

    step: int
    title: str
    success: bool
    message: str = ""


@dataclass
class WorkflowDemoResult:
    """Aggregate result returned by ``WorkflowDemoService.run_demo()``."""

    case_id: int
    case_name: str
    steps: list[DemoStepResult] = field(default_factory=list)

    evidence_count: int = 0
    reference_count: int = 0
    anchor_count: int = 0

    # Preview rows (post-reorder)
    evidence_preview_rows: list[DemoPreviewRow] = field(default_factory=list)

    # Baseline preview (before reorder)
    baseline_preview_rows: list[DemoPreviewRow] = field(default_factory=list)

    # Integrity
    integrity_passed: bool = False
    integrity_violations: int = 0
    integrity_warnings: int = 0

    # Commit result
    version_label: str = ""
    files_renamed: int = 0

    # Export
    export_path: str = ""
    exported_files: list[str] = field(default_factory=list)
    export_skipped: bool = False


@dataclass
class WorkflowStatusResult:
    """Aggregate status returned by ``WorkflowDemoService.get_status()``."""

    case_id: int
    case_name: str
    case_status: str
    court: str
    case_number: str

    total_files: int = 0
    document_files: int = 0
    evidence_files: int = 0

    total_documents: int = 0

    total_evidences: int = 0
    active_evidences: int = 0

    active_references: int = 0

    total_changesets: int = 0
    committed_changesets: int = 0

    latest_integrity_passed: bool | None = None
    latest_integrity_violations: int = 0


# ══════════════════════════════════════════════════════════════════════════════
#  DOCX factory
# ══════════════════════════════════════════════════════════════════════════════

def _make_demo_docx(tmp_dir: Path) -> Path:
    """
    Create a tiny DOCX with two evidence placeholders and return its path.

    Raises
    ------
    RuntimeError
        If ``python-docx`` is not installed.  There is NO fallback — the
        caller must install it with ``pip install python-docx`` before using
        the demo command.  A RuntimeError with a clear message is raised
        rather than silently producing a broken or empty file.
    """
    try:
        import docx  # type: ignore  # noqa: F401 — import check only
        from docx import Document as DocxDocument  # type: ignore
    except ImportError as exc:
        raise RuntimeError(
            "python-docx is required for the workflow demo.\n"
            "Install it with:  pip install python-docx"
        ) from exc

    doc = DocxDocument()
    doc.add_heading("준비서면", level=1)
    doc.add_paragraph("피고는 다음과 같이 주장합니다.")
    doc.add_paragraph(
        "{{갑 제1호증}}에 기재된 계약서에 따르면 원고의 주장은 이유 없습니다."
    )
    doc.add_paragraph("{{갑 제2호증}}의 영수증을 참고하시기 바랍니다.")
    doc.add_paragraph("이상의 증거들을 종합하면 피고의 주장이 타당합니다.")

    path = tmp_dir / "demo_brief.docx"
    doc.save(str(path))
    return path


# ══════════════════════════════════════════════════════════════════════════════
#  WorkflowDemoService
# ══════════════════════════════════════════════════════════════════════════════

class WorkflowDemoService:
    """
    Orchestrates multi-step workflow operations.

    All methods accept a SQLAlchemy ``Session`` injected by the CLI command.
    ``run_demo()`` guarantees a DB rollback on any unhandled exception before
    re-raising it, so the caller always receives a clean session.
    The session's lifecycle (close) remains the caller's responsibility.
    """

    def __init__(self, db: Session) -> None:
        self.db = db

    # ── Internal service accessors (lazy-instantiated per call) ───────────────

    def _case_svc(self):
        from app.services.case_service import CaseService
        return CaseService(self.db)

    def _file_svc(self):
        from app.services.file_service import FileService
        return FileService(self.db)

    def _doc_svc(self):
        from app.services.document_service import DocumentService
        return DocumentService(self.db)

    def _ev_svc(self):
        from app.services.evidence_service import EvidenceService
        return EvidenceService(self.db)

    def _ref_svc(self):
        from app.services.reference_service import ReferenceService
        return ReferenceService(self.db)

    def _render_svc(self):
        from app.services.render_service import RenderService
        return RenderService(self.db)

    def _integrity_svc(self):
        from app.services.integrity_service import IntegrityService
        return IntegrityService(self.db)

    def _change_svc(self):
        from app.services.change_service import ChangeService
        return ChangeService(self.db)

    def _export_svc(self):
        from app.services.export_service import ExportService
        return ExportService(self.db)

    # ── Public: run_demo() ────────────────────────────────────────────────────

    def run_demo(
        self,
        case_name: str,
        court: str,
        case_number: str,
        skip_export: bool = False,
    ) -> WorkflowDemoResult:
        """
        Execute the full demo workflow and return a ``WorkflowDemoResult``.

        Steps
        -----
        1.  Create case
        2.  Upload DOCX file (role=document)
        3.  Upload two evidence attachment files (role=evidence_attachment)
        4.  Register Document
        5.  Parse placeholders → DocumentAnchors
        6.  Create Evidence records
        7.  Link anchors → evidences (References)
        8.  Render baseline preview (before reorder)
        9.  Run integrity check
        10. Create reorder ChangeSet (swap sort_orders)
        11. Preview ChangeSet
        12. Commit ChangeSet
        13. (optional) Export case artifacts

        Raises
        ------
        RuntimeError
            If ``python-docx`` is not installed (step 2).
        RuntimeError
            If the number of parsed anchors ≠ number of created evidences.
            The error message reports both counts.
        Any service-layer exception propagates unchanged.

        DB Rollback Guarantee
        ---------------------
        If any exception is raised during orchestration the DB session is
        **rolled back inside this method** before re-raising.  The caller
        receives a clean, rolled-back session regardless of where the
        failure occurred.
        """
        from app.api.schemas.case import CaseCreate
        from app.api.schemas.document import DocumentCreate
        from app.api.schemas.evidence import EvidenceCreate
        from app.api.schemas.reference import ReferenceCreate
        from app.api.schemas.changeset import ReorderRequest, ReorderEvidenceItem
        from app.api.schemas.export import ExportRequest

        result = WorkflowDemoResult(case_id=0, case_name=case_name)
        steps = result.steps

        def _ok(n: int, title: str, msg: str = "") -> None:
            steps.append(DemoStepResult(step=n, title=title, success=True, message=msg))

        try:
            with tempfile.TemporaryDirectory() as tmp_str:
                tmp = Path(tmp_str)

                # ── Step 1: Create case ──────────────────────────────────────
                case = self._case_svc().create_case(
                    CaseCreate(name=case_name, court=court, case_number=case_number)
                )
                result.case_id = case.id
                _ok(1, "Create case", f"id={case.id} name={case.name!r}")

                # ── Step 2: Upload DOCX ──────────────────────────────────────
                # Raises RuntimeError if python-docx is missing (no fallback)
                docx_path = _make_demo_docx(tmp)
                doc_file = self._file_svc().upload_file(
                    case_id=case.id,
                    upload=InMemoryUploadFile(
                        docx_path,
                        content_type=(
                            "application/vnd.openxmlformats-officedocument"
                            ".wordprocessingml.document"
                        ),
                    ),
                    role="document",
                )
                _ok(2, "Upload DOCX file", f"file_id={doc_file.id}")

                # ── Step 3: Upload evidence attachments ──────────────────────
                attachment_specs = [
                    ("contract.pdf", "application/pdf"),
                    ("receipt.pdf", "application/pdf"),
                ]
                ev_files = []
                for fname, ctype in attachment_specs:
                    dummy = tmp / fname
                    dummy.write_bytes(f"dummy evidence file: {fname}".encode())
                    sf = self._file_svc().upload_file(
                        case_id=case.id,
                        upload=InMemoryUploadFile(dummy, content_type=ctype),
                        role="evidence_attachment",
                    )
                    ev_files.append(sf)
                _ok(3, "Upload evidence attachments", f"{len(ev_files)} file(s) uploaded")

                # ── Step 4: Register Document ────────────────────────────────
                document = self._doc_svc().register_document(
                    case_id=case.id,
                    data=DocumentCreate(
                        source_file_id=doc_file.id,
                        title="2024년 10월 준비서면",
                        doc_type="main_brief",
                    ),
                )
                _ok(4, "Register Document", f"doc_id={document.id}")

                # ── Step 5: Parse placeholders ───────────────────────────────
                parse_result = self._doc_svc().parse_placeholders(
                    case_id=case.id, document_id=document.id
                )
                anchors = parse_result.anchors
                result.anchor_count = parse_result.anchors_found
                _ok(5, "Parse placeholders", f"{parse_result.anchors_found} anchor(s)")

                # ── Step 6: Create Evidence records ─────────────────────────
                evidence_labels = ["계약서 사본", "영수증"]

                # Guard: mismatch between anchors and planned evidences
                if len(anchors) != len(evidence_labels):
                    raise RuntimeError(
                        f"Anchor / evidence count mismatch: "
                        f"parsed {len(anchors)} anchor(s) but "
                        f"expected {len(evidence_labels)} evidence(s). "
                        "Check the demo DOCX template."
                    )

                evidences = []
                for idx, (label, ef) in enumerate(zip(evidence_labels, ev_files), start=1):
                    ev = self._ev_svc().create_evidence(
                        case_id=case.id,
                        data=EvidenceCreate(
                            party="plaintiff",
                            label=label,
                            sort_order=idx,
                            source_file_ids=[ef.id],
                        ),
                    )
                    evidences.append(ev)
                result.evidence_count = len(evidences)
                _ok(6, "Create Evidence records", f"{len(evidences)} evidence(s) created")

                # ── Step 7: Link anchors → evidences ────────────────────────
                references = []
                for anchor, evidence in zip(anchors, evidences):
                    ref = self._ref_svc().create_reference(
                        data=ReferenceCreate(
                            anchor_id=anchor.id, evidence_id=evidence.id
                        )
                    )
                    references.append(ref)
                result.reference_count = len(references)
                _ok(7, "Link anchors to evidences", f"{len(references)} reference(s) created")

                # ── Step 8: Baseline render preview ─────────────────────────
                preview = self._render_svc().render_preview(case_id=case.id)
                result.baseline_preview_rows = [
                    DemoPreviewRow(
                        rendered_number=e.rendered_number,
                        rendered_label=e.rendered_label,
                    )
                    for e in preview.evidence_list_preview
                ]
                _ok(
                    8,
                    "Render baseline preview",
                    f"{len(result.baseline_preview_rows)} evidence(s), "
                    f"{len(preview.file_rename_preview)} rename(s) planned",
                )

                # ── Step 9: Integrity check ──────────────────────────────────
                report = self._integrity_svc().run_integrity_check(case.id)
                result.integrity_passed = report.is_passed
                result.integrity_violations = report.violation_count
                result.integrity_warnings = report.warning_count
                _ok(
                    9,
                    "Integrity check",
                    f"{'PASS' if report.is_passed else 'FAIL'} — "
                    f"{report.violation_count} violation(s)",
                )

                # ── Steps 10-12: Reorder ChangeSet ──────────────────────────
                if len(evidences) >= 2:
                    # Step 10: Create reorder ChangeSet
                    cs = self._change_svc().create_reorder_changeset(
                        case_id=case.id,
                        request=ReorderRequest(
                            items=[
                                ReorderEvidenceItem(
                                    evidence_id=evidences[0].id, new_sort_order=2
                                ),
                                ReorderEvidenceItem(
                                    evidence_id=evidences[1].id, new_sort_order=1
                                ),
                            ],
                            description="데모: 증거 순서 교환",
                        ),
                    )
                    _ok(10, "Create reorder ChangeSet", f"cs_id={cs.id} status={cs.status}")

                    # Step 11: Preview ChangeSet
                    cs_preview = self._change_svc().preview_changeset(
                        change_set_id=cs.id
                    )
                    result.evidence_preview_rows = [
                        DemoPreviewRow(
                            rendered_number=e.rendered_number,
                            rendered_label=e.rendered_label,
                        )
                        for e in cs_preview.evidence_list_preview
                    ]
                    _ok(11, "Preview ChangeSet", f"{len(result.evidence_preview_rows)} row(s)")

                    # Step 12: Commit ChangeSet
                    commit_result = self._change_svc().commit_changeset(
                        change_set_id=cs.id
                    )
                    result.version_label = commit_result.version_label
                    result.files_renamed = commit_result.files_renamed
                    _ok(
                        12,
                        "Commit ChangeSet",
                        f"version={commit_result.version_label} "
                        f"files_renamed={commit_result.files_renamed}",
                    )
                else:
                    for n, title in [
                        (10, "Create reorder ChangeSet"),
                        (11, "Preview ChangeSet"),
                        (12, "Commit ChangeSet"),
                    ]:
                        steps.append(
                            DemoStepResult(
                                step=n,
                                title=title,
                                success=False,
                                message="Skipped — fewer than 2 evidences",
                            )
                        )

                # ── Step 13: Export ──────────────────────────────────────────
                if skip_export:
                    result.export_skipped = True
                    steps.append(
                        DemoStepResult(
                            step=13,
                            title="Export",
                            success=True,
                            message="Skipped (--skip-export)",
                        )
                    )
                else:
                    try:
                        export_result = self._export_svc().export_case(
                            case_id=case.id,
                            request=ExportRequest(
                                include_document=True,
                                include_evidence_list=True,
                                include_rename_manifest=True,
                            ),
                        )
                        result.export_path = export_result.export_path
                        result.exported_files = list(export_result.exported_files)
                        _ok(13, "Export", f"path={export_result.export_path}")
                    except Exception as exp_err:
                        # Export failure is non-critical in demo context
                        steps.append(
                            DemoStepResult(
                                step=13,
                                title="Export",
                                success=False,
                                message=f"Non-critical failure: {exp_err}",
                            )
                        )

        except Exception:
            # Guarantee: roll back the DB session on ANY exception so the
            # caller receives a clean state.  Re-raise after rollback so the
            # caller can log / display the error.
            self.db.rollback()
            raise

        return result

    # ── Public: get_status() ─────────────────────────────────────────────────

    def get_status(self, case_id: int) -> WorkflowStatusResult:
        """
        Aggregate workflow state for a case and return a ``WorkflowStatusResult``.

        Raises
        ------
        app.core.exceptions.CaseNotFoundError
            If no case with the given id exists.
        """
        # Case
        case = self._case_svc().get_case(case_id)

        # Files
        files, _ = self._file_svc().list_files(case_id)
        doc_files = [f for f in files if f.role == "document"]
        ev_files = [f for f in files if f.role == "evidence_attachment"]

        # Documents
        docs, _ = self._doc_svc().list_documents(case_id)

        # Evidences
        evidences, ev_total = self._ev_svc().list_evidences(case_id)
        active_evs = [e for e in evidences if e.is_active]

        # References
        refs = self._ref_svc().list_references_by_case(case_id)

        # ChangeSets
        changesets, cs_total = self._change_svc().list_changesets(case_id)
        committed_cs = [c for c in changesets if c.status == "committed"]

        # Latest integrity report
        history = self._integrity_svc().get_integrity_history(
            case_id=case_id, limit=1
        )
        latest = history[0] if history else None

        return WorkflowStatusResult(
            case_id=case.id,
            case_name=case.name,
            case_status=case.status,
            court=case.court or "",
            case_number=case.case_number or "",
            total_files=len(files),
            document_files=len(doc_files),
            evidence_files=len(ev_files),
            total_documents=len(docs),
            total_evidences=ev_total,
            active_evidences=len(active_evs),
            active_references=len(refs),
            total_changesets=cs_total,
            committed_changesets=len(committed_cs),
            latest_integrity_passed=(
                latest.is_passed if latest is not None else None
            ),
            latest_integrity_violations=(
                latest.violation_count if latest is not None else 0
            ),
        )
