from sqlalchemy.orm import Session
from app.models.evidence import Evidence, EvidenceFileLink
from app.repositories.base import BaseRepository


class EvidenceRepository(BaseRepository[Evidence]):
    def __init__(self, db: Session):
        super().__init__(db, Evidence)

    def get_by_id(self, evidence_id: int) -> Evidence | None:
        return self.db.query(Evidence).filter(Evidence.id == evidence_id).first()

    def get_by_case(self, case_id: int, party: str | None = None) -> list[Evidence]:
        q = self.db.query(Evidence).filter(
            Evidence.case_id == case_id, Evidence.is_active.is_(True)
        )
        if party:
            q = q.filter(Evidence.party == party)
        return q.order_by(Evidence.party.asc(), Evidence.sort_order.asc()).all()

    def get_by_case_and_id(self, case_id: int, evidence_id: int) -> Evidence | None:
        return (
            self.db.query(Evidence)
            .filter(Evidence.case_id == case_id, Evidence.id == evidence_id)
            .first()
        )

    def create(
        self,
        case_id: int,
        party: str,
        label: str,
        description: str | None,
        sort_order: int,
    ) -> Evidence:
        e = Evidence(
            case_id=case_id,
            party=party,
            label=label,
            description=description,
            sort_order=sort_order,
        )
        return self.add(e)

    def get_max_sort_order(self, case_id: int, party: str) -> int:
        result = (
            self.db.query(Evidence.sort_order)
            .filter(Evidence.case_id == case_id, Evidence.party == party)
            .order_by(Evidence.sort_order.desc())
            .first()
        )
        return result[0] if result else 0


class EvidenceFileLinkRepository(BaseRepository[EvidenceFileLink]):
    def __init__(self, db: Session):
        super().__init__(db, EvidenceFileLink)

    def get_by_evidence(self, evidence_id: int) -> list[EvidenceFileLink]:
        return (
            self.db.query(EvidenceFileLink)
            .filter(EvidenceFileLink.evidence_id == evidence_id)
            .order_by(EvidenceFileLink.file_order.asc())
            .all()
        )

    def create(
        self, evidence_id: int, source_file_id: int, file_order: int
    ) -> EvidenceFileLink:
        link = EvidenceFileLink(
            evidence_id=evidence_id,
            source_file_id=source_file_id,
            file_order=file_order,
        )
        return self.add(link)
