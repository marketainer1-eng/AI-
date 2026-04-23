"""
app/models/enums.py
===================
Canonical Python Enum definitions for every status / type string column
in the database.

Design rules
------------
* Every DB column that stores a fixed-vocabulary string MUST use one of these enums.
* SQLAlchemy columns use ``String(N)`` + ``default=EnumClass.VALUE.value`` (not
  sa.Enum) so the PostgreSQL column stays a plain VARCHAR — makes migrations,
  debugging, and raw SQL queries simpler.
* Each enum value is the exact string that is stored in the database row.
* Enum members are documented inline with comments explaining valid transitions.
"""

from enum import Enum


# ---------------------------------------------------------------------------
# Case
# ---------------------------------------------------------------------------

class CaseStatus(str, Enum):
    """Lifecycle of a litigation case.

    Transitions
    -----------
    active  → closed  (case finalised or archived)
    closed  → active  (reopened)
    """
    ACTIVE  = "active"   # default; work in progress
    CLOSED  = "closed"   # archived / finalised


# ---------------------------------------------------------------------------
# SourceFile
# ---------------------------------------------------------------------------

class FileRole(str, Enum):
    """How the uploaded file is used within a case.

    Transitions
    -----------
    unknown → evidence_attachment  (when linked to an Evidence)
    unknown → document             (when registered as a Document)
    """
    UNKNOWN             = "unknown"             # default; not yet categorised
    EVIDENCE_ATTACHMENT = "evidence_attachment" # backing file for an Evidence
    DOCUMENT            = "document"            # DOCX brief/pleading registered as Document


# ---------------------------------------------------------------------------
# Document
# ---------------------------------------------------------------------------

class DocType(str, Enum):
    """Structural role of a registered document.

    Values are stable identifiers; do not change existing member values.
    """
    MAIN_BRIEF    = "main_brief"    # 본안 준비서면 / 소장
    EXHIBIT_LIST  = "exhibit_list"  # 증거목록
    OTHER         = "other"         # 기타


class ParseStatus(str, Enum):
    """DOCX parse pipeline status.

    Transitions
    -----------
    pending → parsed  (successful parse)
    pending → error   (parse failure)
    error   → pending (user retries parse)
    """
    PENDING = "pending"  # default; parse not yet attempted
    PARSED  = "parsed"   # placeholders successfully extracted
    ERROR   = "error"    # parse raised an exception; see parse_error column


# ---------------------------------------------------------------------------
# DocumentAnchor
# ---------------------------------------------------------------------------

class AnchorStatus(str, Enum):
    """Link state of a placeholder found inside a Document.

    Transitions
    -----------
    unlinked → linked     (Reference row created for this anchor)
    linked   → unlinked   (Reference row deleted / superseded)
    """
    UNLINKED = "unlinked"  # default; placeholder found but not linked to Evidence
    LINKED   = "linked"    # at least one active Reference points to this anchor


# ---------------------------------------------------------------------------
# Evidence
# ---------------------------------------------------------------------------

class EvidenceParty(str, Enum):
    """Litigation party that submitted the evidence.

    Korean civil procedure uses 갑(plaintiff) / 을(defendant) exhibit numbers.
    """
    PLAINTIFF = "plaintiff"  # 갑호증
    DEFENDANT = "defendant"  # 을호증


# ---------------------------------------------------------------------------
# Reference
# ---------------------------------------------------------------------------

class ReferenceStatus(str, Enum):
    """Status of the anchor ↔ evidence link.

    Transitions
    -----------
    active     → superseded  (rollback creates a new Reference; old becomes superseded)
    superseded → active      (not normally used; provided for edge-case reversions)
    """
    ACTIVE     = "active"      # default; current live link
    SUPERSEDED = "superseded"  # replaced by a newer Reference after rollback


# ---------------------------------------------------------------------------
# ChangeSet
# ---------------------------------------------------------------------------

