from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.core.config import settings
from app.core.logging import setup_logging
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


@asynccontextmanager
async def lifespan(app: FastAPI):
    setup_logging()
    # Ensure storage dirs exist
    settings.upload_path.mkdir(parents=True, exist_ok=True)
    settings.export_path.mkdir(parents=True, exist_ok=True)
    yield


app = FastAPI(
    title="DocRef — Document Reference Integrity Management System",
    description="CLI-backed backend for maintaining evidence reference integrity in legal documents.",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ──────────────────────────────────────────────────────────────────
app.include_router(cases.router, prefix="/cases", tags=["cases"])
app.include_router(files.router, prefix="/cases", tags=["files"])
app.include_router(documents.router, prefix="/cases", tags=["documents"])
app.include_router(evidences.router, prefix="/cases", tags=["evidences"])
app.include_router(references.router, prefix="/references", tags=["references"])
app.include_router(changes.router, prefix="", tags=["changes"])
app.include_router(integrity.router, prefix="/cases", tags=["integrity"])
app.include_router(export.router, prefix="/cases", tags=["export"])


@app.get("/", tags=["health"])
def health_check() -> dict:
    return {"status": "ok", "version": "0.1.0"}
