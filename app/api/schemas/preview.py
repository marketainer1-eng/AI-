from datetime import datetime
from pydantic import BaseModel, Field


class RenderPreviewRequest(BaseModel):
    change_set_id: int | None = Field(
        None,
        description="Optional ChangeSet ID. If omitted, renders from current canonical state.",
    )


class EvidenceListEntryPreview(BaseModel):
    evidence_id: int
    rendered_number: str
    rendered_label: str
    rendered_description: str | None
    sort_order_snapshot: int


class FileRenameEntryPreview(BaseModel):
    source_file_id: int
    current_filename: str
    planned_filename: str


class DocumentPreview(BaseModel):
    document_id: int
    paragraphs: list[str]
    content_hash: str


class RenderPreviewResponse(BaseModel):
    case_id: int
    change_set_id: int | None
    document_preview: DocumentPreview | None
    evidence_list_preview: list[EvidenceListEntryPreview]
    file_rename_preview: list[FileRenameEntryPreview]


class ChangeSetPreviewRequest(BaseModel):
    pass


class ChangeSetPreviewResponse(BaseModel):
    change_set_id: int
    status: str
    evidence_list_preview: list[EvidenceListEntryPreview]
    file_rename_preview: list[FileRenameEntryPreview]
