"""
app/api/schemas/audit.py
========================
Request/Response Pydantic models for AuditLog.

AuditLogs are immutable append-only records created by every mutating service call.

AuditAction values (representative):
  case_created, case_updated,
  file_uploaded,
  document_registered, document_parsed,
  evidence_created, evidence_updated,
  reference_linked, reference_unlinked,
  integrity_checked,
  change_committed, change_rolled_back,
  export_generated
"""

from __future__ import annotations

from datetime import datetime
from pydantic import BaseModel, Field


class AuditLogResponse(BaseModel):
    """A single audit-log entry."""

    id: int
    case_id: int | None = Field(None, description="Case this action belongs to (None for global)")
    action: str = Field(description="AuditAction enum value")
    entity_type: str | None = Field(None, description="ORM model class name")
    entity_id: int | None = Field(None, description="PK of the affected entity")
    detail: dict = Field({}, description="Arbitrary JSON payload with action-specific fields")
    created_at: datetime

    model_config = {"from_attributes": True}


class AuditLogListResponse(BaseModel):
    """Paginated list of audit-log entries."""

    items: list[AuditLogResponse]
    total: int
    skip: int = 0
    limit: int = 50
