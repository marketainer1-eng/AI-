from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.base import get_db
from app.api.schemas.changeset import (
    ReorderRequest,
    ChangeSetResponse,
    CommitRequest,
    CommitResponse,
    RollbackRequest,
    RollbackResponse,
)
from app.api.schemas.preview import (
    RenderPreviewRequest,
    RenderPreviewResponse,
    ChangeSetPreviewResponse,
)
from app.services.change_service import ChangeService
from app.services.render_service import RenderService
from app.core.exceptions import (
    CaseNotFoundError,
    ChangeSetNotFoundError,
    IntegrityViolationError,
    CommitError,
    RollbackError,
)

router = APIRouter()


def get_change_service(db: Session = Depends(get_db)) -> ChangeService:
    return ChangeService(db)


def get_render_service(db: Session = Depends(get_db)) -> RenderService:
    return RenderService(db)


# ── Render Preview ────────────────────────────────────────────────────────────

@router.post("/cases/{case_id}/render-preview", response_model=RenderPreviewResponse)
def render_preview(
    case_id: int,
    body: RenderPreviewRequest,
    svc: RenderService = Depends(get_render_service),
) -> RenderPreviewResponse:
    """
    Render preview of:
    - Document body with evidence numbers substituted
    - Evidence list with computed numbers
    - File rename plan
    Projections are stored in DB but do NOT modify canonical data.
    """
    try:
        result = svc.render_preview(case_id=case_id, change_set_id=body.change_set_id)
    except CaseNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    return result


# ── Reorder ───────────────────────────────────────────────────────────────────

@router.post(
    "/cases/{case_id}/changes/reorder",
    response_model=ChangeSetResponse,
    status_code=status.HTTP_201_CREATED,
)
def reorder_evidences(
    case_id: int,
    body: ReorderRequest,
    svc: ChangeService = Depends(get_change_service),
) -> ChangeSetResponse:
    """
    Create a ChangeSet with reorder operations.
    Does NOT apply the reorder — creates a draft ChangeSet that must be previewed then committed.
    """
    try:
        cs = svc.create_reorder_changeset(case_id=case_id, request=body)
    except CaseNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    return ChangeSetResponse.model_validate(cs)


# ── ChangeSet Preview ─────────────────────────────────────────────────────────

@router.post("/changes/{change_set_id}/preview", response_model=ChangeSetPreviewResponse)
def preview_changeset(
    change_set_id: int,
    svc: ChangeService = Depends(get_change_service),
) -> ChangeSetPreviewResponse:
    """Preview the effect of a ChangeSet before committing."""
    try:
        result = svc.preview_changeset(change_set_id=change_set_id)
    except ChangeSetNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    return result


# ── Commit ────────────────────────────────────────────────────────────────────

@router.post("/changes/{change_set_id}/commit", response_model=CommitResponse)
def commit_changeset(
    change_set_id: int,
    svc: ChangeService = Depends(get_change_service),
) -> CommitResponse:
    """
    Commit a ChangeSet:
    1. Apply all operations to canonical data
    2. Execute planned file renames on disk
    3. Take a VersionSnapshot
    """
    try:
        result = svc.commit_changeset(change_set_id=change_set_id)
    except ChangeSetNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except IntegrityViolationError as e:
        raise HTTPException(status_code=409, detail={"message": str(e), "errors": e.errors})
    except CommitError as e:
        raise HTTPException(status_code=500, detail=str(e))
    return result


# ── Rollback ──────────────────────────────────────────────────────────────────

@router.post("/cases/{case_id}/rollback", response_model=RollbackResponse)
def rollback_case(
    case_id: int,
    body: RollbackRequest,
    svc: ChangeService = Depends(get_change_service),
) -> RollbackResponse:
    """
    Roll back to the state captured in the target ChangeSet's VersionSnapshot.
    Creates a NEW ChangeSet (does NOT overwrite existing data).
    """
    try:
        result = svc.rollback(case_id=case_id, target_change_set_id=body.target_change_set_id)
    except CaseNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except ChangeSetNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except RollbackError as e:
        raise HTTPException(status_code=500, detail=str(e))
    return result
