"""
app/api/routes/changes.py
==========================
ChangeSet / Change operation endpoints.

Workflow:
  POST /cases/{id}/changes/reorder           → ChangeSet (draft)
  POST /cases/{id}/changes/link-references   → ChangeSet (draft)
  POST /cases/{id}/changes/unlink-references → ChangeSet (draft)
  POST /cases/{id}/render-preview            → RenderPreviewResponse
  GET  /cases/{id}/changes                   → list ChangeSets
  GET  /cases/{id}/changes/{cs_id}           → get ChangeSet
  POST /changes/{cs_id}/preview              → ChangeSet (previewed)
  POST /changes/{cs_id}/commit               → CommitResponse (committed)
  POST /cases/{id}/rollback                  → RollbackResponse (new committed CS)
  GET  /cases/{id}/snapshots                 → list VersionSnapshots
"""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.db.base import get_db
from app.api.schemas.changeset import (
    ReorderRequest,
    LinkReferencesRequest,
    UnlinkReferencesRequest,
    ChangeSetResponse,
    ChangeSetListResponse,
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

@router.post(
    "/cases/{case_id}/render-preview",
    response_model=RenderPreviewResponse,
    summary="Render a preview (document body, evidence list, file renames)",
)
def render_preview(
    case_id: int,
    body: RenderPreviewRequest,
    svc: RenderService = Depends(get_render_service),
) -> RenderPreviewResponse:
    """
    Render a read-only preview without modifying any canonical data.

    If `change_set_id` is provided, the reorder operations in that ChangeSet
    are applied **in-memory** before rendering.  Canonical `sort_order` values
    are never changed.

    Returns:
    - **document_preview**: DOCX paragraphs with placeholders substituted
    - **evidence_list_preview**: ordered list of evidences with rendered numbers
    - **file_rename_preview**: current → planned filenames for each evidence file
    """
    try:
        result = svc.render_preview(case_id=case_id, change_set_id=body.change_set_id)
    except CaseNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    return result


# ── List ChangeSets ───────────────────────────────────────────────────────────

@router.get(
    "/cases/{case_id}/changes",
    response_model=ChangeSetListResponse,
    summary="List all ChangeSets for a case",
)
def list_changesets(
    case_id: int,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    svc: ChangeService = Depends(get_change_service),
) -> ChangeSetListResponse:
    """Return all ChangeSets for a case, newest first."""
    try:
        items, total = svc.list_changesets(case_id=case_id, skip=skip, limit=limit)
    except CaseNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    return ChangeSetListResponse(
        items=[ChangeSetResponse.from_orm_with_ops(cs) for cs in items],
        total=total,
        skip=skip,
        limit=limit,
    )


# ── Get ChangeSet ─────────────────────────────────────────────────────────────

@router.get(
    "/cases/{case_id}/changes/{change_set_id}",
    response_model=ChangeSetResponse,
    summary="Get a specific ChangeSet",
)
def get_changeset(
    case_id: int,
    change_set_id: int,
    svc: ChangeService = Depends(get_change_service),
) -> ChangeSetResponse:
    try:
        cs = svc.get_changeset(case_id=case_id, change_set_id=change_set_id)
    except (CaseNotFoundError, ChangeSetNotFoundError) as e:
        raise HTTPException(status_code=404, detail=str(e))
    return ChangeSetResponse.from_orm_with_ops(cs)


# ── Reorder ───────────────────────────────────────────────────────────────────

@router.post(
    "/cases/{case_id}/changes/reorder",
    response_model=ChangeSetResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a reorder ChangeSet",
)
def reorder_evidences(
    case_id: int,
    body: ReorderRequest,
    svc: ChangeService = Depends(get_change_service),
) -> ChangeSetResponse:
    """
    Create a **draft** ChangeSet that records a desired reorder of evidence `sort_order` values.

    The reorder is NOT applied yet.  Call `POST /changes/{id}/preview` to preview it,
    then `POST /changes/{id}/commit` to apply it permanently.

    Business rule: all `evidence_id` values in `items` must belong to `case_id`.
    Duplicate `evidence_id` or `new_sort_order` values within the request are rejected.
    """
    try:
        cs = svc.create_reorder_changeset(case_id=case_id, request=body)
    except CaseNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    return ChangeSetResponse.from_orm_with_ops(cs)


# ── Link References ───────────────────────────────────────────────────────────

@router.post(
    "/cases/{case_id}/changes/link-references",
    response_model=ChangeSetResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a link-references ChangeSet",
)
def link_references_changeset(
    case_id: int,
    body: LinkReferencesRequest,
    svc: ChangeService = Depends(get_change_service),
) -> ChangeSetResponse:
    """
    Create a **draft** ChangeSet containing `link_reference` operations.

    Each operation links a `DocumentAnchor` to an `Evidence`.
    Like reorder, the linking is NOT applied until the ChangeSet is committed.
    """
    try:
        cs = svc.create_link_references_changeset(case_id=case_id, request=body)
    except CaseNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    return ChangeSetResponse.from_orm_with_ops(cs)


# ── Unlink References ─────────────────────────────────────────────────────────

@router.post(
    "/cases/{case_id}/changes/unlink-references",
    response_model=ChangeSetResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create an unlink-references ChangeSet",
)
def unlink_references_changeset(
    case_id: int,
    body: UnlinkReferencesRequest,
    svc: ChangeService = Depends(get_change_service),
) -> ChangeSetResponse:
    """
    Create a **draft** ChangeSet containing `unlink_reference` operations.

    Each operation supersedes an existing active Reference.
    The unlinking is NOT applied until the ChangeSet is committed.
    """
    try:
        cs = svc.create_unlink_references_changeset(case_id=case_id, request=body)
    except CaseNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    return ChangeSetResponse.from_orm_with_ops(cs)


# ── ChangeSet Preview ─────────────────────────────────────────────────────────

@router.post(
    "/changes/{change_set_id}/preview",
    response_model=ChangeSetPreviewResponse,
    summary="Preview the effect of a ChangeSet before committing",
)
def preview_changeset(
    change_set_id: int,
    svc: ChangeService = Depends(get_change_service),
) -> ChangeSetPreviewResponse:
    """
    Preview the expected outcome of committing a ChangeSet.

    Transitions the ChangeSet status from `draft` → `previewed`.
    Canonical data is NOT modified.
    """
    try:
        result = svc.preview_changeset(change_set_id=change_set_id)
    except ChangeSetNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    return result


# ── Commit ────────────────────────────────────────────────────────────────────

@router.post(
    "/changes/{change_set_id}/commit",
    response_model=CommitResponse,
    summary="Commit a ChangeSet (apply all operations)",
)
def commit_changeset(
    change_set_id: int,
    svc: ChangeService = Depends(get_change_service),
) -> CommitResponse:
    """
    Commit a ChangeSet:

    1. Run a pre-commit integrity check (HTTP 409 if it fails).
    2. Apply all operations to canonical data.
    3. Execute planned file renames on disk.
    4. Create an immutable `VersionSnapshot`.
    5. Mark the ChangeSet as `committed`.

    Returns the version label (e.g. `v1`) and rename count.
    """
    try:
        result = svc.commit_changeset(change_set_id=change_set_id)
    except ChangeSetNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except IntegrityViolationError as e:
        raise HTTPException(
            status_code=409,
            detail={"message": str(e), "errors": e.errors},
        )
    except CommitError as e:
        raise HTTPException(status_code=500, detail=str(e))
    return result


# ── Rollback ──────────────────────────────────────────────────────────────────

@router.post(
    "/cases/{case_id}/rollback",
    response_model=RollbackResponse,
    summary="Roll back to a prior VersionSnapshot",
)
def rollback_case(
    case_id: int,
    body: RollbackRequest,
    svc: ChangeService = Depends(get_change_service),
) -> RollbackResponse:
    """
    Restore the state captured in `target_change_set_id`'s `VersionSnapshot`.

    A **new** rollback ChangeSet is created (the target ChangeSet is not overwritten).
    The rollback ChangeSet is immediately committed.

    Restored data:
    - Evidence `sort_order` and `is_active` flags
    - Reference `status` fields (active / superseded)
    """
    try:
        result = svc.rollback(
            case_id=case_id,
            target_change_set_id=body.target_change_set_id,
        )
    except CaseNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except ChangeSetNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except RollbackError as e:
        raise HTTPException(status_code=500, detail=str(e))
    return result


# ── Snapshots ─────────────────────────────────────────────────────────────────

@router.get(
    "/cases/{case_id}/snapshots",
    response_model=list[dict],
    summary="List all VersionSnapshots for a case",
)
def list_snapshots(
    case_id: int,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    svc: ChangeService = Depends(get_change_service),
) -> list[dict]:
    """
    Return a lightweight list of VersionSnapshots for a case
    (id, change_set_id, version_label, version_number, created_at).

    Full snapshot JSON is NOT returned here for performance reasons.
    """
    from app.repositories.changeset_repository import VersionSnapshotRepository
    from app.repositories.case_repository import CaseRepository
    db = svc.db
    case_repo = CaseRepository(db)
    if case_repo.get_by_id(case_id) is None:
        raise HTTPException(status_code=404, detail=f"Case {case_id} not found")

    snap_repo = VersionSnapshotRepository(db)
    snaps = snap_repo.get_by_case(case_id, skip=skip, limit=limit)
    return [
        {
            "id": s.id,
            "change_set_id": s.change_set_id,
            "case_id": s.case_id,
            "version_label": s.version_label,
            "version_number": s.version_number,
            "created_at": s.created_at.isoformat(),
        }
        for s in snaps
    ]
