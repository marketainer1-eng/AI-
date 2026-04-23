from datetime import datetime
from sqlalchemy import String, Integer, ForeignKey, DateTime, func, Text, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base


class AuditLog(Base):
    """
    Append-only audit log for all significant operations.
    Never update or delete entries.
    """

    __tablename__ = "audit_logs"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    case_id: Mapped[int | None] = mapped_column(
        ForeignKey("cases.id"), nullable=True, index=True
    )

    # Action performed: case_created | file_uploaded | document_parsed |
    #                   evidence_created | reference_linked | change_committed |
    #                   rollback_executed | export_generated | integrity_checked
    action: Mapped[str] = mapped_column(String(100), nullable=False)
    entity_type: Mapped[str | None] = mapped_column(String(100), nullable=True)
    entity_id: Mapped[int | None] = mapped_column(Integer, nullable=True)
    detail: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)

    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    # Relationships
    case: Mapped["Case | None"] = relationship("Case", back_populates="audit_logs")  # noqa: F821

    def __repr__(self) -> str:
        return f"<AuditLog id={self.id} action={self.action!r}>"
