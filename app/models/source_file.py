from datetime import datetime
from sqlalchemy import String, Integer, ForeignKey, DateTime, func, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base


class SourceFile(Base):
    """Canonical representation of an uploaded physical file."""

    __tablename__ = "source_files"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    case_id: Mapped[int] = mapped_column(ForeignKey("cases.id"), nullable=False, index=True)

    # Original filename as uploaded
    original_filename: Mapped[str] = mapped_column(String(512), nullable=False)
    # Stored filename (UUID-based, immutable)
    stored_filename: Mapped[str] = mapped_column(String(512), nullable=False, unique=True)
    # Storage path relative to UPLOAD_DIR
    storage_path: Mapped[str] = mapped_column(String(1024), nullable=False)
    file_size_bytes: Mapped[int | None] = mapped_column(Integer, nullable=True)
    mime_type: Mapped[str | None] = mapped_column(String(255), nullable=True)
    # sha256 hash for deduplication
    file_hash: Mapped[str | None] = mapped_column(String(64), nullable=True)

    # File role: evidence_attachment | document | unknown
    role: Mapped[str] = mapped_column(String(50), nullable=False, default="unknown")

    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    # Relationships
    case: Mapped["Case"] = relationship("Case", back_populates="source_files")  # noqa: F821
    evidence_file_links: Mapped[list["EvidenceFileLink"]] = relationship(  # noqa: F821
        "EvidenceFileLink", back_populates="source_file", cascade="all, delete-orphan"
    )
    file_rename_plans: Mapped[list["FileRenamePlan"]] = relationship(  # noqa: F821
        "FileRenamePlan", back_populates="source_file", cascade="all, delete-orphan"
    )
    document: Mapped["Document | None"] = relationship(  # noqa: F821
        "Document", back_populates="source_file", uselist=False
    )

    def __repr__(self) -> str:
        return f"<SourceFile id={self.id} original={self.original_filename!r}>"
