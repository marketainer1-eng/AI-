"""
app/models/__init__.py
======================
Re-exports every ORM model class and every Enum used for status / type columns.

Import patterns
---------------
    from app.models import Case, Evidence, EvidenceParty
    from app.models.enums import CaseStatus
    from app.models import *   # all models + enums available
"""

# ── Enum classes ─────────────────────────────────────────────────────────────
from app.models.enums import (
    CaseStatus,
    FileRole,
    DocType,
    ParseStatus,
    AnchorStatus,
    EvidenceParty,
    ReferenceStatus,
    ChangeSetStatus,
    OpType,
    OpStatus,
    FileRenamePlanStatus,
    IntegrityResult,
    AuditAction,
)

# ── ORM model classes ─────────────────────────────────────────────────────────
from app.models.case import Case
from app.models.source_file import SourceFile
from app.models.document import Document, DocumentAnchor
from app.models.evidence import Evidence, EvidenceFileLink
from app.models.reference import Reference
from app.models.changeset import ChangeSet, ChangeOperation
from app.models.projection import DocumentProjection, EvidenceListProjection, FileRenamePlan
from app.models.snapshot import VersionSnapshot
from app.models.integrity import IntegrityReport
from app.models.audit import AuditLog

__all__ = [
    # ── Enums ──────────────────────────────────────────────────────────────
    "CaseStatus",
    "FileRole",
    "DocType",
    "ParseStatus",
    "AnchorStatus",
    "EvidenceParty",
    "ReferenceStatus",
    "ChangeSetStatus",
    "OpType",
    "OpStatus",
    "FileRenamePlanStatus",
    "IntegrityResult",
    "AuditAction",
    # ── Models ─────────────────────────────────────────────────────────────
    "Case",
    "SourceFile",
    "Document",
    "DocumentAnchor",
    "Evidence",
    "EvidenceFileLink",
    "Reference",
    "ChangeSet",
    "ChangeOperation",
    "DocumentProjection",
    "EvidenceListProjection",
    "FileRenamePlan",
    "VersionSnapshot",
    "IntegrityReport",
    "AuditLog",
]
