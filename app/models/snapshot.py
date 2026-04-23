"""
app/models/snapshot.py
======================
VersionSnapshot — immutable state snapshot taken at ChangeSet commit time.

DDL mapping
-----------
Table      : version_snapshots
PK         : id  SERIAL
Unique     : uq_version_snapshots_change_set_id  (change_set_id)
               — one snapshot per committed ChangeSet
             uq_version_snapshots_case_version    (case_id, version_number)
               — version numbers are unique within a case
Indexes    : ix_version_snapshots_case_id
             ix_version_snapshots_change_set_id
FK out     : change_set_id → change_sets.id  ON DELETE CASCADE
             case_id       → cases.id         ON DELETE CASCADE

Purpose
-------
Snapshots enable rollback without modifying committed history.
Rolling back to v3 means:
  1. Read version_snapshots WHERE case_id=X AND version_number=3.
  2. Create a new ChangeSet with operations that restore the snapshotted state.
  3. Commit the new ChangeSet → new snapshot at v_current+1 is created.
The original v3 snapshot is NEVER modified.
"""

from datetime import datetime
from sqlalchemy import (
    String, Integer, ForeignKey, DateTime, Index,
    UniqueConstraint, JSON, func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base


class VersionSnapshot(Base):
    """Immutable state snapshot captured at ChangeSet commit time.

    JSON fields
    -----------
    evidence_snapshot : list of dicts
        [{"id": 1, "party": "plaintiff", "label": "...", "sort_order": 0,
          "is_active": true}, ...]

    reference_snapshot : list of dicts
        [{"id": 5, "anchor_id": 2, "evidence_id": 1, "status": "active"}, ...]

    file_link_snapshot : list of dicts
        [{"id": 3, "evidence_id": 1, "source_file_id": 7, "file_order": 0}, ...]

    These JSON arrays are self-contained: no JOIN to live tables needed
    to reconstruct the state at snapshot time.
    """

    __tablename__ = "version_snapshots"

    # ── Primary key ──────────────────────────────────────────────────────────
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)

    # ── Foreign keys ─────────────────────────────────────────────────────────
    change_set_id: Mapped[int] = mapped_column(
        ForeignKey("change_sets.id", ondelete="CASCADE"),
        nullable=False,
        comment="The ChangeSet that was committed when this snapshot was taken",
    )
    case_id: Mapped[int] = mapped_column(
        ForeignKey("cases.id", ondelete="CASCADE"),
        nullable=False,
        comment="Denormalised from ChangeSet.case_id for fast per-case queries",
    )

    # ── Version identity ──────────────────────────────────────────────────────
    version_label: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        comment="Human-readable label (e.g. 'v1', 'v2', 'rollback-to-v2')",
    )
    # Monotonically increasing integer per case; used for ordering & rollback targeting
    version_number: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        comment="Monotonically increasing version counter scoped to a case",
    )

    # ── Snapshot data (immutable JSON arrays) ─────────────────────────────────
    evidence_snapshot: Mapped[list] = mapped_column(
        JSON,
        nullable=False,
        default=list,
        comment="Snapshot of all Evidence rows at commit time",
    )
    reference_snapshot: Mapped[list] = mapped_column(
        JSON,
        nullable=False,
        default=list,
        comment="Snapshot of all Reference rows at commit time",
    )
    file_link_snapshot: Mapped[list] = mapped_column(
        JSON,
        nullable=False,
        default=list,
        comment="Snapshot of all EvidenceFileLink rows at commit time",
    )

    # ── Timestamps ───────────────────────────────────────────────────────────
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=False), server_default=func.now(), nullable=False
    )

    # ── Table-level constraints & indexes ────────────────────────────────────
    __table_args__ = (
        # One snapshot per committed ChangeSet
        UniqueConstraint(
            "change_set_id",
            name="uq_version_snapshots_change_set_id",
        ),
        # Version numbers must be unique within a case
        UniqueConstraint(
            "case_id", "version_number",
            name="uq_version_snapshots_case_version",
        ),
        Index("ix_version_snapshots_case_id", "case_id"),
        Index("ix_version_snapshots_change_set_id", "change_set_id"),
    )

    # ── Relationships ─────────────────────────────────────────────────────────
    change_set: Mapped["ChangeSet"] = relationship(  # noqa: F821
        "ChangeSet",
        back_populates="version_snapshot",
    )

    def __repr__(self) -> str:
        return (
            f"<VersionSnapshot id={self.id} "
            f"case={self.case_id} v{self.version_number} "
            f"label={self.version_label!r}>"
        )
