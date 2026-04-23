"""
app/api/routes/files.py
========================
SourceFile endpoints (mounted under /cases).

POST   /cases/{case_id}/files                        — upload file
GET    /cases/{case_id}/files                        — list files
GET    /cases/{case_id}/files/{file_id}              — get file
PATCH  /cases/{case_id}/files/{file_id}/role         — update file role
"""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, status
from sqlalchemy.orm import Session

from app.db.base import get_db
from app.api.schemas.file import (
    SourceFileRoleUpdate,
    SourceFileResponse,
    SourceFileListResponse,
)
from app.services.file_service import FileService
from app.core.exceptions import (
    CaseNotFoundError,
    SourceFileNotFoundError,
    StorageError,
    DuplicateFileError,
)

router = APIRouter()


def get_file_service(db: Session = Depends(get_db)) -> FileService:
    return FileService(db)


# ── Upload ────────────────────────────────────────────────────────────────────

@router.post(
    "/{case_id}/files",
    response_model=SourceFileResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Upload a file to a case",
)
def upload_file(
    case_id: int,
    file: UploadFile = File(..., description="The file to upload (DOCX or any attachment)"),
    role: str = Query(
        "unknown",
        description="FileRole: unknown | evidence_attachment | document",
    ),
    allow_duplicate: bool = Query(
        False,
        description="If True, allow uploading a file whose SHA-256 already exists in the case",
    ),
    svc: FileService = Depends(get_file_service),
) -> SourceFileResponse:
    """
    Upload a file to a case and store it on disk.

    - **role**: classify the file immediately (`evidence_attachment`, `document`, or `unknown`)
    - **allow_duplicate**: by default, re-uploading the same file content raises HTTP 409

    Returns the SourceFile record (id, stored_filename, file_hash, …).
    """
    try:
        source_file = svc.upload_file(
            case_id=case_id, upload=file, role=role, allow_duplicate=allow_duplicate
        )
    except CaseNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except DuplicateFileError as e:
        raise HTTPException(status_code=409, detail=str(e))
    except StorageError as e:
        raise HTTPException(status_code=500, detail=str(e))
    return SourceFileResponse.model_validate(source_file)


# ── List ──────────────────────────────────────────────────────────────────────

@router.get(
    "/{case_id}/files",
    response_model=SourceFileListResponse,
    summary="List uploaded files for a case",
)
def list_files(
    case_id: int,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    svc: FileService = Depends(get_file_service),
) -> SourceFileListResponse:
    """Return all source files belonging to a case, ordered by upload time."""
    try:
        items, total = svc.list_files(case_id=case_id, skip=skip, limit=limit)
    except CaseNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    return SourceFileListResponse(
        items=[SourceFileResponse.model_validate(f) for f in items],
        total=total,
        skip=skip,
        limit=limit,
    )


# ── Get ───────────────────────────────────────────────────────────────────────

@router.get(
    "/{case_id}/files/{file_id}",
    response_model=SourceFileResponse,
    summary="Get a specific source file",
)
def get_file(
    case_id: int,
    file_id: int,
    svc: FileService = Depends(get_file_service),
) -> SourceFileResponse:
    try:
        f = svc.get_file(case_id=case_id, file_id=file_id)
    except (CaseNotFoundError, SourceFileNotFoundError) as e:
        raise HTTPException(status_code=404, detail=str(e))
    return SourceFileResponse.model_validate(f)


# ── Role update ───────────────────────────────────────────────────────────────

@router.patch(
    "/{case_id}/files/{file_id}/role",
    response_model=SourceFileResponse,
    summary="Update the role of a source file",
)
def update_file_role(
    case_id: int,
    file_id: int,
    body: SourceFileRoleUpdate,
    svc: FileService = Depends(get_file_service),
) -> SourceFileResponse:
    """
    Change the role classification of an uploaded file.

    Roles:
    - **unknown**             — not yet classified
    - **evidence_attachment** — backing file for an Evidence record
    - **document**            — source DOCX for a Document record
    """
    try:
        f = svc.update_role(case_id=case_id, file_id=file_id, role=body.role)
    except (CaseNotFoundError, SourceFileNotFoundError) as e:
        raise HTTPException(status_code=404, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    return SourceFileResponse.model_validate(f)
