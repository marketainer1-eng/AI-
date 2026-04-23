"""
app/api/schemas/changeset.py
============================
Request/Response Pydantic models for ChangeSet operations.

ChangeSetStatus values : draft | previewed | committed | rolled_back
OpType values          : reorder_evidence | link_reference | unlink_reference
OpStatus values        : pending | applied | reverted

Workflow:
  1. POST /cases/{id}/changes/reorder          → ChangeSet (draft)
  2. POST /cases/{id}/changes/link-references  → ChangeSet (draft)
  3. POST /changes/{id}/preview                → ChangeSet (previewed)
  4. POST /changes/{id}/commit                 → CommitResponse (committed)
  5. POST /cases/{id}/rollback                 → RollbackResponse (new committed CS)
"""

from __future__ import annotations

from datetime import datetime
from pydantic import BaseModel, Field, field_validator


# ── Reorder ───────────────────────────────────────────────────────────────────

class ReorderEvidenceItem(BaseModel):
    """A single evidence → new_sort_order mapping."""

    evidence_id: int = Field(..., gt=0)
    new_sort_order: int = Field(..., ge=1, description="Target 1-based sort position")


class ReorderRequest(BaseModel):
    """POST /cases/{case_id}/changes/reorder — create a reorder ChangeSet."""

    items: list[ReorderEvidenceItem] = Field(
        ...,
        min_length=1,
        description=(
            "Desired sort_order assignment per evidence. "
            "All evidence IDs must belong to the same case. "
            "Duplicate sort_orders within one party are validated at commit time."
        ),
    )
    description: str | None = Field(
        None,
        max_length=500,
        description="Optional human-readable label for this change batch",
    )

    @field_validator("items")
    @classmethod
    def no_duplicates(cls, v: list[ReorderEvidenceItem]) -> list[ReorderEvidenceItem]:
        ids = [item.evidence_id for item in v]
        if len(ids) != len(set(ids)):
            raise ValueError("Duplicate evidence_id values within a single reorder request")
        orders = [item.new_sort_order for item in v]
        if len(orders) != len(set(orders)):
            raise ValueError("Duplicate new_sort_order values within a single reorder request")
        return v


# ── Link / Unlink References via ChangeSet ────────────────────────────────────

class LinkReferenceItem(BaseModel):
    """A single anchor → evidence link operation."""

    anchor_id: int = Field(..., gt=0)
    evidence_id: int = Field(..., gt=0)
    note: str | None = Field(None, max_length=1000)


class LinkReferencesRequest(BaseModel):
    """POST /cases/{case_id}/changes/link-references"""

    links: list[LinkReferenceItem] = Field(..., min_length=1)
    description: str | None = Field(None, max_length=500)


class UnlinkReferencesRequest(BaseModel):
    """POST /cases/{case_id}/changes/unlink-references"""

    reference_ids: list[int] = Field(
        ..., min_length=1, description="IDs of active References to deactivate"
    )
    description: str | None = Field(None, max_length=500)


# ── ChangeOperation response ──────────────────────────────────────────────────

class ChangeOperationResponse(BaseModel):
    """A single operation within a ChangeSet."""

    id: int
    op_type: str = Field(
        description="OpType: reorder_evidence | link_reference | unlink_reference"
    )
    sequence: int = Field(description="Execution order within the ChangeSet (ascending)")
    payload: dict = Field(description="Operation-specific data (evidence IDs, sort orders, …)")
    status: str = Field(description="OpStatus: pending | applied | reverted")
    created_at: datetime

    model_config = {"from_attributes": True}


# ── ChangeSet response ────────────────────────────────────────────────────────

class ChangeSetResponse(BaseModel):
    """Full ChangeSet representation."""

    id: int
    case_id: int
    status: str = Field(
        description="ChangeSetStatus: draft | previewed | committed | rolled_back"
    )
    description: str | None
    rolled_back_from_id: int | None = Field(
        None,
        description="ID of the ChangeSet this one reverts (only set for rollback ChangeSets)",
    )
    operation_count: int = Field(
        0, description="Number of operations recorded in this ChangeSet"
    )
    operations: list[ChangeOperationResponse] = []
    created_at: datetime
    committed_at: datetime | None

    model_config = {"from_attributes": True}

    @classmethod
    def from_orm_with_ops(cls, cs: object) -> "ChangeSetResponse":
        data = cls.model_validate(cs)
        data.operation_count = len(data.operations)
        return data


class ChangeSetListResponse(BaseModel):
    """Paginated list of ChangeSets for a case."""

    items: list[ChangeSetResponse]
    total: int
    skip: int = 0
    limit: int = 50


# ── Commit ────────────────────────────────────────────────────────────────────

class CommitRequest(BaseModel):
    """
    POST /changes/{change_set_id}/commit

    skip_integrity_check: bypass the pre-commit integrity check.
    Use only in automated test environments.
    """

    skip_integrity_check: bool = Field(
        False,
        description="If True, skip pre-commit integrity check (testing use only)",
    )


class CommitResponse(BaseModel):
    """Response after a successful ChangeSet commit."""

    change_set_id: int
    status: str = Field(description="Always 'committed'")
    committed_at: datetime
    version_label: str = Field(description="e.g. 'v1', 'v2'")
    version_number: int
    files_renamed: int
    operations_applied: int = 0
    message: str = ""


# ── Rollback ──────────────────────────────────────────────────────────────────

class RollbackRequest(BaseModel):
    """POST /cases/{case_id}/rollback"""

    target_change_set_id: int = Field(
        ...,
        gt=0,
        description=(
            "ID of the committed ChangeSet whose VersionSnapshot will be restored. "
            "A NEW rollback ChangeSet is created; the target is not modified."
        ),
    )
    description: str | None = Field(
        None,
        max_length=500,
        description="Optional description for the newly created rollback ChangeSet",
    )


class RollbackResponse(BaseModel):
    """Response after a successful rollback."""

    new_change_set_id: int = Field(description="ID of the newly created rollback ChangeSet")
    rolled_back_from_id: int = Field(description="ID of the target ChangeSet that was reversed")
    version_label: str = Field(description="Version label of the restored VersionSnapshot")
    status: str = Field(description="Always 'committed'")
    message: str
