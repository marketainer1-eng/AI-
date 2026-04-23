from datetime import datetime
from pydantic import BaseModel, Field


class DocumentCreate(BaseModel):
    source_file_id: int = Field(..., description="ID of the uploaded DOCX source file")
    title: str = Field(..., min_length=1, max_length=512, description="Document title")
    doc_type: str = Field(
        "main_brief",
        pattern="^(main_brief|exhibit_list|other)$",
        description="Document type",
    )


class DocumentResponse(BaseModel):
    id: int
    case_id: int
    source_file_id: int
    title: str
    doc_type: str
    parse_status: str
    parse_error: str | None
    parsed_at: datetime | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class DocumentAnchorResponse(BaseModel):
    id: int
    document_id: int
    placeholder_text: str
    paragraph_index: int | None
    char_offset: int | None
    context_snippet: str | None
    status: str
    created_at: datetime

    model_config = {"from_attributes": True}


class ParsePlaceholderResponse(BaseModel):
    document_id: int
    anchors_found: int
    anchors: list[DocumentAnchorResponse]
