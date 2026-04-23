from datetime import datetime
from pydantic import BaseModel


class IntegrityViolation(BaseModel):
    violation_type: str
    entity_type: str
    entity_id: int | None
    message: str
    detail: dict = {}


class IntegrityWarning(BaseModel):
    warning_type: str
    entity_type: str
    entity_id: int | None
    message: str


class IntegrityReportResponse(BaseModel):
    id: int
    case_id: int
    result: str
    is_passed: bool
    violation_count: int
    violations: list[IntegrityViolation]
    warning_count: int
    warnings: list[IntegrityWarning]
    checked_at: datetime

    model_config = {"from_attributes": True}
