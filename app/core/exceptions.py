class DocRefError(Exception):
    """Base exception for DocRef system."""


class CaseNotFoundError(DocRefError):
    def __init__(self, case_id: int):
        super().__init__(f"Case {case_id} not found")
        self.case_id = case_id


class DocumentNotFoundError(DocRefError):
    def __init__(self, document_id: int):
        super().__init__(f"Document {document_id} not found")
        self.document_id = document_id


class EvidenceNotFoundError(DocRefError):
    def __init__(self, evidence_id: int):
        super().__init__(f"Evidence {evidence_id} not found")
        self.evidence_id = evidence_id


class SourceFileNotFoundError(DocRefError):
    def __init__(self, file_id: int):
        super().__init__(f"SourceFile {file_id} not found")
        self.file_id = file_id


class ChangeSetNotFoundError(DocRefError):
    def __init__(self, change_set_id: int):
        super().__init__(f"ChangeSet {change_set_id} not found")
        self.change_set_id = change_set_id


class IntegrityViolationError(DocRefError):
    def __init__(self, message: str, errors: list[str]):
        super().__init__(message)
        self.errors = errors


class StorageError(DocRefError):
    pass


class ParseError(DocRefError):
    pass


class CommitError(DocRefError):
    pass


class RollbackError(DocRefError):
    pass
