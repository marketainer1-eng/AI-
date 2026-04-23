"""
app/models/document.py
======================
Document + DocumentAnchor

DDL mapping
-----------
documents
  PK         : id  SERIAL
  Unique     : uq_documents_source_file_id  (source_file_id)  ← 1-to-1 with SourceFile
  Indexes    : ix_documents_case_id
               ix_documents_parse_status
  FK out     : case_id      → cases.id        ON DELETE CASCADE
               source_file_id → source_files.id ON DELETE RESTRICT
                 (RESTRICT: cannot delete a SourceFile that has a Document)

document_anchors
  PK         : id  SERIAL
  Unique     : uq_anchors_doc_para_offset (document_id, paragraph_index, char_offset)
                 — prevents duplicate placeholder registrations at exact same position
  Indexes    : ix_document_anchors_document_id
               ix_document_anchors_status
  FK out     : document_id → documents.id  ON DELETE CASCADE

Status columns
--------------
Document.doc_type     → DocType enum     VARCHAR(50)
Document.parse_status → ParseStatus enum VARCHAR(50)
DocumentAnchor.status → AnchorStatus enum VARCHAR(50)
"""

from datetime import datetime
from sqlalchemy import (
    String, Integer, ForeignKey, DateTime, Index,
    Text, UniqueConstraint, func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base
from app.models.enums import DocType, ParseStatus, AnchorStatus


class Document(Base):
    """A DOCX document registered under a case.

    One SourceFile → one Document (enforced by unique constraint on source_file_id).
    Anchors are extracted by the DOCX parser and stored as DocumentAnchor rows.

    Lifecycle
    ---------
    1. Registered (parse_status = pending)
    2. Parsed → anchors created (parse_status = parsed)
    3. Anchors linked to Evidences via References (anchor.status = linked)
    4. Preview generated → DocumentProjection created
    5. ChangeSet committed → final state snapshotted
    """

    __tablename__ = "documents"

    # ── Primary key ──────────────────────────────────────────────────────────
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)

    # ── Foreign keys ─────────────────────────────────────────────────────────
    case_id: Mapped[int] = mapped_column(
        ForeignKey("cases.id", ondelete="CASCADE"),
        nullable=False,
    )
    # RESTRICT: you must delete the Document before deleting its backing file
    source_file_id: Mapped[int] = mapped_column(
        ForeignKey("source_files.id", ondelete="RESTRICT"),
        nullable=False,
        unique=True,   # materialises as uq_documents_source_file_id
        comment="One-to-one link; a SourceFile can back at most one Document",
    )

    # ── Core fields ──────────────────────────────────────────────────────────
    title: Mapped[str] = mapped_column(
        String(512),
        nullable=False,
        comment="Display title of the document (e.g. '준비서면 제1호')",
    )

    # DocType: main_brief | exhibit_list | other
    doc_type: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        default=DocType.MAIN_BRIEF.value,
        server_default=DocType.MAIN_BRIEF.value,
        comment="DocType: main_brief | exhibit_list | other",
    )

    # ParseStatus: pending | parsed | error
    parse_status: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        default=ParseStatus.PENDING.value,
        server_default=ParseStatus.PENDING.value,
        comment="ParseStatus: pending | parsed | error",
    )
    parse_error: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
        comment="Exception message captured when parse_status = error",
    )
    parsed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=False), nullable=True)

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
        Index("ix_documents_case_id", "case_id"),
        Index("ix_documents_parse_status", "parse_status"),
        # uq_documents_source_file_id is created by unique=True on the column
    )

    # ── Relationships ─────────────────────────────────────────────────────────
    case: Mapped["Case"] = relationship(  # noqa: F821
        "Case",
        back_populates="documents",
    )
    source_file: Mapped["SourceFile"] = relationship(  # noqa: F821
        "SourceFile",
        back_populates="document",
    )
    anchors: Mapped[list["DocumentAnchor"]] = relationship(
        "DocumentAnchor",
        back_populates="document",
        cascade="all, delete-orphan",
        passive_deletes=True,
        order_by="DocumentAnchor.paragraph_index, DocumentAnchor.char_offset",
    )
    projections: Mapped[list["DocumentProjection"]] = relationship(  # noqa: F821
        "DocumentProjection",
        back_populates="document",
        cascade="all, delete-orphan",
        passive_deletes=True,
        order_by="DocumentProjection.created_at.desc()",
    )

    # ── Helpers ───────────────────────────────────────────────────────────────
    @property
    def is_parsed(self) -> bool:
        return self.parse_status == ParseStatus.PARSED.value

    @property
    def unlinked_anchors(self) -> list["DocumentAnchor"]:
        return [a for a in self.anchors if a.status == AnchorStatus.UNLINKED.value]

    def __repr__(self) -> str:
        return (
            f"<Document id={self.id} title={self.title!r} "
            f"parse_status={self.parse_status}>"
        )


