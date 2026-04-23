"""
app/models/changeset.py
=======================
ChangeSet + ChangeOperation

DDL mapping
-----------
change_sets
  PK         : id  SERIAL
  Indexes    : ix_change_sets_case_id
               ix_change_sets_status
  FK out     : case_id            → cases.id       ON DELETE CASCADE
               rolled_back_from_id → change_sets.id ON DELETE SET NULL
                 (self-referential; rollback pointer optional)

change_operations
  PK         : id  SERIAL
  Indexes    : ix_change_operations_change_set_id
               ix_change_operations_sequence  (for ordered replay)
  FK out     : change_set_id → change_sets.id  ON DELETE CASCADE

Status columns
--------------
ChangeSet.status   → ChangeSetStatus enum  VARCHAR(50)
ChangeOperation.op_type → OpType enum     VARCHAR(100)
ChangeOperation.status  → OpStatus enum   VARCHAR(50)

Design principles
-----------------
* A ChangeSet is a unit-of-work: all operations apply atomically at commit.
* Before commit, operations are merely *planned*; the live DB state is unchanged.
* Rollback creates a NEW ChangeSet (status = draft) whose operations reverse
  the target committed ChangeSet.  The original is NEVER modified.
* rolled_back_from_id points from the rollback ChangeSet to the original.
"""

from datetime import datetime
from sqlalchemy import (
    String, Integer, ForeignKey, DateTime, Index, Text, JSON, func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base
from app.models.enums import ChangeSetStatus, OpType, OpStatus


class ChangeSet(Base):
    """A batch of proposed changes that applies atomically at commit time.

    State machine
    -------------
    draft → previewed → committed
    committed → rolled_back  (set on the *original* when a rollback ChangeSet commits)

    Rollback semantics
    ------------------
    Rollback does NOT overwrite the committed ChangeSet.
    Instead:
    1. A new ChangeSet (status=draft) is created with rolled_back_from_id = original.id.
    2. Reverse operations are added to the new ChangeSet.
    3. The new ChangeSet is previewed and committed.
    4. The original ChangeSet status is updated to rolled_back.
    5. A new VersionSnapshot is created for the rollback ChangeSet.
    """

    __tablename__ = "change_sets"

    # ── Primary key ──────────────────────────────────────────────────────────
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)

    # ── Foreign keys ─────────────────────────────────────────────────────────
    case_id: Mapped[int] = mapped_column(
        ForeignKey("cases.id", ondelete="CASCADE"),
        nullable=False,
    )
    # Self-referential: rollback ChangeSet → original ChangeSet
    rolled_back_from_id: Mapped[int | None] = mapped_column(
        ForeignKey("change_sets.id", ondelete="SET NULL"),
        nullable=True,
        comment="If this ChangeSet is a rollback, points to the original committed ChangeSet",
    )

    # ── Status ───────────────────────────────────────────────────────────────
    # ChangeSetStatus: draft | previewed | committed | rolled_back
    status: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        default=ChangeSetStatus.DRAFT.value,
        server_default=ChangeSetStatus.DRAFT.value,
        comment="ChangeSetStatus: draft | previewed | committed | rolled_back",
    )
    description: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
        comment="Human-readable summary of the change batch",
    )

    # ── Timestamps ───────────────────────────────────────────────────────────
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=False), server_default=func.now(), nullable=False
    )
    committed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=False),
        nullable=True,
        comment="Set when status transitions to committed",
    )

    # ── Table-level constraints & indexes ────────────────────────────────────
    __table_args__ = (
        Index("ix_change_sets_case_id", "case_id"),
        Index("ix_change_sets_status", "status"),
    )

    # ── Relationships ─────────────────────────────────────────────────────────
    case: Mapped["Case"] = relationship(  # noqa: F821
        "Case",
        back_populates="change_sets",
    )
    operations: Mapped[list["ChangeOperation"]] = relationship(
        "ChangeOperation",
        back_populates="change_set",
        cascade="all, delete-orphan",
        passive_deletes=True,
        order_by="ChangeOperation.sequence",
    )
    document_projections: Mapped[list["DocumentProjection"]] = relationship(  # noqa: F821
        "DocumentProjection",
        back_populates="change_set",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )
    evidence_list_projections: Mapped[list["EvidenceListProjection"]] = relationship(  # noqa: F821
        "EvidenceListProjection",
        back_populates="change_set",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )
    file_rename_plans: Mapped[list["FileRenamePlan"]] = relationship(  # noqa: F821
        "FileRenamePlan",
        back_populates="change_set",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )
    # One-to-one: each committed ChangeSet gets exactly one VersionSnapshot
    version_snapshot: Mapped["VersionSnapshot | None"] = relationship(  # noqa: F821
        "VersionSnapshot",
        back_populates="change_set",
        uselist=False,
        cascade="all, delete-orphan",
        passive_deletes=True,
    )
    # Self-referential back-reference (rollback ChangeSet → original)
    rolled_back_from: Mapped["ChangeSet | None"] = relationship(
        "ChangeSet",
        remote_side="ChangeSet.id",
        foreign_keys=[rolled_back_from_id],
    )

    # ── Helpers ───────────────────────────────────────────────────────────────
    @property
    def is_committed(self) -> bool:
        return self.status == ChangeSetStatus.COMMITTED.value

    @property
    def is_editable(self) -> bool:
        """Only draft and previewed change sets can be modified."""
        return self.status in (ChangeSetStatus.DRAFT.value, ChangeSetStatus.PREVIEWED.value)

    def __repr__(self) -> str:
        return f"<ChangeSet id={self.id} case={self.case_id} status={self.status}>"


