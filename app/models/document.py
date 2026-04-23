from datetime import datetime
from sqlalchemy import String, Integer, ForeignKey, DateTime, func, Text, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base


class Document(Base):
    """A DOCX document registered under a case, containing anchors/placeholders."""

    __tablename__ = "documents"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    case_id: Mapped[int] = mapped_column(ForeignKey("cases.id"), nullable=False, index=True)
    source_file_id: Mapped[int] = mapped_column(
        ForeignKey("source_files.id"), nullable=False, unique=True
    )

    title: Mapped[str] = mapped_column(String(512), nullable=False)
    # document type: main_brief | exhibit_list | other
    doc_type: Mapped[str] = mapped_column(String(50), nullable=False, default="main_brief")
    # parse status: pending | parsed | error
    parse_status: Mapped[str] = mapped_column(String(50), nullable=False, default="pending")
    parse_error: Mapped[str | None] = mapped_column(Text, nullable=True)
    parsed_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), onupdate=func.now()
    )

    # Relationships
    case: Mapped["Case"] = relationship("Case", back_populates="documents")  # noqa: F821
    source_file: Mapped["SourceFile"] = relationship(  # noqa: F821
        "SourceFile", back_populates="document"
    )
    anchors: Mapped[list["DocumentAnchor"]] = relationship(
        "DocumentAnchor", back_populates="document", cascade="all, delete-orphan"
    )
    projections: Mapped[list["DocumentProjection"]] = relationship(  # noqa: F821
        "DocumentProjection", back_populates="document", cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<Document id={self.id} title={self.title!r}>"


class DocumentAnchor(Base):
    """
    A placeholder/anchor found in a Document.
    e.g., {{갑 제1호증}}, {{을 제2호증}}, etc.
    Canonical data — links a document position to an Evidence.
    """

    __tablename__ = "document_anchors"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    document_id: Mapped[int] = mapped_column(
        ForeignKey("documents.id"), nullable=False, index=True
    )

    # Raw placeholder text found in docx
    placeholder_text: Mapped[str] = mapped_column(String(512), nullable=False)
    # Paragraph index (0-based) in the docx
    paragraph_index: Mapped[int | None] = mapped_column(Integer, nullable=True)
    # Character offset within the paragraph
    char_offset: Mapped[int | None] = mapped_column(Integer, nullable=True)
    # Context snippet (surrounding text)
    context_snippet: Mapped[str | None] = mapped_column(String(1024), nullable=True)

    # Status: unlinked | linked
    status: Mapped[str] = mapped_column(String(50), nullable=False, default="unlinked")

    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    # Relationships
    document: Mapped["Document"] = relationship("Document", back_populates="anchors")
    references: Mapped[list["Reference"]] = relationship(  # noqa: F821
        "Reference", back_populates="anchor", cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<DocumentAnchor id={self.id} placeholder={self.placeholder_text!r}>"
