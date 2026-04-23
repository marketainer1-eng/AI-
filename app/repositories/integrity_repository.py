"""
app/repositories/integrity_repository.py
=========================================
Repositories for IntegrityReport and AuditLog.

IntegrityReport  — one report per integrity check run; append-only.
AuditLog         — immutable audit trail; written via factory method only.
"""

from __future__ import annotations

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.integrity import IntegrityReport
from app.models.audit import AuditLog
from app.repositories.base import BaseRepository


class IntegrityReportRepository(BaseRepository[IntegrityReport]):
    def __init__(self, db: Session):
        super().__init__(db, IntegrityReport)

    def get_latest_by_case(self, case_id: int) -> IntegrityReport | None:
        return (
            self.db.query(IntegrityReport)
            .filter(IntegrityReport.case_id == case_id)
            .order_by(IntegrityReport.checked_at.desc())
            .first()
        )

    def get_history(self, case_id: int, limit: int = 10) -> list[IntegrityReport]:
        return (
            self.db.query(IntegrityReport)
            .filter(IntegrityReport.case_id == case_id)
            .order_by(IntegrityReport.checked_at.desc())
            .limit(limit)
            .all()
        )

    def get_count_by_case(self, case_id: int) -> int:
        return (
            self.db.query(func.count(IntegrityReport.id))
            .filter(IntegrityReport.case_id == case_id)
            .scalar()
            or 0
        )

    def create(
        self,
        case_id: int,
        result: str,
        is_passed: bool,
        violations: list,
        warnings: list,
    ) -> IntegrityReport:
        report = IntegrityReport(
            case_id=case_id,
            result=result,
            is_passed=is_passed,
            violations=violations,
            violation_count=len(violations),
            warnings=warnings,
            warning_count=len(warnings),
        )
        return self.add(report)


class AuditLogRepository(BaseRepository[AuditLog]):
    def __init__(self, db: Session):
        super().__init__(db, AuditLog)

    def log(
        self,
        action: str,
        case_id: int | None = None,
        entity_type: str | None = None,
        entity_id: int | None = None,
        detail: dict | None = None,
    ) -> AuditLog:
        """Append an immutable audit entry (flushed immediately, committed by caller)."""
        entry = AuditLog(
            case_id=case_id,
            action=action,
            entity_type=entity_type,
            entity_id=entity_id,
            detail=detail or {},
        )
        return self.add(entry)

    def get_by_case(
        self,
        case_id: int,
        skip: int = 0,
        limit: int = 50,
        action_filter: str | None = None,
    ) -> list[AuditLog]:
        """Return audit entries for a case, newest first."""
        q = (
            self.db.query(AuditLog)
            .filter(AuditLog.case_id == case_id)
            .order_by(AuditLog.created_at.desc())
        )
        if action_filter:
            q = q.filter(AuditLog.action == action_filter)
        return q.offset(skip).limit(limit).all()

    def count_by_case(self, case_id: int, action_filter: str | None = None) -> int:
        q = (
            self.db.query(func.count(AuditLog.id))
            .filter(AuditLog.case_id == case_id)
        )
        if action_filter:
            q = q.filter(AuditLog.action == action_filter)
        return q.scalar() or 0
