"""
app/core/exceptions.py
======================
All domain exception types for the DocRef system.

Hierarchy
---------
DocRefError
├── NotFoundError (base for all 404-type errors)
│   ├── CaseNotFoundError
│   ├── DocumentNotFoundError
│   ├── AnchorNotFoundError
│   ├── EvidenceNotFoundError
│   ├── SourceFileNotFoundError
│   ├── ReferenceNotFoundError
│   └── ChangeSetNotFoundError
├── ConflictError (base for 409-type errors)
│   ├── IntegrityViolationError
│   ├── DuplicateFileError
│   └── AlreadyCommittedError
├── ValidationError (base for 422-type errors)
│   ├── ParseError
│   ├── InvalidFileTypeError
│   └── InvalidStateTransitionError
└── InfrastructureError (base for 500-type errors)
    ├── StorageError
    ├── CommitError
    └── RollbackError
"""

from __future__ import annotations


# ── Base ─────────────────────────────────────────────────────────────────────

class DocRefError(Exception):
    """Root exception for the DocRef system."""
    http_status: int = 500


# ── Not Found (404) ───────────────────────────────────────────────────────────

class NotFoundError(DocRefError):
    """Base class for entity-not-found errors."""
    http_status = 404


class CaseNotFoundError(NotFoundError):
    def __init__(self, case_id: int) -> None:
        super().__init__(f"Case {case_id} not found")
        self.case_id = case_id


class DocumentNotFoundError(NotFoundError):
    def __init__(self, document_id: int) -> None:
        super().__init__(f"Document {document_id} not found")
        self.document_id = document_id


class AnchorNotFoundError(NotFoundError):
    def __init__(self, anchor_id: int) -> None:
        super().__init__(f"DocumentAnchor {anchor_id} not found")
        self.anchor_id = anchor_id


class EvidenceNotFoundError(NotFoundError):
    def __init__(self, evidence_id: int) -> None:
        super().__init__(f"Evidence {evidence_id} not found")
        self.evidence_id = evidence_id


class SourceFileNotFoundError(NotFoundError):
    def __init__(self, file_id: int) -> None:
        super().__init__(f"SourceFile {file_id} not found")
        self.file_id = file_id


class ReferenceNotFoundError(NotFoundError):
    def __init__(self, reference_id: int) -> None:
        super().__init__(f"Reference {reference_id} not found")
        self.reference_id = reference_id


class ChangeSetNotFoundError(NotFoundError):
    def __init__(self, change_set_id: int) -> None:
        super().__init__(f"ChangeSet {change_set_id} not found")
        self.change_set_id = change_set_id


class VersionSnapshotNotFoundError(NotFoundError):
    def __init__(self, change_set_id: int) -> None:
        super().__init__(f"VersionSnapshot for ChangeSet {change_set_id} not found")
        self.change_set_id = change_set_id


# ── Conflict (409) ────────────────────────────────────────────────────────────

class ConflictError(DocRefError):
    """Base class for conflict/409 errors."""
    http_status = 409


class IntegrityViolationError(ConflictError):
    def __init__(self, message: str, errors: list[str] | None = None) -> None:
        super().__init__(message)
        self.errors: list[str] = errors or []


class DuplicateFileError(ConflictError):
    """Raised when a file with the same hash already exists in the case."""
    def __init__(self, file_hash: str, existing_file_id: int) -> None:
        super().__init__(
            f"A file with hash {file_hash!r} already exists (SourceFile id={existing_file_id})"
        )
        self.file_hash = file_hash
        self.existing_file_id = existing_file_id


class AlreadyCommittedError(ConflictError):
    def __init__(self, change_set_id: int) -> None:
        super().__init__(f"ChangeSet {change_set_id} is already committed")
        self.change_set_id = change_set_id


class DuplicateReferenceError(ConflictError):
    def __init__(self, anchor_id: int, evidence_id: int) -> None:
        super().__init__(
            f"Reference between anchor {anchor_id} and evidence {evidence_id} already exists"
        )
        self.anchor_id = anchor_id
        self.evidence_id = evidence_id


# ── Validation (422) ──────────────────────────────────────────────────────────

class ValidationError(DocRefError):
    """Base class for 422-type domain validation errors."""
    http_status = 422


class ParseError(ValidationError):
    """DOCX parsing failure."""


class InvalidFileTypeError(ValidationError):
    def __init__(self, filename: str, expected: str = ".docx") -> None:
        super().__init__(f"File '{filename}' is not a valid {expected} file")
        self.filename = filename
        self.expected = expected


class InvalidStateTransitionError(ValidationError):
    def __init__(self, entity: str, current: str, target: str) -> None:
        super().__init__(
            f"Cannot transition {entity} from '{current}' to '{target}'"
        )
        self.entity = entity
        self.current_state = current
        self.target_state = target


class SortOrderConflictError(ValidationError):
    def __init__(self, case_id: int, party: str, sort_order: int) -> None:
        super().__init__(
            f"sort_order={sort_order} already taken for party='{party}' in case {case_id}"
        )
        self.case_id = case_id
        self.party = party
        self.sort_order = sort_order


# ── Infrastructure (500) ──────────────────────────────────────────────────────

class InfrastructureError(DocRefError):
    """Base class for internal/infra errors."""
    http_status = 500


class StorageError(InfrastructureError):
    """File I/O failures."""


class CommitError(InfrastructureError):
    """Failure during ChangeSet commit."""


class RollbackError(InfrastructureError):
    """Failure during rollback execution."""


class ExportError(InfrastructureError):
    """Failure during case export."""
