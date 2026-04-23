from sqlalchemy.orm import Session

from app.models.evidence import Evidence
from app.repositories.evidence_repository import EvidenceRepository, EvidenceFileLinkRepository
from app.repositories.file_repository import FileRepository
from app.repositories.case_repository import CaseRepository
from app.repositories.integrity_repository import AuditLogRepository
from app.api.schemas.evidence import EvidenceCreate, EvidenceUpdate
from app.core.exceptions import CaseNotFoundError, EvidenceNotFoundError


class EvidenceService:
    def __init__(self, db: Session):
        self.db = db
        self.repo = EvidenceRepository(db)
        self.link_repo = EvidenceFileLinkRepository(db)
        self.file_repo = FileRepository(db)
        self.case_repo = CaseRepository(db)
        self.audit = AuditLogRepository(db)

    def create_evidence(self, case_id: int, data: EvidenceCreate) -> Evidence:
        if self.case_repo.get_by_id(case_id) is None:
            raise CaseNotFoundError(case_id)

        sort_order = data.sort_order
        if sort_order == 0:
            max_order = self.repo.get_max_sort_order(case_id, data.party)
            sort_order = max_order + 1

        evidence = self.repo.create(
            case_id=case_id,
            party=data.party,
            label=data.label,
            description=data.description,
            sort_order=sort_order,
        )

        # Attach files
        for idx, file_id in enumerate(data.source_file_ids):
            sf = self.file_repo.get_by_id(file_id)
            if sf and sf.case_id == case_id:
                self.link_repo.create(
                    evidence_id=evidence.id,
                    source_file_id=file_id,
                    file_order=idx,
                )

        self.audit.log(
            action="evidence_created",
            case_id=case_id,
            entity_type="Evidence",
            entity_id=evidence.id,
            detail={"party": data.party, "label": data.label, "sort_order": sort_order},
        )
        self.db.commit()
        self.db.refresh(evidence)
        return evidence

    def list_evidences(self, case_id: int, party: str | None = None) -> list[Evidence]:
        if self.case_repo.get_by_id(case_id) is None:
            raise CaseNotFoundError(case_id)
        return self.repo.get_by_case(case_id, party=party)

    def get_evidence(self, case_id: int, evidence_id: int) -> Evidence:
        if self.case_repo.get_by_id(case_id) is None:
            raise CaseNotFoundError(case_id)
        e = self.repo.get_by_case_and_id(case_id, evidence_id)
        if e is None:
            raise EvidenceNotFoundError(evidence_id)
        return e

    def update_evidence(self, case_id: int, evidence_id: int, data: EvidenceUpdate) -> Evidence:
        e = self.get_evidence(case_id, evidence_id)
        for field, value in data.model_dump(exclude_none=True).items():
            setattr(e, field, value)
        self.db.flush()
        self.db.commit()
        self.db.refresh(e)
        return e

    def compute_rendered_number(self, evidence: Evidence, rank: int) -> str:
        """
        Compute the rendered evidence number string.
        rank = 1-based position within the party after sort_order ordering.
        """
        party_label = "갑" if evidence.party == "plaintiff" else "을"
        return f"{party_label} 제{rank}호증"
