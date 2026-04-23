from sqlalchemy.orm import Session
from app.models.source_file import SourceFile
from app.repositories.base import BaseRepository


class FileRepository(BaseRepository[SourceFile]):
    def __init__(self, db: Session):
        super().__init__(db, SourceFile)

    def get_by_id(self, file_id: int) -> SourceFile | None:
        return self.db.query(SourceFile).filter(SourceFile.id == file_id).first()

    def get_by_case(self, case_id: int) -> list[SourceFile]:
        return (
            self.db.query(SourceFile)
            .filter(SourceFile.case_id == case_id)
            .order_by(SourceFile.created_at.asc())
            .all()
        )

    def get_by_case_and_id(self, case_id: int, file_id: int) -> SourceFile | None:
        return (
            self.db.query(SourceFile)
            .filter(SourceFile.case_id == case_id, SourceFile.id == file_id)
            .first()
        )

    def get_by_hash(self, file_hash: str) -> SourceFile | None:
        return self.db.query(SourceFile).filter(SourceFile.file_hash == file_hash).first()

    def create(
        self,
        case_id: int,
        original_filename: str,
        stored_filename: str,
        storage_path: str,
        file_size_bytes: int | None,
        mime_type: str | None,
        file_hash: str | None,
        role: str,
    ) -> SourceFile:
        sf = SourceFile(
            case_id=case_id,
            original_filename=original_filename,
            stored_filename=stored_filename,
            storage_path=storage_path,
            file_size_bytes=file_size_bytes,
            mime_type=mime_type,
            file_hash=file_hash,
            role=role,
        )
        return self.add(sf)
