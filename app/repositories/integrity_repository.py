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
        entry = AuditLog(
            case_id=case_id,
            action=action,
            entity_type=entity_type,
            entity_id=entity_id,
            detail=detail or {},
        )
        return self.add(entry)
