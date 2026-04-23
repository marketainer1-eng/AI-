"""
LocalStorage — manages physical file operations on local disk.

Rules:
  - All uploads are stored with a UUID-based stored_filename (immutable).
  - Original filename is preserved in the DB record only.
  - Actual file rename on disk is performed ONLY when explicitly called
    (from ChangeService.commit_changeset).
  - This module does NOT determine or validate evidence numbers.
"""

import hashlib
import io
import uuid
from pathlib import Path

from app.core.config import settings
from app.core.exceptions import StorageError


class LocalStorage:
    def __init__(self, upload_dir: Path | None = None):
        self.upload_dir = upload_dir or settings.upload_path
        self.upload_dir.mkdir(parents=True, exist_ok=True)

    def save(self, case_id: int, upload_file) -> dict:
        """
        Save an uploaded file to disk.

        upload_file must have:
          .filename: str
          .content_type: str
          .file: file-like object (or .read() method)

        Returns dict with:
          original_filename, stored_filename, storage_path,
          file_size_bytes, mime_type, file_hash
        """
        original_filename = getattr(upload_file, "filename", "unknown")
        content_type = getattr(upload_file, "content_type", "application/octet-stream")

        # Read content
        if hasattr(upload_file, "file"):
            content = upload_file.file.read()
        elif hasattr(upload_file, "read"):
            content = upload_file.read()
        else:
            raise StorageError("Upload object has no readable content")

        if isinstance(content, str):
            content = content.encode("utf-8")

        # Compute hash
        file_hash = hashlib.sha256(content).hexdigest()

        # Generate UUID-based stored filename
        suffix = Path(original_filename).suffix
        stored_filename = f"{uuid.uuid4().hex}{suffix}"

        # Case-partitioned directory
        case_dir = self.upload_dir / f"case_{case_id}"
        case_dir.mkdir(parents=True, exist_ok=True)

        storage_path = case_dir / stored_filename
        storage_path.write_bytes(content)

        return {
            "original_filename": original_filename,
            "stored_filename": stored_filename,
            "storage_path": str(storage_path),
            "file_size_bytes": len(content),
            "mime_type": content_type,
            "file_hash": file_hash,
        }

    def rename_file(self, current_path: str, new_filename: str) -> str:
        """
        Rename a file on disk.
        ONLY called from commit flow — not from preview or render.

        Returns the new storage_path string.
        """
        src = Path(current_path)
        if not src.exists():
            raise StorageError(f"File not found for rename: {current_path}")

        dst = src.parent / new_filename
        if dst.exists() and dst != src:
            raise StorageError(
                f"Target filename already exists: {new_filename}. Rename aborted."
            )

        src.rename(dst)
        return str(dst)

    def delete_file(self, storage_path: str) -> None:
        """Delete a file from disk. Used for cleanup only."""
        path = Path(storage_path)
        if path.exists():
            path.unlink()

    def file_exists(self, storage_path: str) -> bool:
        return Path(storage_path).exists()

    def read_bytes(self, storage_path: str) -> bytes:
        path = Path(storage_path)
        if not path.exists():
            raise StorageError(f"File not found: {storage_path}")
        return path.read_bytes()
