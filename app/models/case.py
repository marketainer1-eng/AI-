"""
app/models/case.py
==================
Case — root aggregate of the litigation case.

DDL mapping
-----------
Table      : cases
PK         : id  SERIAL
Unique     : (none — case names are not globally unique)
Indexes    : ix_cases_status  (status)
FK out     : (none)
FK in (1:N): source_files, documents, evidences, change_sets,
             integrity_reports, audit_logs

Status column
-------------
Uses CaseStatus enum values stored as VARCHAR(20).
Default: "active"  →  possible values: "active" | "closed"
"""

from datetime import datetime
from sqlalchemy import String, Text, DateTime, Index, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base
from app.models.enums import CaseStatus


class Case(Base):
    """Root aggregate: a single litigation case.

    All other entities (SourceFile, Document, Evidence, ChangeSet …)
    are owned by exactly one Case.  Cascade-delete is intentional —
    removing a Case wipes the full case tree from the DB.
    """

    __tablename__ = "cases"

    # ── Primary key ──────────────────────────────────────────────────────────
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)

    # ── Core fields ──────────────────────────────────────────────────────────
    name: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
        comment="Human-readable case name (e.g. '서울고법 2024나12345 손해배상')",
    )
    description: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Court / docket metadata (informational only)
    court: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
        comment="Court name (e.g. '서울중앙지방법원')",
    )
    case_number: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True,
        comment="Official docket number (e.g. '2024가합12345')",
    )

    # ── Status ───────────────────────────────────────────────────────────────
    # Stored as VARCHAR(20); controlled by CaseStatus enum.
    # active  → normal working state
    # closed  → archived / finalised; no further edits allowed
    status: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        default=CaseStatus.ACTIVE.value,
        server_default=CaseStatus.ACTIVE.value,
        comment="CaseStatus: active | closed",
    )

    # ── Timestamps ───────────────────────────────────────────────────────────
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=False), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=False),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    # ── Table-level constraints & indexes ────────────────────────────────────
    __table_args__ = (
        # Partial index: quickly list open cases
        Index("ix_cases_status", "status"),
    )

    # ── Relationships ─────────────────────────────────────────────────────────
    # All are cascade delete-orphan: deleting a Case removes everything below.

    source_files: Mapped[list["SourceFile"]] = relationship(  # noqa: F821
        "SourceFile",
        back_populates="case",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )
    documents: Mapped[list["Document"]] = relationship(  # noqa: F821
        "Document",
        back_populates="case",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )
    evidences: Mapped[list["Evidence"]] = relationship(  # noqa: F821
        "Evidence",
        back_populates="case",
        cascade="all, delete-orphan",
        passive_deletes=True,
        order_by="Evidence.sort_order",
    )
    change_sets: Mapped[list["ChangeSet"]] = relationship(  # noqa: F821
        "ChangeSet",
        back_populates="case",
        cascade="all, delete-orphan",
        passive_deletes=True,
        order_by="ChangeSet.created_at",
    )
    integrity_reports: Mapped[list["IntegrityReport"]] = relationship(  # noqa: F821
        "IntegrityReport",
        back_populates="case",
        cascade="all, delete-orphan",
        passive_deletes=True,
        order_by="IntegrityReport.checked_at",
    )
    audit_logs: Mapped[list["AuditLog"]] = relationship(  # noqa: F821
        "AuditLog",
        back_populates="case",
        cascade="all, delete-orphan",
        passive_deletes=True,
        order_by="AuditLog.created_at",
    )

    # ── Helpers ───────────────────────────────────────────────────────────────
    @property
    def is_active(self) -> bool:
        return self.status == CaseStatus.ACTIVE.value

    def __repr__(self) -> str:
        return f"<Case id={self.id} name={self.name!r} status={self.status}>"
