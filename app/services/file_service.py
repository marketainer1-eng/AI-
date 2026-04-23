from fastapi import UploadFile
from sqlalchemy.orm import Session

from app.models.source_file import SourceFile
from app.repositories.file_repository import FileRepository
from app.repositories.case_repository import CaseRepository
from app.repositories.integrity_repository import AuditLogRepository
from app.storage.local_storage import LocalStorage
from app.core.exceptions import CaseNotFoundError, SourceFileNotFoundError, StorageError


class FileService:
    def __init__(self, db: Session):
        self.db = db
        self.repo = FileRepository(db)
        self.case_repo = CaseRepository(db)
        self.audit = AuditLogRepository(db)
        self.storage = LocalStorage()

    def upload_file(self, case_id: int, upload: UploadFile, role: str) -> SourceFile:
        case = self.case_repo.get_by_id(case_id)
        if case is None:
            raise CaseNotFoundError(case_id)

        try:
            stored = self.storage.save(
                case_id=case_id,
                upload_file=upload,
            )
        except Exception as e:
            raise StorageError(f"Failed to store file: {e}") from e

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
        return sf

    def list_files(self, case_id: int) -> list[SourceFile]:
        if self.case_repo.get_by_id(case_id) is None:
            raise CaseNotFoundError(case_id)
        return self.repo.get_by_case(case_id)

    def get_file(self, case_id: int, file_id: int) -> SourceFile:
        if self.case_repo.get_by_id(case_id) is None:
            raise CaseNotFoundError(case_id)
        sf = self.repo.get_by_case_and_id(case_id, file_id)
        if sf is None:
            raise SourceFileNotFoundError(file_id)
        return sf
