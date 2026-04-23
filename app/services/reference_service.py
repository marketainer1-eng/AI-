"""
app/services/reference_service.py
===================================
Business logic for Reference (anchor ↔ evidence link) management.

Rules:
- Each DocumentAnchor has at most ONE active Reference.
- Creating a new Reference for an anchor that already has one supersedes the old.
- Deactivating (unlinking) a Reference resets the anchor status to 'unlinked'.
"""

from __future__ import annotations

from sqlalchemy.orm import Session

from app.models.reference import Reference
from app.repositories.reference_repository import ReferenceRepository
from app.repositories.document_repository import AnchorRepository
from app.repositories.evidence_repository import EvidenceRepository
from app.repositories.integrity_repository import AuditLogRepository
from app.api.schemas.reference import ReferenceCreate, ReferenceResponse
from app.core.exceptions import (
    AnchorNotFoundError,
    EvidenceNotFoundError,
    ReferenceNotFoundError,
)


class ReferenceService:
    def __init__(self, db: Session):
        self.db = db
        self.repo = ReferenceRepository(db)
        self.anchor_repo = AnchorRepository(db)
        self.evidence_repo = EvidenceRepository(db)
        self.audit = AuditLogRepository(db)

    # ── Create ────────────────────────────────────────────────────────────────

    def create_reference(self, data: ReferenceCreate) -> Reference:
        anchor = self.anchor_repo.get(data.anchor_id)
        if anchor is None:
            raise AnchorNotFoundError(data.anchor_id)

        evidence = self.evidence_repo.get(data.evidence_id)
        if evidence is None:
            raise EvidenceNotFoundError(data.evidence_id)

        # Supersede existing active reference on this anchor (one-to-one invariant)
        existing = self.repo.get_active_by_anchor(data.anchor_id)
        if existing:
            self.repo.deactivate(existing)

        ref = self.repo.create(
            anchor_id=data.anchor_id,
            evidence_id=data.evidence_id,
            note=data.note,
        )

        # Mark anchor as linked
        anchor.status = "linked"
        self.db.flush()

        self.audit.log(
            action="reference_linked",
            case_id=evidence.case_id,
            entity_type="Reference",
            entity_id=ref.id,
            detail={"anchor_id": data.anchor_id, "evidence_id": data.evidence_id},
        )
        self.db.commit()
        self.db.refresh(ref)
        return ref

    # ── Read ──────────────────────────────────────────────────────────────────

    def get_reference(self, reference_id: int) -> Reference:
        ref = self.repo.get_by_id(reference_id)
        if ref is None:
            raise ReferenceNotFoundError(reference_id)
        return ref

    def list_references_by_evidence(
        self, case_id: int, evidence_id: int
    ) -> list[Reference]:
        """Return all active references for a given evidence (within a case)."""
        return self.repo.get_by_evidence_case(case_id, evidence_id)

    def list_references_by_case(
        self, case_id: int, skip: int = 0, limit: int = 200
    ) -> list[Reference]:
        return self.repo.get_all_by_case(case_id, skip=skip, limit=limit)

    # ── Deactivate ────────────────────────────────────────────────────────────

    def deactivate_reference(self, reference_id: int) -> Reference:
        ref = self.repo.get_by_id(reference_id)
        if ref is None:
            raise ReferenceNotFoundError(reference_id)

        self.repo.deactivate(ref)

        # Reset anchor to unlinked
        anchor = self.anchor_repo.get(ref.anchor_id)
        if anchor:
            anchor.status = "unlinked"
            self.db.flush()

        # Determine case_id via anchor → document → case
        case_id: int | None = None
        if anchor:
            from app.models.document import Document
            doc = self.db.get(Document, anchor.document_id)
            if doc:
                case_id = doc.case_id

        self.audit.log(
            action="reference_unlinked",
            case_id=case_id,
            entity_type="Reference",
            entity_id=reference_id,
            detail={"anchor_id": ref.anchor_id, "evidence_id": ref.evidence_id},
        )
        self.db.commit()
        self.db.refresh(ref)
        return ref

    # ── Response builder ──────────────────────────────────────────────────────

    def build_response(self, ref: Reference) -> ReferenceResponse:
        """Enrich a Reference ORM object with denormalized display fields."""
        anchor = self.anchor_repo.get(ref.anchor_id)
        evidence = self.evidence_repo.get(ref.evidence_id)

        placeholder_text = anchor.placeholder_text if anchor else None
        evidence_label = evidence.label if evidence else None
        rendered_number: str | None = None
        if evidence:
            party_char = "갑" if evidence.party == "plaintiff" else "을"
            rendered_number = f"{party_char} 제{evidence.sort_order}호증"

        return ReferenceResponse(
            id=ref.id,
            anchor_id=ref.anchor_id,
            evidence_id=ref.evidence_id,
            status=ref.status,
            note=ref.note,
            placeholder_text=placeholder_text,
            evidence_label=evidence_label,
            rendered_number=rendered_number,
            created_at=ref.created_at,
        )
