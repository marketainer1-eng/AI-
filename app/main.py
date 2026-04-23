"""
app/main.py
===========
FastAPI application factory for the DocRef system.

Routers:
  /cases                    — Case CRUD + audit logs
  /cases                    — SourceFile upload / list / role update
  /cases                    — Document registration + placeholder parsing
  /cases                    — Evidence CRUD + file links + references
  /cases                    — Integrity check
  /cases                    — Export
  /cases + /changes         — ChangeSet / preview / commit / rollback / snapshots
  /references               — Reference create / get / delete
"""

from __future__ import annotations

from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.core.config import settings
from app.core.logging import setup_logging
from app.core.exceptions import (
    DocRefError,
    NotFoundError,
    ConflictError,
    ValidationError as DomainValidationError,
    InfrastructureError,
)
from app.api.routes import (
    cases,
    files,
    documents,
    evidences,
    references,
    changes,
    integrity,
    export,
)


# ── Lifespan ──────────────────────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    setup_logging()
    # Ensure storage dirs exist at startup
    settings.upload_path.mkdir(parents=True, exist_ok=True)
    settings.export_path.mkdir(parents=True, exist_ok=True)
    yield


# ── App ───────────────────────────────────────────────────────────────────────

app = FastAPI(
    title="DocRef — Document Reference Integrity Management System",
    description=(
        "Backend API for maintaining evidence-reference integrity "
        "in Korean litigation documents.\n\n"
        "## Workflow\n"
        "1. **case create** → POST /cases\n"
        "2. **file upload** → POST /cases/{id}/files\n"
        "3. **document create** → POST /cases/{id}/documents\n"
        "4. **placeholder parse** → POST /cases/{id}/documents/{id}/parse-placeholders\n"
        "5. **evidence create** → POST /cases/{id}/evidences\n"
        "6. **reference link** → POST /references\n"
        "7. **render preview** → POST /cases/{id}/render-preview\n"
        "8. **integrity check** → GET /cases/{id}/integrity-check\n"
        "9. **commit** → POST /changes/{id}/commit\n"
        "10. **rollback** → POST /cases/{id}/rollback\n"
        "11. **export** → POST /cases/{id}/export\n"
    ),
    version="0.2.0",
    lifespan=lifespan,
)

# ── CORS ──────────────────────────────────────────────────────────────────────

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Global exception handlers ─────────────────────────────────────────────────

@app.exception_handler(NotFoundError)
async def not_found_handler(request: Request, exc: NotFoundError) -> JSONResponse:
    return JSONResponse(status_code=404, content={"detail": str(exc)})


@app.exception_handler(ConflictError)
async def conflict_handler(request: Request, exc: ConflictError) -> JSONResponse:
    content: dict = {"detail": str(exc)}
    # IntegrityViolationError carries an errors list
    if hasattr(exc, "errors") and exc.errors:
        content["errors"] = exc.errors
    return JSONResponse(status_code=409, content=content)


@app.exception_handler(DomainValidationError)
async def validation_handler(
    request: Request, exc: DomainValidationError
) -> JSONResponse:
    return JSONResponse(status_code=422, content={"detail": str(exc)})


@app.exception_handler(InfrastructureError)
async def infra_handler(request: Request, exc: InfrastructureError) -> JSONResponse:
    return JSONResponse(status_code=500, content={"detail": str(exc)})


@app.exception_handler(DocRefError)
async def generic_docref_handler(request: Request, exc: DocRefError) -> JSONResponse:
    return JSONResponse(
        status_code=getattr(exc, "http_status", 500),
        content={"detail": str(exc)},
    )


# ── Routers ───────────────────────────────────────────────────────────────────

# Cases + audit log
app.include_router(cases.router, prefix="/cases", tags=["cases"])

# Files (mounted under /cases)
app.include_router(files.router, prefix="/cases", tags=["files"])

# Documents + anchors (mounted under /cases)
app.include_router(documents.router, prefix="/cases", tags=["documents"])

# Evidences + file-links + per-evidence references (mounted under /cases)
app.include_router(evidences.router, prefix="/cases", tags=["evidences"])

# References (standalone prefix)
app.include_router(references.router, prefix="/references", tags=["references"])

# Changes: render-preview, list/get CS, reorder/link/unlink, preview, commit, rollback, snapshots
app.include_router(changes.router, prefix="", tags=["changes"])

# Integrity check
app.include_router(integrity.router, prefix="/cases", tags=["integrity"])

# Export
app.include_router(export.router, prefix="/cases", tags=["export"])


# ── Health check ──────────────────────────────────────────────────────────────

@app.get("/", tags=["health"])
def health_check() -> dict:
    return {"status": "ok", "version": "0.2.0"}
