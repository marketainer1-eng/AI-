"""Shared DB session helper for CLI commands."""
from app.db.base import SessionLocal


def get_session():
    """Return a new DB session for CLI use. Caller must close."""
    return SessionLocal()
