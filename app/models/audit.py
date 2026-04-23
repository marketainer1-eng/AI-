"""
app/models/audit.py
===================
AuditLog — append-only audit trail for all significant operations.

DDL mapping
-----------
Table      : audit_logs
PK         : id  SERIAL
Indexes    : ix_audit_logs_case_id
             ix_audit_logs_action            (filter by action type)
             ix_audit_logs_entity            (action, entity_type) composite
             ix_audit_logs_created_at        (chronological queries)
FK out     : case_id → cases.id  ON DELETE CASCADE  (nullable: system-level ops)

Action column
-------------
Uses AuditAction enum values stored as VARCHAR(100).

Design rules
------------
* NEVER update or delete audit_log rows.
* Write a row for every state-changing operation.
* detail (JSON) stores the diff / payload relevant to the action.
  Keep it human-readable (old/new values, affected IDs, etc.).
"""

from datetime import datetime
from sqlalchemy import (
    String, Integer, ForeignKey, DateTime, Index, JSON, func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base
from app.models.enums import AuditAction


class AuditLog(Base):
    """Immutable audit trail entry.

    Write on every state change; never update; never delete.

    ``case_id`` is nullable so that system-level events (e.g. DB migrations)
    that are not tied to a specific case can still be logged.

    detail JSON examples
    --------------------
    action = case_created:
        {"name": "손해배상 청구", "court": "서울중앙지방법원"}

    action = evidence_created:
        {"evidence_id": 5, "party": "plaintiff",
         "label": "계약서 사본", "sort_order": 2}

    action = change_committed:
        {"change_set_id": 3, "operations": 4,
         "version_number": 2, "version_label": "v2"}

    action = rollback_executed:
        {"rollback_change_set_id": 7,
         "target_version_number": 1,
         "new_version_number": 3}
    """

    __tablename__ = "audit_logs"

    # ── Primary key ──────────────────────────────────────────────────────────
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)

    # ── Foreign keys ─────────────────────────────────────────────────────────
    case_id: Mapped[int | None] = mapped_column(
        ForeignKey("cases.id", ondelete="CASCADE"),
        nullable=True,
        comment="NULL for system-level events not tied to a specific case",
    )

    # ── Event description ─────────────────────────────────────────────────────
    # AuditAction: case_created | file_uploaded | evidence_created | ...
    action: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
        comment="AuditAction enum value describing the operation",
    )
    entity_type: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True,
        comment="Table/model name of the primary affected entity (e.g. 'evidence')",
    )
    entity_id: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True,
        comment="Primary key of the primary affected entity",
    )
    detail: Mapped[dict] = mapped_column(
        JSON,
        nullable=False,
        default=dict,
        comment="Human-readable diff / payload; structure depends on action",
    )

    # ── Timestamp ────────────────────────────────────────────────────────────
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=False),
        server_default=func.now(),
        nullable=False,
    )

    # ── Table-level constraints & indexes ────────────────────────────────────
    __table_args__ = (
        Index("ix_audit_logs_case_id", "case_id"),
        Index("ix_audit_logs_action", "action"),
        # Composite: filter by (action, entity_type) efficiently
        Index("ix_audit_logs_entity", "action", "entity_type"),
        Index("ix_audit_logs_created_at", "created_at"),
    )

    # ── Relationships ─────────────────────────────────────────────────────────
    case: Mapped["Case | None"] = relationship(  # noqa: F821
        "Case",
        back_populates="audit_logs",
    )

    # ── Class-level factory helpers ───────────────────────────────────────────
    @classmethod
    def write(
        cls,
        action: AuditAction,
        case_id: int | None = None,
        entity_type: str | None = None,
        entity_id: int | None = None,
        detail: dict | None = None,
    ) -> "AuditLog":
        """Convenience factory — validates that ``action`` is a known AuditAction."""
        # Accept both enum instances and raw strings
        action_value = action.value if isinstance(action, AuditAction) else action
        return cls(
            case_id=case_id,
            action=action_value,
            entity_type=entity_type,
            entity_id=entity_id,
            detail=detail or {},
        )

    def __repr__(self) -> str:
        return (
            f"<AuditLog id={self.id} action={self.action!r} "
            f"case={self.case_id} entity={self.entity_type}:{self.entity_id}>"
        )
