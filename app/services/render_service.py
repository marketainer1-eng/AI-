import hashlib
import json
from pathlib import Path
from sqlalchemy.orm import Session

from app.api.schemas.preview import (
    RenderPreviewResponse,
    DocumentPreview,
    EvidenceListEntryPreview,
    FileRenameEntryPreview,
    ChangeSetPreviewResponse,
)
from app.repositories.case_repository import CaseRepository
from app.repositories.document_repository import DocumentRepository, AnchorRepository
from app.repositories.evidence_repository import EvidenceRepository, EvidenceFileLinkRepository
from app.repositories.reference_repository import ReferenceRepository
from app.repositories.file_repository import FileRepository
from app.repositories.changeset_repository import ChangeSetRepository
from app.renderers.document_renderer import DocumentRenderer
from app.renderers.evidence_list_renderer import EvidenceListRenderer
from app.renderers.filename_renderer import FilenameRenderer
from app.core.exceptions import CaseNotFoundError


class RenderService:
    def __init__(self, db: Session):
        self.db = db
        self.case_repo = CaseRepository(db)
        self.doc_repo = DocumentRepository(db)
        self.anchor_repo = AnchorRepository(db)
        self.evidence_repo = EvidenceRepository(db)
        self.file_link_repo = EvidenceFileLinkRepository(db)
        self.ref_repo = ReferenceRepository(db)
        self.file_repo = FileRepository(db)
        self.cs_repo = ChangeSetRepository(db)

    def _build_number_map(
        self, case_id: int, party: str, override_orders: dict[int, int] | None = None
    ) -> dict[int, str]:
        """
        Build {evidence_id -> rendered_number_string} based on sort_order.
        override_orders: {evidence_id: new_sort_order} from a ChangeSet reorder operation.

        IMPORTANT: override values are applied as a pure in-memory computation —
        the ORM entity's sort_order field is NEVER mutated, preventing accidental
        flush of changes to the DB (which would violate the unique constraint).
        """
        evidences = self.evidence_repo.get_by_case(case_id, party=party)
        # Build effective sort order WITHOUT touching the ORM objects
        effective_orders: list[tuple[int, int]] = []
        for e in evidences:
            effective_sort = (
                override_orders[e.id]
                if override_orders and e.id in override_orders
                else e.sort_order
            )
            effective_orders.append((e.id, effective_sort))

        # Sort by effective sort order
        effective_orders.sort(key=lambda x: x[1])

        party_label = "갑" if party == "plaintiff" else "을"
        return {eid: f"{party_label} 제{rank+1}호증" for rank, (eid, _) in enumerate(effective_orders)}

    def render_preview(
        self, case_id: int, change_set_id: int | None = None
    ) -> RenderPreviewResponse:
        if self.case_repo.get_by_id(case_id) is None:
            raise CaseNotFoundError(case_id)

        # Determine override orders from changeset if provided
        override_orders: dict[int, int] = {}
        if change_set_id:
            cs = self.cs_repo.get_by_id(change_set_id)
            if cs:
                for op in cs.operations:
                    if op.op_type == "reorder_evidence":
                        payload = op.payload
                        for item in payload.get("items", []):
                            override_orders[item["evidence_id"]] = item["new_sort_order"]

        # Build number maps per party
        plaintiff_map = self._build_number_map(case_id, "plaintiff", override_orders)
        defendant_map = self._build_number_map(case_id, "defendant", override_orders)
        number_map = {**plaintiff_map, **defendant_map}

        # Document preview
        doc_preview = None
        documents = self.doc_repo.get_by_case(case_id)
        if documents:
            doc = documents[0]
            renderer = DocumentRenderer()
            sf = self.file_repo.get_by_id(doc.source_file_id)

            # Build anchor -> rendered_number map
            anchor_number_map: dict[str, str] = {}
            anchors = self.anchor_repo.get_by_document(doc.id)
            for anchor in anchors:
                ref = self.ref_repo.get_active_by_anchor(anchor.id)
                if ref and ref.evidence_id in number_map:
                    anchor_number_map[anchor.placeholder_text] = number_map[ref.evidence_id]

            if sf and Path(sf.storage_path).exists():
                paragraphs = renderer.render_to_paragraphs(
                    docx_path=Path(sf.storage_path),
                    placeholder_map=anchor_number_map,
                )
            else:
                paragraphs = []

            content_str = json.dumps(paragraphs)
            content_hash = hashlib.sha256(content_str.encode()).hexdigest()[:16]
            doc_preview = DocumentPreview(
                document_id=doc.id,
                paragraphs=paragraphs,
                content_hash=content_hash,
            )

        # Evidence list preview
        list_renderer = EvidenceListRenderer()
        evidence_list_preview = list_renderer.render(
            case_id=case_id,
            evidence_repo=self.evidence_repo,
            number_map=number_map,
        )

        # File rename preview
        filename_renderer = FilenameRenderer()
        file_rename_preview = filename_renderer.render(
            case_id=case_id,
            evidence_repo=self.evidence_repo,
            file_link_repo=self.file_link_repo,
            file_repo=self.file_repo,
            number_map=number_map,
        )

        return RenderPreviewResponse(
            case_id=case_id,
            change_set_id=change_set_id,
            document_preview=doc_preview,
            evidence_list_preview=evidence_list_preview,
            file_rename_preview=file_rename_preview,
        )
