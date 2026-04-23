"""
Unit tests for FileService.

Scenarios covered
-----------------
Happy path
  - upload_file stores file and returns SourceFile with correct metadata
  - list_files returns (items, total)
  - get_file returns the correct SourceFile
  - update_role changes the role field

Edge / failure cases
  - upload_file with unknown case raises CaseNotFoundError
  - get_file with wrong file_id raises SourceFileNotFoundError
  - upload creates unique stored filenames for identical original names
  - file hash is deterministic (same content → same hash)
"""

from __future__ import annotations

import io
from pathlib import Path

import pytest
from sqlalchemy.orm import Session

from tests.conftest import make_case, FakeUpload

from app.services.file_service import FileService
from app.core.exceptions import CaseNotFoundError, SourceFileNotFoundError


class TestFileServiceUpload:
    def test_upload_returns_source_file(self, db: Session, tmp_path: Path):
        from app.core.config import settings
        settings.upload_dir = str(tmp_path / "uploads")

        case_id = make_case(db)
        svc = FileService(db)
        sf = svc.upload_file(
            case_id=case_id,
            upload=FakeUpload(filename="contract.pdf", content=b"PDF content"),
            role="evidence_attachment",
        )
        assert sf.id is not None
        assert sf.case_id == case_id
        assert sf.original_filename == "contract.pdf"
        assert sf.role == "evidence_attachment"
        assert sf.file_size_bytes == len(b"PDF content")

    def test_upload_case_not_found(self, db: Session, tmp_path: Path):
        from app.core.config import settings
        settings.upload_dir = str(tmp_path / "uploads")

        svc = FileService(db)
        with pytest.raises(CaseNotFoundError):
            svc.upload_file(
                case_id=99999,
                upload=FakeUpload(),
                role="document",
            )

    def test_upload_stores_file_on_disk(self, db: Session, tmp_path: Path):
        from app.core.config import settings
        settings.upload_dir = str(tmp_path / "uploads")

        case_id = make_case(db)
        svc = FileService(db)
        sf = svc.upload_file(
            case_id=case_id,
            upload=FakeUpload(content=b"disk test"),
            role="document",
        )
        assert Path(sf.storage_path).exists()

    def test_upload_computes_sha256_hash(self, db: Session, tmp_path: Path):
        import hashlib
        from app.core.config import settings
        settings.upload_dir = str(tmp_path / "uploads")

        content = b"deterministic bytes"
        expected = hashlib.sha256(content).hexdigest()

        case_id = make_case(db)
        svc = FileService(db)
        sf = svc.upload_file(
            case_id=case_id,
            upload=FakeUpload(content=content),
            role="document",
        )
        assert sf.file_hash == expected

    def test_upload_generates_unique_stored_filenames(self, db: Session, tmp_path: Path):
        from app.core.config import settings
        settings.upload_dir = str(tmp_path / "uploads")

        case_id = make_case(db)
        svc = FileService(db)
        sf1 = svc.upload_file(case_id=case_id, upload=FakeUpload(filename="a.docx", content=b"aaa"), role="document")
        sf2 = svc.upload_file(case_id=case_id, upload=FakeUpload(filename="a.docx", content=b"bbb"), role="document")
        assert sf1.stored_filename != sf2.stored_filename


class TestFileServiceList:
    def test_list_files_empty(self, db: Session):
        case_id = make_case(db)
        svc = FileService(db)
        items, total = svc.list_files(case_id)
        assert items == []
        assert total == 0

    def test_list_files_returns_uploaded(self, db: Session, tmp_path: Path):
        from app.core.config import settings
        settings.upload_dir = str(tmp_path / "uploads")

        case_id = make_case(db)
        svc = FileService(db)
        # Use different content bytes to avoid DuplicateFileError (same hash = rejected)
        svc.upload_file(
            case_id=case_id,
            upload=FakeUpload(filename="a.pdf", content=b"content-of-file-a"),
            role="document",
        )
        svc.upload_file(
            case_id=case_id,
            upload=FakeUpload(filename="b.pdf", content=b"content-of-file-b"),
            role="evidence_attachment",
        )
        items, total = svc.list_files(case_id)
        assert total == 2
        assert len(items) == 2

    def test_list_files_case_not_found(self, db: Session):
        svc = FileService(db)
        with pytest.raises(CaseNotFoundError):
            svc.list_files(99999)


class TestFileServiceGet:
    def test_get_file_found(self, db: Session, tmp_path: Path):
        from app.core.config import settings
        settings.upload_dir = str(tmp_path / "uploads")

        case_id = make_case(db)
        svc = FileService(db)
        sf = svc.upload_file(case_id=case_id, upload=FakeUpload(filename="f.docx"), role="document")
        found = svc.get_file(case_id=case_id, file_id=sf.id)
        assert found.id == sf.id

    def test_get_file_not_found(self, db: Session):
        case_id = make_case(db)
        svc = FileService(db)
        with pytest.raises(SourceFileNotFoundError):
            svc.get_file(case_id=case_id, file_id=99999)

    def test_get_file_wrong_case(self, db: Session, tmp_path: Path):
        from app.core.config import settings
        settings.upload_dir = str(tmp_path / "uploads")

        case_id = make_case(db)
        other_case = make_case(db, name="다른 사건")
        svc = FileService(db)
        sf = svc.upload_file(case_id=case_id, upload=FakeUpload(filename="x.docx"), role="document")
        with pytest.raises(SourceFileNotFoundError):
            svc.get_file(case_id=other_case, file_id=sf.id)


class TestFileServiceUpdateRole:
    def test_update_role_changes_field(self, db: Session, tmp_path: Path):
        from app.core.config import settings
        settings.upload_dir = str(tmp_path / "uploads")

        case_id = make_case(db)
        svc = FileService(db)
        sf = svc.upload_file(case_id=case_id, upload=FakeUpload(), role="unknown")
        updated = svc.update_role(case_id=case_id, file_id=sf.id, role="document")
        assert updated.role == "document"

    def test_update_role_not_found(self, db: Session):
        case_id = make_case(db)
        svc = FileService(db)
        with pytest.raises(SourceFileNotFoundError):
            svc.update_role(case_id=case_id, file_id=99999, role="document")
