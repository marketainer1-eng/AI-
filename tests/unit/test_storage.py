"""
Unit tests for LocalStorage.
"""

import io
import tempfile
from pathlib import Path

import pytest

from app.storage.local_storage import LocalStorage
from app.core.exceptions import StorageError


class _FakeUpload:
    """Minimal UploadFile-like object for testing."""
    def __init__(self, filename: str, content: bytes):
        self.filename = filename
        self.content_type = "application/octet-stream"
        self._content = content

    @property
    def file(self):
        return io.BytesIO(self._content)


@pytest.fixture
def storage(tmp_path: Path) -> LocalStorage:
    return LocalStorage(upload_dir=tmp_path / "uploads")


class TestLocalStorage:
    def test_save_creates_file(self, storage: LocalStorage):
        upload = _FakeUpload("test.docx", b"DOCX content here")
        result = storage.save(case_id=1, upload_file=upload)
        assert Path(result["storage_path"]).exists()
        assert result["original_filename"] == "test.docx"
        assert result["file_size_bytes"] == len(b"DOCX content here")

    def test_save_generates_unique_stored_filename(self, storage: LocalStorage):
        upload1 = _FakeUpload("a.docx", b"content A")
        upload2 = _FakeUpload("a.docx", b"content B")
        r1 = storage.save(case_id=1, upload_file=upload1)
        r2 = storage.save(case_id=1, upload_file=upload2)
        assert r1["stored_filename"] != r2["stored_filename"]

    def test_save_computes_hash(self, storage: LocalStorage):
        content = b"deterministic content"
        upload = _FakeUpload("x.docx", content)
        result = storage.save(case_id=1, upload_file=upload)
        import hashlib
        expected_hash = hashlib.sha256(content).hexdigest()
        assert result["file_hash"] == expected_hash

    def test_save_case_partitioned_directory(self, storage: LocalStorage):
        upload = _FakeUpload("f.docx", b"data")
        result = storage.save(case_id=42, upload_file=upload)
        assert "case_42" in result["storage_path"]

    def test_rename_file(self, storage: LocalStorage, tmp_path: Path):
        # Create a real file
        src = tmp_path / "uploads" / "case_1"
        src.mkdir(parents=True, exist_ok=True)
        original = src / "original.docx"
        original.write_bytes(b"content")

        new_path = storage.rename_file(str(original), "갑 제1호증_계약서.docx")
        assert Path(new_path).exists()
        assert not original.exists()
        assert Path(new_path).name == "갑 제1호증_계약서.docx"

    def test_rename_file_not_found(self, storage: LocalStorage):
        with pytest.raises(StorageError, match="not found"):
            storage.rename_file("/nonexistent/path/file.docx", "new.docx")

    def test_file_exists(self, storage: LocalStorage, tmp_path: Path):
        upload = _FakeUpload("e.docx", b"data")
        result = storage.save(case_id=1, upload_file=upload)
        assert storage.file_exists(result["storage_path"]) is True
        assert storage.file_exists("/nonexistent") is False

    def test_read_bytes(self, storage: LocalStorage):
        content = b"read this content"
        upload = _FakeUpload("r.docx", content)
        result = storage.save(case_id=1, upload_file=upload)
        read = storage.read_bytes(result["storage_path"])
        assert read == content

    def test_read_bytes_not_found(self, storage: LocalStorage):
        with pytest.raises(StorageError):
            storage.read_bytes("/nonexistent/file.docx")

    def test_delete_file(self, storage: LocalStorage):
        upload = _FakeUpload("d.docx", b"data")
        result = storage.save(case_id=1, upload_file=upload)
        path = result["storage_path"]
        assert Path(path).exists()
        storage.delete_file(path)
        assert not Path(path).exists()
