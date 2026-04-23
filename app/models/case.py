from datetime import datetime
from sqlalchemy import String, Text, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base


class Case(Base):
    __tablename__ = "cases"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    court: Mapped[str | None] = mapped_column(String(255), nullable=True)
    case_number: Mapped[str | None] = mapped_column(String(100), nullable=True)
    status: Mapped[str] = mapped_column(String(50), nullable=False, default="active")
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), onupdate=func.now()
    )

    # Relationships
    source_files: Mapped[list["SourceFile"]] = relationship(  # noqa: F821
        "SourceFile", back_populates="case", cascade="all, delete-orphan"
    )
    documents: Mapped[list["Document"]] = relationship(  # noqa: F821
        "Document", back_populates="case", cascade="all, delete-orphan"
    )
    evidences: Mapped[list["Evidence"]] = relationship(  # noqa: F821
        "Evidence", back_populates="case", cascade="all, delete-orphan"
    )
    change_sets: Mapped[list["ChangeSet"]] = relationship(  # noqa: F821
        "ChangeSet", back_populates="case", cascade="all, delete-orphan"
    )
    integrity_reports: Mapped[list["IntegrityReport"]] = relationship(  # noqa: F821
        "IntegrityReport", back_populates="case", cascade="all, delete-orphan"
    )
    audit_logs: Mapped[list["AuditLog"]] = relationship(  # noqa: F821
        "AuditLog", back_populates="case", cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<Case id={self.id} name={self.name!r}>"
