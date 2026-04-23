"""
Global pytest fixtures for DocRef test suite.

- Unit tests (tests/unit/): use `db` fixture → SQLite in-memory session directly.
- Integration tests (tests/integration/): use `client` fixture → FastAPI TestClient
  with SQLite in-memory session injected via dependency_overrides.

Both fixtures create all tables fresh per test function and drop them after.
PostgreSQL is NOT required for any test.
"""

import pytest
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import StaticPool
from fastapi.testclient import TestClient

# Import Base and all models so metadata is populated before create_all
from app.db.base import Base, get_db
import app.models  # noqa: F401 — registers all ORM models into Base.metadata
from app.main import app
from app.core.config import settings
from pathlib import Path


def _make_sqlite_engine():
    """
    Create a SQLite in-memory engine with StaticPool.
    StaticPool forces all connections to reuse the SAME underlying connection,
    so the in-memory database (and its tables) persist for the lifetime of the engine.
    """
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )

    @event.listens_for(engine, "connect")
    def _set_fk(dbapi_conn, _rec):
        cursor = dbapi_conn.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()

    return engine


@pytest.fixture(scope="function")
def db() -> Session:
    """
    Unit-test DB session: fresh SQLite in-memory per test function.
    All tables created and dropped per test.
    """
    engine = _make_sqlite_engine()
    Base.metadata.create_all(bind=engine)
    SessionLocal = sessionmaker(
        bind=engine, autocommit=False, autoflush=False, expire_on_commit=False
    )
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)
        engine.dispose()


@pytest.fixture(scope="function")
def client(tmp_path: Path) -> TestClient:
    """
    Integration-test client: FastAPI TestClient with SQLite in-memory DB injected.

    StaticPool ensures that create_all() and the request-scoped sessions all
    share the same underlying SQLite connection (and thus the same tables/data).
    """
    # Redirect storage dirs so tests don't pollute the real storage directory
    settings.upload_dir = str(tmp_path / "uploads")
    settings.export_dir = str(tmp_path / "exports")
    (tmp_path / "uploads").mkdir(parents=True, exist_ok=True)
    (tmp_path / "exports").mkdir(parents=True, exist_ok=True)

    engine = _make_sqlite_engine()
    Base.metadata.create_all(bind=engine)
    SessionLocal = sessionmaker(
        bind=engine, autocommit=False, autoflush=False, expire_on_commit=False
    )

    def override_get_db():
        session = SessionLocal()
        try:
            yield session
        finally:
            session.close()

    app.dependency_overrides[get_db] = override_get_db

    with TestClient(app, raise_server_exceptions=True) as c:
        yield c

    app.dependency_overrides.clear()
    Base.metadata.drop_all(bind=engine)
    engine.dispose()