class ChangeSetStatus(str, Enum):
    """State machine for a batch of proposed changes.

    Transitions
    -----------
    draft      → previewed    (render-preview called)
    previewed  → committed    (commit called; VersionSnapshot created)
    committed  → rolled_back  (rollback creates a *new* ChangeSet that reverses this one)
    draft      → committed    (shortcut: commit without explicit preview)
    """
    DRAFT       = "draft"        # default; operations being added
    PREVIEWED   = "previewed"    # preview generated; ready to commit
    COMMITTED   = "committed"    # all operations applied; snapshot saved
    ROLLED_BACK = "rolled_back"  # superseded by a rollback ChangeSet


# ---------------------------------------------------------------------------
# ChangeOperation
# ---------------------------------------------------------------------------

class OpType(str, Enum):
    """Atomic operation types that can appear inside a ChangeSet.

    Each type has a corresponding payload schema (stored as JSON).
    """
    REORDER_EVIDENCE   = "reorder_evidence"    # change sort_order of evidences
    RELABEL_EVIDENCE   = "relabel_evidence"    # update label / description
    ACTIVATE_EVIDENCE  = "activate_evidence"   # set is_active = true
    DEACTIVATE_EVIDENCE= "deactivate_evidence" # set is_active = false (soft-delete)
    LINK_REFERENCE     = "link_reference"      # create Reference row
    UNLINK_REFERENCE   = "unlink_reference"    # mark Reference as superseded
    RENAME_FILE        = "rename_file"         # add FileRenamePlan entry


class OpStatus(str, Enum):
    """Execution state of a single ChangeOperation.

    Transitions
    -----------
    pending → applied   (commit succeeds)
    pending → reverted  (rollback ChangeSet undoes this op)
    """
    PENDING  = "pending"   # default; awaiting commit
    APPLIED  = "applied"   # committed successfully
    REVERTED = "reverted"  # reversed by a rollback


# ---------------------------------------------------------------------------
# FileRenamePlan
# ---------------------------------------------------------------------------

class FileRenamePlanStatus(str, Enum):
    """Life of a planned physical-file rename.

    Transitions
    -----------
    planned   → committed  (commit physically renames the file on disk)
    planned   → reverted   (change_set rolled back before commit)
    committed → reverted   (post-commit rollback; file renamed back)
    """
    PLANNED   = "planned"    # default; rename queued, NOT yet on disk
    COMMITTED = "committed"  # file physically renamed on disk
    REVERTED  = "reverted"   # plan cancelled or undone


# ---------------------------------------------------------------------------
# IntegrityReport
# ---------------------------------------------------------------------------

class IntegrityResult(str, Enum):
    """Aggregate outcome of an integrity check run.

    ``pass`` means zero violations (warnings may still exist).
    ``fail`` means one or more violations found.
    """
    PASS = "pass"
    FAIL = "fail"


# ---------------------------------------------------------------------------
# AuditLog
# ---------------------------------------------------------------------------

class AuditAction(str, Enum):
    """Vocabulary of auditable actions written to audit_logs."""
    CASE_CREATED        = "case_created"
    CASE_UPDATED        = "case_updated"
    CASE_CLOSED         = "case_closed"
    FILE_UPLOADED       = "file_uploaded"
    DOCUMENT_REGISTERED = "document_registered"
    DOCUMENT_PARSED     = "document_parsed"
    EVIDENCE_CREATED    = "evidence_created"
    EVIDENCE_UPDATED    = "evidence_updated"
    EVIDENCE_DEACTIVATED= "evidence_deactivated"
    REFERENCE_LINKED    = "reference_linked"
    REFERENCE_UNLINKED  = "reference_unlinked"
    CHANGE_SET_CREATED  = "change_set_created"
    CHANGE_PREVIEWED    = "change_previewed"
    CHANGE_COMMITTED    = "change_committed"
    ROLLBACK_EXECUTED   = "rollback_executed"
    EXPORT_GENERATED    = "export_generated"
    INTEGRITY_CHECKED   = "integrity_checked"
