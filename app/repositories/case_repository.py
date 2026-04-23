"""
app/repositories/case_repository.py
=====================================
Repository for Case.
"""

from __future__ import annotations

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.case import Case
from app.repositories.base import BaseRepository


class CaseRepository(BaseRepository[Case]):
    def __init__(self, db: Session):
        super().__init__(db, Case)

    def get_by_id(self, case_id: int) -> Case | None:
        return self.db.query(Case).filter(Case.id == case_id).first()

    def get_all(self, skip: int = 0, limit: int = 100) -> list[Case]:
        return (
            self.db.query(Case)
            .order_by(Case.created_at.desc())
            .offset(skip)
            .limit(limit)
            .all()
        )

    def count_all(self) -> int:
        return self.db.query(func.count(Case.id)).scalar() or 0

    def get_by_case_number(self, case_number: str) -> Case | None:
        return (
            self.db.query(Case)
            .filter(Case.case_number == case_number)
            .first()
        )

    def create(
        self,
        name: str,
        description: str | None,
        court: str | None,
        case_number: str | None,
    ) -> Case:
        case = Case(
            name=name,
            description=description,
            court=court,
            case_number=case_number,
        )
        return self.add(case)

    def update(self, case: Case, **kwargs) -> Case:
        for key, value in kwargs.items():
            setattr(case, key, value)
        self.db.flush()
        self.db.refresh(case)
        return case