class ChangeOperation(Base):
    """A single atomic operation within a ChangeSet.

    Operations are executed in ascending ``sequence`` order at commit time.

    Op types (OpType enum)
    ----------------------
    reorder_evidence    payload: {"evidence_ids": [3, 1, 2]}
    relabel_evidence    payload: {"evidence_id": 1, "label": "계약서 사본 (수정)"}
    activate_evidence   payload: {"evidence_id": 1}
    deactivate_evidence payload: {"evidence_id": 1}
    link_reference      payload: {"anchor_id": 5, "evidence_id": 2}
    unlink_reference    payload: {"reference_id": 7}
    rename_file         payload: {"source_file_id": 3, "planned_filename": "갑 제1호증 계약서.docx"}
    """

    __tablename__ = "change_operations"

    # ── Primary key ──────────────────────────────────────────────────────────
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)

    # ── Foreign keys ─────────────────────────────────────────────────────────
    change_set_id: Mapped[int] = mapped_column(
        ForeignKey("change_sets.id", ondelete="CASCADE"),
        nullable=False,
    )

    # ── Operation definition ──────────────────────────────────────────────────
    # OpType: reorder_evidence | relabel_evidence | ... (see enum)
    op_type: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
        comment="OpType: one of the OpType enum values",
    )
    # Execution sequence within the ChangeSet (lower = earlier)
    sequence: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=0,
        server_default="0",
        comment="Execution order within the ChangeSet; lower values run first",
    )
    # Op-specific data (schema described in docstring above)
    payload: Mapped[dict] = mapped_column(
        JSON,
        nullable=False,
        default=dict,
        comment="JSON payload; structure depends on op_type",
    )

    # ── Status ───────────────────────────────────────────────────────────────
    # OpStatus: pending | applied | reverted
    status: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        default=OpStatus.PENDING.value,
        server_default=OpStatus.PENDING.value,
        comment="OpStatus: pending | applied | reverted",
    )

    # ── Timestamps ───────────────────────────────────────────────────────────
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=False), server_default=func.now(), nullable=False
    )

    # ── Table-level constraints & indexes ────────────────────────────────────
    __table_args__ = (
        Index("ix_change_operations_change_set_id", "change_set_id"),
        # Ordered replay of ops within a change set
        Index("ix_change_operations_sequence", "change_set_id", "sequence"),
    )

    # ── Relationships ─────────────────────────────────────────────────────────
    change_set: Mapped["ChangeSet"] = relationship(
        "ChangeSet",
        back_populates="operations",
    )

    def __repr__(self) -> str:
        return (
            f"<ChangeOperation id={self.id} "
            f"op_type={self.op_type} seq={self.sequence} status={self.status}>"
        )
