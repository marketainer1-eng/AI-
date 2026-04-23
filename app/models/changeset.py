from datetime import datetime
from sqlalchemy import String, Integer, ForeignKey, DateTime, func, Text, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base


class ChangeSet(Base):
    """
    A batch of proposed changes (reorder, relabel, etc.).
    Changes are NOT applied until commit().
    Rollback creates a new ChangeSet reversing the committed one.
    """

    __tablename__ = "change_sets"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    case_id: Mapped[int] = mapped_column(ForeignKey("cases.id"), nullable=False, index=True)

    # Status: draft | previewed | committed | rolled_back
    status: Mapped[str] = mapped_column(String(50), nullable=False, default="draft")
    description: Mapped[str | None] = mapped_column(Text, nullable=True)

    # If this ChangeSet is a rollback of another
    rolled_back_from_id: Mapped[int | None] = mapped_column(
        ForeignKey("change_sets.id"), nullable=True
    )

    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    committed_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    # Relationships
    case: Mapped["Case"] = relationship("Case", back_populates="change_sets")  # noqa: F821
    operations: Mapped[list["ChangeOperation"]] = relationship(
        "ChangeOperation", back_populates="change_set", cascade="all, delete-orphan"
    )
    document_projections: Mapped[list["DocumentProjection"]] = relationship(  # noqa: F821
        "DocumentProjection", back_populates="change_set", cascade="all, delete-orphan"
    )
    evidence_list_projections: Mapped[list["EvidenceListProjection"]] = relationship(  # noqa: F821
        "EvidenceListProjection", back_populates="change_set", cascade="all, delete-orphan"
    )
    file_rename_plans: Mapped[list["FileRenamePlan"]] = relationship(  # noqa: F821
        "FileRenamePlan", back_populates="change_set", cascade="all, delete-orphan"
    )
    version_snapshot: Mapped["VersionSnapshot | None"] = relationship(  # noqa: F821
        "VersionSnapshot", back_populates="change_set", uselist=False
    )
    rolled_back_from: Mapped["ChangeSet | None"] = relationship(
        "ChangeSet", remote_side="ChangeSet.id", foreign_keys=[rolled_back_from_id]
    )

    def __repr__(self) -> str:
        return f"<ChangeSet id={self.id} status={self.status}>"


class ChangeOperation(Base):
    """
    A single atomic operation within a ChangeSet.
    op_type: reorder_evidence | relabel_evidence | link_reference | unlink_reference
    payload: JSON with op-specific data.
    """

    __tablename__ = "change_operations"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    change_set_id: Mapped[int] = mapped_column(
        ForeignKey("change_sets.id"), nullable=False, index=True
    )

    # Operation type
    op_type: Mapped[str] = mapped_column(String(100), nullable=False)
    # Sequence within the change set
    sequence: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    # JSON payload (op-specific)
    payload: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)
    # Status: pending | applied | reverted
    status: Mapped[str] = mapped_column(String(50), nullable=False, default="pending")

    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    # Relationships
    change_set: Mapped["ChangeSet"] = relationship("ChangeSet", back_populates="operations")

    def __repr__(self) -> str:
        return f"<ChangeOperation id={self.id} type={self.op_type}>"
