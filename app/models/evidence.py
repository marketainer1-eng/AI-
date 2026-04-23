"""
app/models/evidence.py
======================
Evidence + EvidenceFileLink

DDL mapping
-----------
evidences
  PK         : id  SERIAL
  Unique     : uq_evidence_case_party_sort  (case_id, party, sort_order)
                 — within a case, each party's evidence numbers are unique
  Indexes    : ix_evidences_case_id
               ix_evidences_party
               ix_evidences_is_active
  FK out     : case_id → cases.id  ON DELETE CASCADE

evidence_file_links
  PK         : id  SERIAL
  Unique     : uq_efl_evidence_file  (evidence_id, source_file_id)
                 — same file cannot be linked to the same evidence twice
  Indexes    : ix_evidence_file_links_evidence_id
               ix_evidence_file_links_source_file_id
  FK out     : evidence_id   → evidences.id    ON DELETE CASCADE
               source_file_id → source_files.id ON DELETE RESTRICT

Party column
------------
Uses EvidenceParty enum values stored as VARCHAR(20).
Default: "plaintiff"  →  possible values: "plaintiff" | "defendant"

Sort order & numbering
----------------------
``sort_order`` is the ONLY canonical ordering field.
The rendered evidence number (갑 제N호증) is computed at render time from
``sort_order`` — it is NEVER stored in this table.
"""

from datetime import datetime
from sqlalchemy import (
    String, Integer, ForeignKey, DateTime, Index, Text,
    Boolean, UniqueConstraint, func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base
from app.models.enums import EvidenceParty


class Evidence(Base):
    """Canonical evidence entity.

    The rendered number (e.g. '갑 제1호증') is a PROJECTION computed at
    render time from (party, sort_order).  Do NOT store the number here.

    Soft-delete
    -----------
    ``is_active = False`` flags evidence as removed without physically
    deleting the row so that rollback history remains intact.

    File links
    ----------
    An evidence may have multiple backing files (e.g. multi-page scanned
    document split across several PDFs / DOCX files).  Order is given by
    EvidenceFileLink.file_order.
    """

    __tablename__ = "evidences"

    # ── Primary key ──────────────────────────────────────────────────────────
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)

    # ── Foreign keys ─────────────────────────────────────────────────────────
    case_id: Mapped[int] = mapped_column(
        ForeignKey("cases.id", ondelete="CASCADE"),
        nullable=False,
    )

    # ── Core fields ──────────────────────────────────────────────────────────
    # EvidenceParty: plaintiff | defendant
    party: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        default=EvidenceParty.PLAINTIFF.value,
        server_default=EvidenceParty.PLAINTIFF.value,
        comment="EvidenceParty: plaintiff (갑) | defendant (을)",
    )
    label: Mapped[str] = mapped_column(
        String(512),
        nullable=False,
        comment="Human-readable description of the evidence (e.g. '계약서 사본')",
    )
    description: Mapped[str | None] = mapped_column(Text, nullable=True)

    # sort_order determines rendered number — NOT a canonical number
    sort_order: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=0,
        server_default="0",
        comment=(
            "Ordering within (case, party).  "
            "Rendered number = sort_order + 1 (1-indexed)."
        ),
    )

    # Soft-delete flag: False = logically removed; kept for rollback history
    is_active: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=True,
        server_default="true",
        comment="False = soft-deleted; row retained for rollback history",
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
        # Within one case+party, each sort_order must be unique
        # (prevents two evidences from having the same rendered number)
        UniqueConstraint(
            "case_id", "party", "sort_order",
            name="uq_evidence_case_party_sort",
        ),
        Index("ix_evidences_case_id", "case_id"),
        Index("ix_evidences_party", "party"),
        Index("ix_evidences_is_active", "is_active"),
    )

    # ── Relationships ─────────────────────────────────────────────────────────
    case: Mapped["Case"] = relationship(  # noqa: F821
        "Case",
        back_populates="evidences",
    )
    file_links: Mapped[list["EvidenceFileLink"]] = relationship(
        "EvidenceFileLink",
        back_populates="evidence",
        cascade="all, delete-orphan",
        passive_deletes=True,
        order_by="EvidenceFileLink.file_order",
    )
    references: Mapped[list["Reference"]] = relationship(  # noqa: F821
        "Reference",
        back_populates="evidence",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )
    evidence_list_projections: Mapped[list["EvidenceListProjection"]] = relationship(  # noqa: F821
        "EvidenceListProjection",
        back_populates="evidence",
        cascade="all, delete-orphan",
        passive_deletes=True,
        order_by="EvidenceListProjection.created_at.desc()",
    )

    # ── Helpers ───────────────────────────────────────────────────────────────
    @property
    def rendered_number(self) -> str:
        """Compute display number (e.g. '갑 제1호증'). Convenience only — NOT stored."""
        party_char = "갑" if self.party == EvidenceParty.PLAINTIFF.value else "을"
        return f"{party_char} 제{self.sort_order + 1}호증"

    def __repr__(self) -> str:
        return (
            f"<Evidence id={self.id} party={self.party} "
            f"sort_order={self.sort_order} label={self.label!r}>"
        )


class EvidenceFileLink(Base):
    """Many-to-many join between Evidence and SourceFile.

    Canonical (not a projection).  One evidence may be backed by
    multiple files; ``file_order`` gives the display order within that evidence.

    Unique constraint
    -----------------
    The same SourceFile cannot be linked to the same Evidence more than once.
    ``file_order`` uniqueness is NOT enforced at DB level (caller manages it).
    """

    __tablename__ = "evidence_file_links"

    # ── Primary key ──────────────────────────────────────────────────────────
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)

    # ── Foreign keys ─────────────────────────────────────────────────────────
    evidence_id: Mapped[int] = mapped_column(
        ForeignKey("evidences.id", ondelete="CASCADE"),
        nullable=False,
    )
    # RESTRICT: cannot delete a SourceFile that is linked to an Evidence
    source_file_id: Mapped[int] = mapped_column(
        ForeignKey("source_files.id", ondelete="RESTRICT"),
        nullable=False,
    )

    # Order within the evidence for multi-file evidences
    file_order: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=0,
        server_default="0",
        comment="Display order within the evidence for multi-file evidences",
    )

    # ── Timestamps ───────────────────────────────────────────────────────────
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=False), server_default=func.now(), nullable=False
    )

    # ── Table-level constraints & indexes ────────────────────────────────────
    __table_args__ = (
        # Same file cannot be linked to the same evidence twice
        UniqueConstraint(
            "evidence_id", "source_file_id",
            name="uq_efl_evidence_file",
        ),
        Index("ix_evidence_file_links_evidence_id", "evidence_id"),
        Index("ix_evidence_file_links_source_file_id", "source_file_id"),
    )

    # ── Relationships ─────────────────────────────────────────────────────────
    evidence: Mapped["Evidence"] = relationship("Evidence", back_populates="file_links")
    source_file: Mapped["SourceFile"] = relationship(  # noqa: F821
        "SourceFile",
        back_populates="evidence_file_links",
    )

    def __repr__(self) -> str:
        return (
            f"<EvidenceFileLink evidence_id={self.evidence_id} "
            f"source_file_id={self.source_file_id} order={self.file_order}>"
        )
