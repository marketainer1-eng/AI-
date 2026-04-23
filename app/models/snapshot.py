from datetime import datetime
from sqlalchemy import String, Integer, ForeignKey, DateTime, func, Text, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base


class VersionSnapshot(Base):
    """
    Immutable snapshot of the case state at the time of a commit.
    Used for rollback: instead of overwriting, we create a new ChangeSet
    that reverses the committed one and restore from snapshot.
    """

    __tablename__ = "version_snapshots"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    change_set_id: Mapped[int] = mapped_column(
        ForeignKey("change_sets.id"), nullable=False, unique=True
    )

    # Snapshot version label (e.g., "v1", "v2")
    version_label: Mapped[str] = mapped_column(String(50), nullable=False)
    # Full JSON snapshot of Evidence sort_orders and Reference states at commit time
    evidence_snapshot: Mapped[list] = mapped_column(JSON, nullable=False, default=list)
    reference_snapshot: Mapped[list] = mapped_column(JSON, nullable=False, default=list)
    file_link_snapshot: Mapped[list] = mapped_column(JSON, nullable=False, default=list)

    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    # Relationships
    change_set: Mapped["ChangeSet"] = relationship(  # noqa: F821
        "ChangeSet", back_populates="version_snapshot"
    )

    def __repr__(self) -> str:
        return f"<VersionSnapshot id={self.id} version={self.version_label!r}>"
