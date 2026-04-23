from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from sqlalchemy.orm import Session

from app.db.base import get_db
from app.api.schemas.file import SourceFileResponse, SourceFileListResponse
from app.services.file_service import FileService
from app.core.exceptions import CaseNotFoundError, StorageError

router = APIRouter()


def get_file_service(db: Session = Depends(get_db)) -> FileService:
    return FileService(db)


@router.post(
    "/{case_id}/files",
    response_model=SourceFileResponse,
    status_code=status.HTTP_201_CREATED,
)
def upload_file(
    case_id: int,
    file: UploadFile = File(...),
    role: str = "unknown",
    svc: FileService = Depends(get_file_service),
) -> SourceFileResponse:
    """
    Upload a file (DOCX or any attachment) to a case.
    role: evidence_attachment | document | unknown
    """
    try:
        source_file = svc.upload_file(case_id=case_id, upload=file, role=role)
    except CaseNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except StorageError as e:
        raise HTTPException(status_code=500, detail=str(e))
    return SourceFileResponse.model_validate(source_file)


@router.get("/{case_id}/files", response_model=SourceFileListResponse)
def list_files(
    case_id: int,
    svc: FileService = Depends(get_file_service),
) -> SourceFileListResponse:
    """List all uploaded files for a case."""
    try:
        files = svc.list_files(case_id=case_id)
    except CaseNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    return SourceFileListResponse(
        items=[SourceFileResponse.model_validate(f) for f in files],
        total=len(files),
    )


@router.get("/{case_id}/files/{file_id}", response_model=SourceFileResponse)
def get_file(
    case_id: int,
    file_id: int,
    svc: FileService = Depends(get_file_service),
) -> SourceFileResponse:
    """Get a specific file record."""
    from app.core.exceptions import SourceFileNotFoundError

    try:
        f = svc.get_file(case_id=case_id, file_id=file_id)
    except (CaseNotFoundError, SourceFileNotFoundError) as e:
        raise HTTPException(status_code=404, detail=str(e))
    return SourceFileResponse.model_validate(f)
