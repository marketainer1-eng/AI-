from datetime import datetime
from pydantic import BaseModel, Field


class ExportRequest(BaseModel):
    include_document: bool = Field(True, description="Export rendered document DOCX")
    include_evidence_list: bool = Field(True, description="Export evidence list DOCX")
    include_rename_manifest: bool = Field(True, description="Export file rename manifest JSON")


class ExportResponse(BaseModel):
    case_id: int
    export_path: str
    exported_files: list[str]
    exported_at: datetime
