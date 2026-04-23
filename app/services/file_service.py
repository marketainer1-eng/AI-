"""
app/services/file_service.py
==============================
Business logic for SourceFile operations: upload, list, get, role update.
"""

from __future__ import annotations

from fastapi import UploadFile
from sqlalchemy.orm import Session

from app.models.source_file import SourceFile
from app.repositories.file_repository import FileRepository
from app.repositories.case_repository import CaseRepository
from app.repositories.integrity_repository import AuditLogRepository
from app.storage.local_storage import LocalStorage
from app.core.exceptions import (
    CaseNotFoundError,
    SourceFileNotFoundError,
    StorageError,
    DuplicateFileError,
)


class FileService:
    def __init__(self, db: Session):
        self.db = db
        self.repo = FileRepository(db)
        self.case_repo = CaseRepository(db)
        self.audit = AuditLogRepository(db)
        self.storage = LocalStorage()

    # ── Upload ────────────────────────────────────────────────────────────────

    def upload_file(
        self,
        case_id: int,
        upload: UploadFile,
        role: str,
        allow_duplicate: bool = False,
    ) -> SourceFile:
        """
        Store the uploaded file and create a SourceFile record.

        allow_duplicate: if False (default), raises DuplicateFileError when a
        file with the same SHA-256 already exists in the case.
        """
        case = self.case_repo.get_by_id(case_id)
        if case is None:
            raise CaseNotFoundError(case_id)

        try:
            stored = self.storage.save(case_id=case_id, upload_file=upload)
        except Exception as e:
            raise StorageError(f"Failed to store file: {e}") from e

        # Duplicate-hash check (within same case)
        if not allow_duplicate and stored.get("file_hash"):
            existing = self.repo.get_by_hash(stored["file_hash"])
            if existing and existing.case_id == case_id:
                raise DuplicateFileError(stored["file_hash"], existing.id)

        sf = self.repo.create(
            case_id=case_id,
            original_filename=stored["original_filename"],
            stored_filename=stored["stored_filename"],
            storage_path=stored["storage_path"],
            file_size_bytes=stored["file_size_bytes"],
            mime_type=stored["mime_type"],
            file_hash=stored["file_hash"],
            role=role,
        )
        self.audit.log(
            action="file_uploaded",
            case_id=case_id,
            entity_type="SourceFile",
            entity_id=sf.id,
            detail={"original_filename": sf.original_filename, "role": role},
        )
        self.db.commit()
        self.db.refresh(sf)
        return sf

    # ── List ──────────────────────────────────────────────────────────────────

    def list_files(
        self, case_id: int, skip: int = 0, limit: int = 100
    ) -> tuple[list[SourceFile], int]:
        if self.case_repo.get_by_id(case_id) is None:
            raise CaseNotFoundError(case_id)
        items = self.repo.get_by_case(case_id, skip=skip, limit=limit)
        total = self.repo.count_by_case(case_id)
        return items, total

    # ── Get ───────────────────────────────────────────────────────────────────

    def get_file(self, case_id: int, file_id: int) -> SourceFile:
        if self.case_repo.get_by_id(case_id) is None:
            raise CaseNotFoundError(case_id)
        sf = self.repo.get_by_case_and_id(case_id, file_id)
        if sf is None:
            raise SourceFileNotFoundError(file_id)
        return sf

    # ── Role update ───────────────────────────────────────────────────────────

    def update_role(self, case_id: int, file_id: int, role: str) -> SourceFile:
        sf = self.get_file(case_id, file_id)
        sf = self.repo.update_role(sf, role)
        self.audit.log(
            action="file_role_updated",
            case_id=case_id,
            entity_type="SourceFile",
            entity_id=file_id,
            detail={"role": role},
        )
        self.db.commit()
        self.db.refresh(sf)
        return sf
