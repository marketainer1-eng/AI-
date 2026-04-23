from sqlalchemy.orm import Session
from app.models.reference import Reference
from app.repositories.base import BaseRepository


class ReferenceRepository(BaseRepository[Reference]):
    def __init__(self, db: Session):
        super().__init__(db, Reference)

    def get_by_id(self, reference_id: int) -> Reference | None:
        return self.db.query(Reference).filter(Reference.id == reference_id).first()

    def get_active_by_anchor(self, anchor_id: int) -> Reference | None:
        return (
            self.db.query(Reference)
            .filter(Reference.anchor_id == anchor_id, Reference.status == "active")
            .first()
        )

    def get_active_by_evidence(self, evidence_id: int) -> list[Reference]:
        return (
            self.db.query(Reference)
            .filter(Reference.evidence_id == evidence_id, Reference.status == "active")
            .all()
        )

    def get_all_active_by_case(self, case_id: int) -> list[Reference]:
        """Join through anchor -> document to filter by case_id."""
        from app.models.document import DocumentAnchor, Document

        return (
            self.db.query(Reference)
            .join(DocumentAnchor, Reference.anchor_id == DocumentAnchor.id)
            .join(Document, DocumentAnchor.document_id == Document.id)
            .filter(Document.case_id == case_id, Reference.status == "active")
            .all()
        )

    def create(
        self, anchor_id: int, evidence_id: int, note: str | None = None
    ) -> Reference:
        ref = Reference(anchor_id=anchor_id, evidence_id=evidence_id, note=note)
        return self.add(ref)

    def deactivate(self, reference: Reference) -> Reference:
        reference.status = "superseded"
        self.db.flush()
        self.db.refresh(reference)
        return reference
