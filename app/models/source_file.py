"""
app/models/source_file.py
=========================
SourceFile — canonical representation of an uploaded physical file.

DDL mapping
-----------
Table      : source_files
PK         : id  SERIAL
Unique     : uq_source_files_stored_filename  (stored_filename)
Indexes    : ix_source_files_case_id  (case_id)
             ix_source_files_file_hash (file_hash)  -- for deduplication lookups
FK out     : case_id → cases.id  ON DELETE CASCADE
FK in (1:N): evidence_file_links, file_rename_plans
FK in (1:1): documents.source_file_id (unique)

Role column
-----------
Uses FileRole enum values stored as VARCHAR(50).
Default: "unknown"  →  possible values:
  "unknown" | "evidence_attachment" | "document"
"""

from datetime import datetime
from sqlalchemy import String, Integer, ForeignKey, DateTime, Index, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base
from app.models.enums import FileRole


class SourceFile(Base):
    """Canonical representation of an uploaded physical file.

    A SourceFile is the single point of truth for what is stored on disk.
    It is *never* renamed in-place; a FileRenamePlan records the intent and
    the physical rename only happens at ChangeSet commit time.

    Deduplication
    -------------
    ``file_hash`` (SHA-256) can be used to detect duplicate uploads.
    ``stored_filename`` is always UUID-based and globally unique.

    Relationships
    -------------
    * Many-to-one → Case
    * One-to-one  → Document (a file may be registered as a DOCX document)
    * One-to-many → EvidenceFileLink (file may back several evidences)
    * One-to-many → FileRenamePlan
    """

    __tablename__ = "source_files"

    # ── Primary key ──────────────────────────────────────────────────────────
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)

    # ── Foreign keys ─────────────────────────────────────────────────────────
    case_id: Mapped[int] = mapped_column(
        ForeignKey("cases.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    # ── Filename fields ───────────────────────────────────────────────────────
    original_filename: Mapped[str] = mapped_column(
        String(512),
        nullable=False,
        comment="Filename as provided by the uploader; may be renamed on disk later",
    )
    stored_filename: Mapped[str] = mapped_column(
        String(512),
        nullable=False,
        unique=True,
        comment="UUID-based immutable internal filename; never changes after upload",
    )
    storage_path: Mapped[str] = mapped_column(
        String(1024),
        nullable=False,
        comment="Absolute or UPLOAD_DIR-relative path to the file on disk",
    )

    # ── File metadata ─────────────────────────────────────────────────────────
    file_size_bytes: Mapped[int | None] = mapped_column(Integer, nullable=True)
    mime_type: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
        comment="MIME type detected at upload (e.g. 'application/vnd.openxmlformats-officedocument')",
    )
    file_hash: Mapped[str | None] = mapped_column(
        String(64),
        nullable=True,
        comment="SHA-256 hex digest; used for deduplication checks",
    )

    # ── Role ─────────────────────────────────────────────────────────────────
    # Stored as VARCHAR(50); controlled by FileRole enum.
    role: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        default=FileRole.UNKNOWN.value,
        server_default=FileRole.UNKNOWN.value,
        comment="FileRole: unknown | evidence_attachment | document",
    )

    # ── Timestamps ───────────────────────────────────────────────────────────
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=False), server_default=func.now(), nullable=False
    )

    # ── Table-level constraints & indexes ────────────────────────────────────
    __table_args__ = (
        # Deduplication look-up: find existing file by hash
        Index("ix_source_files_file_hash", "file_hash"),
        # Note: uq_source_files_stored_filename is declared via unique=True above
        # and materialises as a named constraint in Alembic (see migration).
    )

    # ── Relationships ─────────────────────────────────────────────────────────
    case: Mapped["Case"] = relationship(  # noqa: F821
        "Case",
        back_populates="source_files",
    )

    # One-to-one: a SourceFile may be registered as a single Document
    document: Mapped["Document | None"] = relationship(  # noqa: F821
        "Document",
        back_populates="source_file",
        uselist=False,
    )

    # One-to-many: may back multiple evidences (e.g. multi-page scan split into parts)
    evidence_file_links: Mapped[list["EvidenceFileLink"]] = relationship(  # noqa: F821
        "EvidenceFileLink",
        back_populates="source_file",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )

    # One-to-many: planned renames queued before commit
    file_rename_plans: Mapped[list["FileRenamePlan"]] = relationship(  # noqa: F821
        "FileRenamePlan",
        back_populates="source_file",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )

    # ── Helpers ───────────────────────────────────────────────────────────────
    @property
    def is_document(self) -> bool:
        return self.role == FileRole.DOCUMENT.value

    @property
    def is_evidence_attachment(self) -> bool:
        return self.role == FileRole.EVIDENCE_ATTACHMENT.value

    def __repr__(self) -> str:
        return (
            f"<SourceFile id={self.id} role={self.role!r} "
            f"original={self.original_filename!r}>"
        )
