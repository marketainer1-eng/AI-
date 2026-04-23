"""
app/services/audit_service.py
==============================
Read-only service for querying the audit log.

Audit entries are written by other services; this service only reads them.
"""

from __future__ import annotations

from sqlalchemy.orm import Session

from app.models.audit import AuditLog
from app.repositories.integrity_repository import AuditLogRepository
from app.repositories.case_repository import CaseRepository
from app.core.exceptions import CaseNotFoundError


class AuditService:
    def __init__(self, db: Session):
        self.db = db
        self.repo = AuditLogRepository(db)
        self.case_repo = CaseRepository(db)

    def get_audit_logs(
        self,
        case_id: int,
        skip: int = 0,
        limit: int = 50,
        action_filter: str | None = None,
    ) -> tuple[list[AuditLog], int]:
        """Return (items, total) for a case's audit log."""
        if self.case_repo.get_by_id(case_id) is None:
            raise CaseNotFoundError(case_id)
        items = self.repo.get_by_case(
            case_id, skip=skip, limit=limit, action_filter=action_filter
        )
        total = self.repo.count_by_case(case_id, action_filter=action_filter)
        return items, total
