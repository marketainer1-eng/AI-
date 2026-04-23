from datetime import datetime
from sqlalchemy import String, ForeignKey, DateTime, func, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base


class Reference(Base):
    """
    Links a DocumentAnchor to an Evidence.
    This is the canonical cross-reference between document body and evidence.
    """

    __tablename__ = "references"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    anchor_id: Mapped[int] = mapped_column(
        ForeignKey("document_anchors.id"), nullable=False, index=True
    )
    evidence_id: Mapped[int] = mapped_column(
        ForeignKey("evidences.id"), nullable=False, index=True
    )

    # Status: active | superseded (when rollback creates new version)
    status: Mapped[str] = mapped_column(String(50), nullable=False, default="active")
    note: Mapped[str | None] = mapped_column(Text, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    # Relationships
    anchor: Mapped["DocumentAnchor"] = relationship(  # noqa: F821
        "DocumentAnchor", back_populates="references"
    )
    evidence: Mapped["Evidence"] = relationship("Evidence", back_populates="references")

    def __repr__(self) -> str:
        return f"<Reference anchor={self.anchor_id} evidence={self.evidence_id}>"
