"""
app/models/integrity.py
=======================
IntegrityReport — result of an integrity check run on a case.

DDL mapping
-----------
Table      : integrity_reports
PK         : id  SERIAL
Indexes    : ix_integrity_reports_case_id
             ix_integrity_reports_checked_at    (for chronological history queries)
             ix_integrity_reports_result        (filter by pass/fail)
FK out     : case_id → cases.id  ON DELETE CASCADE

Result column
-------------
Uses IntegrityResult enum values stored as VARCHAR(20).
Possible values: "pass" | "fail"

Violation / warning format
--------------------------
violations (JSON array):
  [
    {
      "type": "UNLINKED_ANCHOR",   # violation code
      "severity": "error",
      "anchor_id": 5,
      "document_id": 2,
      "placeholder": "갑 제3호증",
      "message": "Anchor not linked to any Evidence"
    },
    ...
  ]

warnings (JSON array):
  [
    {
      "type": "DUPLICATE_SORT_ORDER",
      "severity": "warning",
      "evidence_ids": [3, 7],
      "message": "Two evidences share the same sort_order"
    },
    ...
  ]
"""

from datetime import datetime
from sqlalchemy import (
    String, Integer, ForeignKey, DateTime, Index,
    Boolean, JSON, func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base
from app.models.enums import IntegrityResult


class IntegrityReport(Base):
    """Append-only record of one integrity check run.

    Reports are never updated — each check creates a new row.
    History is queryable via the ix_integrity_reports_checked_at index.

    Violation types (not exhaustive)
    ---------------------------------
    UNLINKED_ANCHOR         : DocumentAnchor with no active Reference
    ORPHAN_REFERENCE        : Reference whose Evidence is inactive
    DUPLICATE_SORT_ORDER    : Two active Evidences share (case, party, sort_order)
    MISSING_SOURCE_FILE     : SourceFile path does not exist on disk
    EVIDENCE_WITHOUT_FILE   : Evidence has no EvidenceFileLink
    """

    __tablename__ = "integrity_reports"

    # ── Primary key ──────────────────────────────────────────────────────────
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)

    # ── Foreign keys ─────────────────────────────────────────────────────────
    case_id: Mapped[int] = mapped_column(
        ForeignKey("cases.id", ondelete="CASCADE"),
        nullable=False,
    )

    # ── Result ───────────────────────────────────────────────────────────────
    # IntegrityResult: pass | fail
    result: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        comment="IntegrityResult: pass | fail",
    )
    is_passed: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=False,
        server_default="false",
        comment="True when result = 'pass' (zero violations); denormalised for easy filtering",
    )

    # ── Violations ───────────────────────────────────────────────────────────
    violations: Mapped[list] = mapped_column(
        JSON,
        nullable=False,
        default=list,
        comment="List of violation dicts; empty when is_passed = true",
    )
    violation_count: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=0,
        server_default="0",
        comment="len(violations); denormalised for fast count queries",
    )

    # ── Warnings ─────────────────────────────────────────────────────────────
    warnings: Mapped[list] = mapped_column(
        JSON,
        nullable=False,
        default=list,
        comment="Non-blocking issues; does not affect is_passed",
    )
    warning_count: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=0,
        server_default="0",
        comment="len(warnings); denormalised for fast count queries",
    )

    # ── Timestamp ────────────────────────────────────────────────────────────
    checked_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=False),
        server_default=func.now(),
        nullable=False,
        comment="When the integrity check was run",
    )

    # ── Table-level constraints & indexes ────────────────────────────────────
    __table_args__ = (
        Index("ix_integrity_reports_case_id", "case_id"),
        Index("ix_integrity_reports_checked_at", "checked_at"),
        # Filter by pass/fail quickly (e.g. "last 10 failed checks")
        Index("ix_integrity_reports_result", "result"),
    )

    # ── Relationships ─────────────────────────────────────────────────────────
    case: Mapped["Case"] = relationship(  # noqa: F821
        "Case",
        back_populates="integrity_reports",
    )

    # ── Helpers ───────────────────────────────────────────────────────────────
    @classmethod
    def build(
        cls,
        case_id: int,
        violations: list[dict],
        warnings: list[dict],
    ) -> "IntegrityReport":
        """Factory: compute derived fields automatically."""
        passed = len(violations) == 0
        return cls(
            case_id=case_id,
            result=IntegrityResult.PASS.value if passed else IntegrityResult.FAIL.value,
            is_passed=passed,
            violations=violations,
            violation_count=len(violations),
            warnings=warnings,
            warning_count=len(warnings),
        )

    def __repr__(self) -> str:
        return (
            f"<IntegrityReport id={self.id} case={self.case_id} "
            f"result={self.result} violations={self.violation_count}>"
        )
