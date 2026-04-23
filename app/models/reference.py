"""
app/models/reference.py
=======================
Reference — canonical cross-reference between a DocumentAnchor and an Evidence.

DDL mapping
-----------
Table      : references
PK         : id  SERIAL
Unique     : uq_reference_anchor_evidence  (anchor_id, evidence_id)
               — prevents duplicate active links (each anchor↔evidence pair is unique)
Indexes    : ix_references_anchor_id
             ix_references_evidence_id
             ix_references_status
FK out     : anchor_id   → document_anchors.id  ON DELETE CASCADE
             evidence_id → evidences.id          ON DELETE CASCADE

Status column
-------------
Uses ReferenceStatus enum values stored as VARCHAR(50).
Default: "active"  →  possible values: "active" | "superseded"

Rollback semantics
------------------
When a rollback ChangeSet reverses a link_reference operation, the original
Reference is NOT deleted — its status is set to "superseded".
A new Reference (with status "active") is created by the rollback.
This preserves a complete audit trail.
"""

from datetime import datetime
from sqlalchemy import (
    String, ForeignKey, DateTime, Index, Text,
    UniqueConstraint, func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base
from app.models.enums import ReferenceStatus


class Reference(Base):
    """Links a DocumentAnchor to an Evidence.

    This is the canonical, auditable record that a document position
    refers to a specific piece of evidence.

    Uniqueness
    ----------
    A (anchor_id, evidence_id) pair can exist only once in the table.
    Multiple anchors can point to the same Evidence, and one anchor
    can theoretically point to multiple Evidences (e.g. compound refs).

    Audit trail
    -----------
    When a rollback supersedes a Reference, its status becomes "superseded"
    and a new Reference replaces it.  The old row is NEVER deleted.
    """

    __tablename__ = "references"

    # ── Primary key ──────────────────────────────────────────────────────────
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)

    # ── Foreign keys ─────────────────────────────────────────────────────────
    anchor_id: Mapped[int] = mapped_column(
        ForeignKey("document_anchors.id", ondelete="CASCADE"),
        nullable=False,
    )
    evidence_id: Mapped[int] = mapped_column(
        ForeignKey("evidences.id", ondelete="CASCADE"),
        nullable=False,
    )

    # ── Status ───────────────────────────────────────────────────────────────
    # ReferenceStatus: active | superseded
    status: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        default=ReferenceStatus.ACTIVE.value,
        server_default=ReferenceStatus.ACTIVE.value,
        comment="ReferenceStatus: active | superseded",
    )

    # Optional free-text note (e.g. 'linked during reorder on 2026-04-23')
    note: Mapped[str | None] = mapped_column(Text, nullable=True)

    # ── Timestamps ───────────────────────────────────────────────────────────
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=False), server_default=func.now(), nullable=False
    )

    # ── Table-level constraints & indexes ────────────────────────────────────
    __table_args__ = (
        # Each anchor↔evidence pair must be unique
        # (a second linking attempt should update status, not insert a duplicate)
        UniqueConstraint(
            "anchor_id", "evidence_id",
            name="uq_reference_anchor_evidence",
        ),
        Index("ix_references_anchor_id", "anchor_id"),
        Index("ix_references_evidence_id", "evidence_id"),
        Index("ix_references_status", "status"),
    )

    # ── Relationships ─────────────────────────────────────────────────────────
    anchor: Mapped["DocumentAnchor"] = relationship(  # noqa: F821
        "DocumentAnchor",
        back_populates="references",
    )
    evidence: Mapped["Evidence"] = relationship(
        "Evidence",
        back_populates="references",
    )

    # ── Helpers ───────────────────────────────────────────────────────────────
    @property
    def is_active(self) -> bool:
        return self.status == ReferenceStatus.ACTIVE.value

    def __repr__(self) -> str:
        return (
            f"<Reference id={self.id} anchor={self.anchor_id} "
            f"evidence={self.evidence_id} status={self.status}>"
        )