class DocumentAnchor(Base):
    """A placeholder found inside a Document's DOCX body.

    Example placeholders: ``{{갑 제1호증}}``, ``{{을 제2호증의1}}``

    Position
    --------
    ``paragraph_index`` (0-based) and ``char_offset`` together give the exact
    in-document position.  The composite unique constraint prevents the parser
    from registering the same placeholder twice at the same location.

    Linking
    -------
    An anchor starts as ``unlinked``; a Reference row connects it to an
    Evidence and transitions its status to ``linked``.

    Status
    ------
    AnchorStatus: unlinked | linked
    """

    __tablename__ = "document_anchors"

    # ── Primary key ──────────────────────────────────────────────────────────
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)

    # ── Foreign keys ─────────────────────────────────────────────────────────
    document_id: Mapped[int] = mapped_column(
        ForeignKey("documents.id", ondelete="CASCADE"),
        nullable=False,
    )

    # ── Core fields ──────────────────────────────────────────────────────────
    placeholder_text: Mapped[str] = mapped_column(
        String(512),
        nullable=False,
        comment="Raw placeholder string extracted from the DOCX (e.g. '갑 제1호증')",
    )
    paragraph_index: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True,
        comment="0-based paragraph index in the DOCX body",
    )
    char_offset: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True,
        comment="Character offset of the placeholder start within the paragraph",
    )
    context_snippet: Mapped[str | None] = mapped_column(
        String(1024),
        nullable=True,
        comment="Short surrounding text for display in the UI",
    )

    # AnchorStatus: unlinked | linked
    status: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        default=AnchorStatus.UNLINKED.value,
        server_default=AnchorStatus.UNLINKED.value,
        comment="AnchorStatus: unlinked | linked",
    )

    # ── Timestamps ───────────────────────────────────────────────────────────
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=False), server_default=func.now(), nullable=False
    )

    # ── Table-level constraints & indexes ────────────────────────────────────
    __table_args__ = (
        # Prevent duplicate anchor at the exact same position in a document
        UniqueConstraint(
            "document_id", "paragraph_index", "char_offset",
            name="uq_anchors_doc_para_offset",
        ),
        Index("ix_document_anchors_document_id", "document_id"),
        Index("ix_document_anchors_status", "status"),
    )

    # ── Relationships ─────────────────────────────────────────────────────────
    document: Mapped["Document"] = relationship("Document", back_populates="anchors")
    references: Mapped[list["Reference"]] = relationship(  # noqa: F821
        "Reference",
        back_populates="anchor",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )

    # ── Helpers ───────────────────────────────────────────────────────────────
    @property
    def is_linked(self) -> bool:
        return self.status == AnchorStatus.LINKED.value

    def __repr__(self) -> str:
        return (
            f"<DocumentAnchor id={self.id} "
            f"placeholder={self.placeholder_text!r} status={self.status}>"
        )
