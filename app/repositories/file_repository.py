"""
app/repositories/file_repository.py
=====================================
Repository for SourceFile.
"""

from __future__ import annotations

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.source_file import SourceFile
from app.repositories.base import BaseRepository


class FileRepository(BaseRepository[SourceFile]):
    def __init__(self, db: Session):
        super().__init__(db, SourceFile)

    def get_by_id(self, file_id: int) -> SourceFile | None:
        return self.db.query(SourceFile).filter(SourceFile.id == file_id).first()

    def get_by_case(
        self, case_id: int, skip: int = 0, limit: int = 100
    ) -> list[SourceFile]:
        return (
            self.db.query(SourceFile)
            .filter(SourceFile.case_id == case_id)
            .order_by(SourceFile.created_at.asc())
            .offset(skip)
            .limit(limit)
            .all()
        )

    def count_by_case(self, case_id: int) -> int:
        return (
            self.db.query(func.count(SourceFile.id))
            .filter(SourceFile.case_id == case_id)
            .scalar()
            or 0
        )

    def get_by_case_and_id(self, case_id: int, file_id: int) -> SourceFile | None:
        return (
            self.db.query(SourceFile)
            .filter(SourceFile.case_id == case_id, SourceFile.id == file_id)
            .first()
        )

    def get_by_hash(self, file_hash: str) -> SourceFile | None:
        return (
            self.db.query(SourceFile)
            .filter(SourceFile.file_hash == file_hash)
            .first()
        )

    def get_by_ids(self, file_ids: list[int]) -> list[SourceFile]:
        if not file_ids:
            return []
        return (
            self.db.query(SourceFile)
            .filter(SourceFile.id.in_(file_ids))
            .all()
        )

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

    def update_role(self, sf: SourceFile, role: str) -> SourceFile:
        sf.role = role
        self.db.flush()
        self.db.refresh(sf)
        return sf
