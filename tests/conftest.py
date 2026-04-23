"""
Global pytest fixtures for DocRef test suite.

Fixture hierarchy
-----------------
Unit tests  (tests/unit/)        → use ``db`` fixture
                                   → SQLite in-memory Session, fresh per test
Integration tests (tests/integration/) → use ``client`` fixture
                                   → FastAPI TestClient + SQLite in-memory DB
                                   → dependency-overridden get_db

Both fixtures create ALL tables fresh per test function and drop them after.
PostgreSQL is NOT required for any test.

Shared helpers
--------------
``make_case``       – create a Case and return its id
``make_source_file``– insert a SourceFile row directly (no disk I/O)
``make_document``   – insert a Document row and optional anchors
``make_anchor``     – insert a DocumentAnchor row
``make_evidence``   – create an Evidence via EvidenceService
``make_reference``  – create a Reference via ReferenceService
``make_reorder_cs`` – create + commit a reorder ChangeSet via ChangeService
"""

from __future__ import annotations

import io
from pathlib import Path
from typing import Generator

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, event
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from app.db.base import Base, get_db
import app.models  # noqa: F401  — registers all ORM models into Base.metadata
from app.main import app
from app.core.config import settings

# ── ORM models needed by helpers ──────────────────────────────────────────────
from app.models.source_file import SourceFile
from app.models.document import Document, DocumentAnchor

# ── Service layer ─────────────────────────────────────────────────────────────
from app.services.case_service import CaseService
from app.services.evidence_service import EvidenceService
from app.services.reference_service import ReferenceService
from app.services.change_service import ChangeService

# ── Schemas ───────────────────────────────────────────────────────────────────
from app.api.schemas.case import CaseCreate
from app.api.schemas.evidence import EvidenceCreate
from app.api.schemas.reference import ReferenceCreate
from app.api.schemas.changeset import ReorderRequest, ReorderEvidenceItem


# ══════════════════════════════════════════════════════════════════════════════
#  Engine factory
# ══════════════════════════════════════════════════════════════════════════════

def _make_sqlite_engine():
    """
    Create a SQLite in-memory engine with StaticPool.

    StaticPool forces ALL connections to reuse the SAME underlying connection,
    so the in-memory database (and its tables) persist for the lifetime of the
    engine object – critical for TestClient tests where request sessions are
    opened separately from the fixture session.
    """
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )

    @event.listens_for(engine, "connect")
    def _enable_fk(dbapi_conn, _rec):
        cursor = dbapi_conn.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()

    return engine


# ══════════════════════════════════════════════════════════════════════════════
#  Core DB / Client fixtures
# ══════════════════════════════════════════════════════════════════════════════

@pytest.fixture(scope="function")
def db() -> Generator[Session, None, None]:
    """
    Unit-test DB session: fresh SQLite in-memory database per test function.
    Tables are created before the test and dropped after.
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
def client(tmp_path: Path) -> Generator[TestClient, None, None]:
    """
    Integration-test client: FastAPI TestClient with SQLite in-memory DB injected
    via ``dependency_overrides``.

    Storage directories are redirected to ``tmp_path`` so tests never pollute the
    real ``storage/`` tree and files created by tests are cleaned up automatically.
    """
    # Redirect storage dirs
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


# ══════════════════════════════════════════════════════════════════════════════
#  Shared helper functions  (not fixtures — call directly in tests)
# ══════════════════════════════════════════════════════════════════════════════

def make_case(db: Session, name: str = "테스트 사건") -> int:
    """Create a Case and return its id."""
    return CaseService(db).create_case(CaseCreate(name=name)).id


def make_source_file(
    db: Session,
    case_id: int,
    *,
    filename: str = "brief.docx",
    role: str = "document",
    storage_path: str | None = None,
) -> SourceFile:
    """
    Insert a SourceFile row directly (no actual disk file created).
    ``storage_path`` defaults to a non-existent path — suitable for most unit
    tests that don't exercise disk I/O.
    """
    sf = SourceFile(
        case_id=case_id,
        original_filename=filename,
        stored_filename=f"stored_{filename}",
        storage_path=storage_path or f"/tmp/nonexistent/{filename}",
        role=role,
        mime_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    )
    db.add(sf)
    db.flush()
    return sf


def make_document(
    db: Session,
    case_id: int,
    source_file_id: int,
    *,
    title: str = "준비서면",
    doc_type: str = "main_brief",
    anchors: list[str] | None = None,
) -> tuple[Document, list[DocumentAnchor]]:
    """
    Insert a Document (and optionally a list of placeholder anchors) and return
    ``(document, anchor_list)``.
    """
    doc = Document(
        case_id=case_id,
        source_file_id=source_file_id,
        title=title,
        doc_type=doc_type,
    )
    db.add(doc)
    db.flush()

    anchor_objs: list[DocumentAnchor] = []
    for i, placeholder in enumerate(anchors or []):
        a = DocumentAnchor(
            document_id=doc.id,
            placeholder_text=placeholder,
            paragraph_index=i,
            char_offset=0,
            status="unlinked",
        )
        db.add(a)
        db.flush()
        anchor_objs.append(a)

    return doc, anchor_objs


def make_anchor(
    db: Session,
    document_id: int,
    placeholder: str = "{{갑 제1호증}}",
    paragraph_index: int = 0,
) -> DocumentAnchor:
    """Insert a single DocumentAnchor and return it."""
    a = DocumentAnchor(
        document_id=document_id,
        placeholder_text=placeholder,
        paragraph_index=paragraph_index,
        char_offset=0,
        status="unlinked",
    )
    db.add(a)
    db.flush()
    return a


def make_evidence(
    db: Session,
    case_id: int,
    *,
    label: str = "계약서",
    party: str = "plaintiff",
    sort_order: int = 0,
) -> int:
    """Create an Evidence via EvidenceService and return its id."""
    svc = EvidenceService(db)
    e = svc.create_evidence(
        case_id=case_id,
        data=EvidenceCreate(party=party, label=label, sort_order=sort_order),
    )
    return e.id


def make_reference(db: Session, anchor_id: int, evidence_id: int) -> int:
    """Create a Reference via ReferenceService and return its id."""
    svc = ReferenceService(db)
    ref = svc.create_reference(
        data=ReferenceCreate(anchor_id=anchor_id, evidence_id=evidence_id)
    )
    return ref.id


def make_reorder_cs(
    db: Session,
    case_id: int,
    items: list[tuple[int, int]],  # [(evidence_id, new_sort_order), ...]
    *,
    description: str | None = None,
    commit: bool = False,
) -> int:
    """
    Create a reorder ChangeSet (and optionally commit it).
    Returns the ChangeSet id.
    """
    svc = ChangeService(db)
    cs = svc.create_reorder_changeset(
        case_id=case_id,
        request=ReorderRequest(
            items=[
                ReorderEvidenceItem(evidence_id=eid, new_sort_order=order)
                for eid, order in items
            ],
            description=description,
        ),
    )
    if commit:
        svc.commit_changeset(change_set_id=cs.id)
    return cs.id


class FakeUpload:
    """
    Minimal UploadFile-like object for unit tests that call ``FileService.upload_file``.
    No real HTTP or FastAPI machinery needed.
    """

    def __init__(
        self,
        filename: str = "test.docx",
        content: bytes = b"dummy content",
        content_type: str = (
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        ),
    ):
        self.filename = filename
        self.content_type = content_type
        self._content = content
        self.file = io.BytesIO(content)

    def read(self, n: int = -1) -> bytes:
        return self.file.read(n)
