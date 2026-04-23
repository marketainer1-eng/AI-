from sqlalchemy.orm import Session
from app.models.case import Case
from app.repositories.case_repository import CaseRepository
from app.repositories.integrity_repository import AuditLogRepository
from app.api.schemas.case import CaseCreate, CaseUpdate
from app.core.exceptions import CaseNotFoundError


class CaseService:
    def __init__(self, db: Session):
        self.db = db
        self.repo = CaseRepository(db)
        self.audit = AuditLogRepository(db)

    def create_case(self, data: CaseCreate) -> Case:
        case = self.repo.create(
            name=data.name,
            description=data.description,
            court=data.court,
            case_number=data.case_number,
        )
        self.audit.log(
            action="case_created",
            case_id=case.id,
            entity_type="Case",
            entity_id=case.id,
            detail={"name": case.name},
        )
        self.db.commit()
        return case

    def list_cases(self) -> list[Case]:
        return self.repo.get_all()

    def get_case(self, case_id: int) -> Case:
        case = self.repo.get_by_id(case_id)
        if case is None:
            raise CaseNotFoundError(case_id)
        return case

    def update_case(self, case_id: int, data: CaseUpdate) -> Case:
        case = self.get_case(case_id)
        update_kwargs = data.model_dump(exclude_none=True)
        case = self.repo.update(case, **update_kwargs)
        self.db.commit()
        return case
