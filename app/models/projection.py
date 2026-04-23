from datetime import datetime
from sqlalchemy import String, Integer, ForeignKey, DateTime, func, Text, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base


class DocumentProjection(Base):
    """
    Rendered preview of the document body with evidence numbers substituted.
    This is a PROJECTION — not source of truth.
    Regenerated on each render-preview call.
    """

    __tablename__ = "document_projections"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    document_id: Mapped[int] = mapped_column(
        ForeignKey("documents.id"), nullable=False, index=True
    )
    change_set_id: Mapped[int | None] = mapped_column(
        ForeignKey("change_sets.id"), nullable=True, index=True
    )

    # Rendered content (DOCX paragraph list as JSON or plain text)
    rendered_content: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)
    # Hash of the rendered content for change detection
    content_hash: Mapped[str | None] = mapped_column(String(64), nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    # Relationships
    document: Mapped["Document"] = relationship(  # noqa: F821
        "Document", back_populates="projections"
    )
    change_set: Mapped["ChangeSet | None"] = relationship(  # noqa: F821
        "ChangeSet", back_populates="document_projections"
    )

    def __repr__(self) -> str:
        return f"<DocumentProjection id={self.id} doc={self.document_id}>"


class EvidenceListProjection(Base):
    """
    Rendered preview of an evidence list entry.
    Computed from Evidence.sort_order at render time.
    This is a PROJECTION — not source of truth.
    """

    __tablename__ = "evidence_list_projections"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    evidence_id: Mapped[int] = mapped_column(
        ForeignKey("evidences.id"), nullable=False, index=True
    )
    change_set_id: Mapped[int | None] = mapped_column(
        ForeignKey("change_sets.id"), nullable=True, index=True
    )

    # Computed evidence number string, e.g. "갑 제1호증"
    rendered_number: Mapped[str] = mapped_column(String(100), nullable=False)
    rendered_label: Mapped[str] = mapped_column(String(512), nullable=False)
    rendered_description: Mapped[str | None] = mapped_column(Text, nullable=True)
    sort_order_snapshot: Mapped[int] = mapped_column(Integer, nullable=False)

    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    # Relationships
    evidence: Mapped["Evidence"] = relationship(  # noqa: F821
        "Evidence", back_populates="evidence_list_projections"
    )
    change_set: Mapped["ChangeSet | None"] = relationship(  # noqa: F821
        "ChangeSet", back_populates="evidence_list_projections"
    )

    def __repr__(self) -> str:
        return f"<EvidenceListProjection id={self.id} number={self.rendered_number!r}>"


class FileRenamePlan(Base):
    """
    A planned file rename operation.
    Actual file rename on disk happens ONLY at commit time.
    This is a PROJECTION of the intended final filename.
    """

    __tablename__ = "file_rename_plans"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    source_file_id: Mapped[int] = mapped_column(
        ForeignKey("source_files.id"), nullable=False, index=True
    )
    change_set_id: Mapped[int | None] = mapped_column(
        ForeignKey("change_sets.id"), nullable=True, index=True
    )

    current_filename: Mapped[str] = mapped_column(String(512), nullable=False)
    planned_filename: Mapped[str] = mapped_column(String(512), nullable=False)
    # Status: planned | committed | reverted
    status: Mapped[str] = mapped_column(String(50), nullable=False, default="planned")

    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    committed_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    # Relationships
    source_file: Mapped["SourceFile"] = relationship(  # noqa: F821
        "SourceFile", back_populates="file_rename_plans"
    )
    change_set: Mapped["ChangeSet | None"] = relationship(  # noqa: F821
        "ChangeSet", back_populates="file_rename_plans"
    )

    def __repr__(self) -> str:
        return f"<FileRenamePlan {self.current_filename!r} -> {self.planned_filename!r}>"
