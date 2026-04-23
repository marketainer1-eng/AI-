from sqlalchemy.orm import Session

from app.models.reference import Reference
from app.repositories.reference_repository import ReferenceRepository
from app.repositories.document_repository import AnchorRepository
from app.repositories.evidence_repository import EvidenceRepository
from app.repositories.integrity_repository import AuditLogRepository
from app.api.schemas.reference import ReferenceCreate
from app.core.exceptions import EvidenceNotFoundError


class ReferenceService:
    def __init__(self, db: Session):
        self.db = db
        self.repo = ReferenceRepository(db)
        self.anchor_repo = AnchorRepository(db)
        self.evidence_repo = EvidenceRepository(db)
        self.audit = AuditLogRepository(db)

    def create_reference(self, data: ReferenceCreate) -> Reference:
        anchor = self.anchor_repo.get(data.anchor_id)
        if anchor is None:
            raise ValueError(f"DocumentAnchor {data.anchor_id} not found")

        evidence = self.evidence_repo.get(data.evidence_id)
        if evidence is None:
            raise EvidenceNotFoundError(data.evidence_id)

        # Deactivate existing active reference on this anchor (one anchor -> one evidence)
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
        return ref

    def get_reference(self, reference_id: int) -> Reference | None:
        return self.repo.get_by_id(reference_id)

    def deactivate_reference(self, reference_id: int) -> None:
        ref = self.repo.get_by_id(reference_id)
        if ref is None:
            return
        self.repo.deactivate(ref)

        # Mark anchor as unlinked
        anchor = self.anchor_repo.get(ref.anchor_id)
        if anchor:
            anchor.status = "unlinked"
            self.db.flush()

        self.db.commit()
