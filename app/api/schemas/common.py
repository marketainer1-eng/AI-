"""
app/api/schemas/common.py
=========================
Shared Pydantic base types and response wrappers used across the API.
"""

from __future__ import annotations

from typing import Generic, TypeVar
from pydantic import BaseModel, Field

T = TypeVar("T")


class MessageResponse(BaseModel):
    """Generic success / info message."""
    message: str


class IDResponse(BaseModel):
    """Response carrying a single created-entity ID."""
    id: int


class PaginatedResponse(BaseModel, Generic[T]):
    """
    Generic paginated list wrapper.

    Usage:
        PaginatedResponse[CaseResponse](items=[...], total=5, skip=0, limit=20)
    """
    items: list[T]
    total: int
    skip: int = 0
    limit: int = 20
