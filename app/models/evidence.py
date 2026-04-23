from datetime import datetime
from sqlalchemy import String, Integer, ForeignKey, DateTime, func, Text, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base


class Evidence(Base):
    """
    Canonical evidence entity.
    Number (갑 제N호증) is a PROJECTION computed at render time.
    Do NOT store the final number here — store sort_order for ordering.
    """

    __tablename__ = "evidences"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    case_id: Mapped[int] = mapped_column(ForeignKey("cases.id"), nullable=False, index=True)

    # Evidence party type: plaintiff (갑) | defendant (을)
    party: Mapped[str] = mapped_column(String(20), nullable=False, default="plaintiff")
    # Human-readable label, e.g. "계약서 사본"
    label: Mapped[str] = mapped_column(String(512), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    # sort_order determines the rendered number — NOT the canonical number
    sort_order: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    # Whether this evidence is active (soft-delete for rollback safety)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), onupdate=func.now()
    )

    # Relationships
    case: Mapped["Case"] = relationship("Case", back_populates="evidences")  # noqa: F821
    file_links: Mapped[list["EvidenceFileLink"]] = relationship(
        "EvidenceFileLink", back_populates="evidence", cascade="all, delete-orphan"
    )
    references: Mapped[list["Reference"]] = relationship(  # noqa: F821
        "Reference", back_populates="evidence", cascade="all, delete-orphan"
    )
    evidence_list_projections: Mapped[list["EvidenceListProjection"]] = relationship(  # noqa: F821
        "EvidenceListProjection", back_populates="evidence", cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<Evidence id={self.id} party={self.party} label={self.label!r}>"


class EvidenceFileLink(Base):
    """
    Links an Evidence to one or more SourceFiles.
    Canonical data — not a projection.
    """

    __tablename__ = "evidence_file_links"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    evidence_id: Mapped[int] = mapped_column(
        ForeignKey("evidences.id"), nullable=False, index=True
    )
    source_file_id: Mapped[int] = mapped_column(
        ForeignKey("source_files.id"), nullable=False, index=True
    )
    # Order within the evidence (e.g., multi-page evidence)
    file_order: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    # Relationships
    evidence: Mapped["Evidence"] = relationship("Evidence", back_populates="file_links")
    source_file: Mapped["SourceFile"] = relationship(  # noqa: F821
        "SourceFile", back_populates="evidence_file_links"
    )

    def __repr__(self) -> str:
        return f"<EvidenceFileLink evidence={self.evidence_id} file={self.source_file_id}>"
