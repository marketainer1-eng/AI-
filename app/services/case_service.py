"""
app/services/case_service.py
=============================
Business logic for Case CRUD operations.
"""

from __future__ import annotations

from sqlalchemy.orm import Session

from app.models.case import Case
from app.models.audit import AuditLog
from app.repositories.case_repository import CaseRepository
from app.repositories.integrity_repository import AuditLogRepository
from app.api.schemas.case import CaseCreate, CaseUpdate
from app.core.exceptions import CaseNotFoundError


class CaseService:
    def __init__(self, db: Session):
        self.db = db
        self.repo = CaseRepository(db)
        self.audit = AuditLogRepository(db)

    # ── Create ────────────────────────────────────────────────────────────────

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
        self.db.refresh(case)
        return case

    # ── Read ──────────────────────────────────────────────────────────────────

    def list_cases(self, skip: int = 0, limit: int = 100) -> tuple[list[Case], int]:
        """Return (items, total_count)."""
        items = self.repo.get_all(skip=skip, limit=limit)
        total = self.repo.count_all()
        return items, total

    def get_case(self, case_id: int) -> Case:
        case = self.repo.get_by_id(case_id)
        if case is None:
            raise CaseNotFoundError(case_id)
        return case

    # ── Update ────────────────────────────────────────────────────────────────

    def update_case(self, case_id: int, data: CaseUpdate) -> Case:
        case = self.get_case(case_id)
        update_kwargs = data.model_dump(exclude_none=True)
        if not update_kwargs:
            return case
        case = self.repo.update(case, **update_kwargs)
        self.audit.log(
            action="case_updated",
            case_id=case.id,
            entity_type="Case",
            entity_id=case.id,
            detail=update_kwargs,
        )
        self.db.commit()
        self.db.refresh(case)
        return case
