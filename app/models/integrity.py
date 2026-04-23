from datetime import datetime
from sqlalchemy import String, Integer, ForeignKey, DateTime, func, Text, JSON, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base


class IntegrityReport(Base):
    """
    Result of an integrity check run on a case.
    Records all violations found at check time.
    """

    __tablename__ = "integrity_reports"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    case_id: Mapped[int] = mapped_column(ForeignKey("cases.id"), nullable=False, index=True)

    # Overall result: pass | fail
    result: Mapped[str] = mapped_column(String(20), nullable=False)
    is_passed: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)

    # List of violation records:
    # [{"type": "UNLINKED_ANCHOR", "anchor_id": 1, "placeholder": "...", "message": "..."}]
    violations: Mapped[list] = mapped_column(JSON, nullable=False, default=list)
    violation_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    # Warnings (non-blocking issues)
    warnings: Mapped[list] = mapped_column(JSON, nullable=False, default=list)
    warning_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    checked_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    # Relationships
    case: Mapped["Case"] = relationship("Case", back_populates="integrity_reports")  # noqa: F821

    def __repr__(self) -> str:
        return f"<IntegrityReport id={self.id} result={self.result} violations={self.violation_count}>"
