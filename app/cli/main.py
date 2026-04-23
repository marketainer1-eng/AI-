"""
DocRef CLI — Document Reference Integrity Management System
===========================================================
Entry point for the Typer CLI application.

Quick start (full workflow demo):
    docref workflow demo

Individual command groups:
    docref case        – Manage cases
    docref file        – Manage uploaded files
    docref document    – Manage DOCX documents and parse placeholders
    docref evidence    – Manage evidence records
    docref reference   – Manage anchor → evidence reference links
    docref render      – Render previews (evidence list, file renames, body)
    docref integrity   – Run integrity checks
    docref change      – Manage change sets (reorder / link / unlink / commit)
    docref rollback    – Roll back to a previous version snapshot
    docref export      – Export case artifacts
    docref workflow    – High-level workflow helpers (demo, status)
"""
import typer
from app.cli.commands import (
    case_cmd,
    file_cmd,
    document_cmd,
    evidence_cmd,
    reference_cmd,
    render_cmd,
    integrity_cmd,
    change_cmd,
    rollback_cmd,
    export_cmd,
    workflow_cmd,
)

app = typer.Typer(
    name="docref",
    help=(
        "Document Reference Integrity Management System CLI.\n\n"
        "Run [cyan]docref workflow demo[/cyan] for a complete end-to-end walkthrough."
    ),
    add_completion=False,
    rich_markup_mode="rich",
)

app.add_typer(case_cmd.app,      name="case",      help="Manage cases")
app.add_typer(file_cmd.app,      name="file",      help="Upload and manage source files")
app.add_typer(document_cmd.app,  name="document",  help="Register DOCX documents and parse placeholders")
app.add_typer(evidence_cmd.app,  name="evidence",  help="Create and manage evidence records")
app.add_typer(reference_cmd.app, name="reference", help="Link / unlink DocumentAnchors to Evidences")
app.add_typer(render_cmd.app,    name="render",    help="Render evidence list / document / rename previews")
app.add_typer(integrity_cmd.app, name="integrity", help="Run integrity checks and view history")
app.add_typer(change_cmd.app,    name="change",    help="Create, preview, and commit change sets")
app.add_typer(rollback_cmd.app,  name="rollback",  help="Roll back to a previous version snapshot")
app.add_typer(export_cmd.app,    name="export",    help="Export case artifacts (DOCX, manifest)")
app.add_typer(workflow_cmd.app,  name="workflow",  help="High-level workflow helpers (demo, status)")


if __name__ == "__main__":
    app()
