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
)

app = typer.Typer(
    name="docref",
    help="Document Reference Integrity Management System CLI",
    add_completion=False,
)

app.add_typer(case_cmd.app, name="case", help="Manage cases")
app.add_typer(file_cmd.app, name="file", help="Manage uploaded files")
app.add_typer(document_cmd.app, name="document", help="Manage documents")
app.add_typer(evidence_cmd.app, name="evidence", help="Manage evidences")
app.add_typer(reference_cmd.app, name="reference", help="Manage references")
app.add_typer(render_cmd.app, name="render", help="Render previews")
app.add_typer(integrity_cmd.app, name="integrity", help="Run integrity checks")
app.add_typer(change_cmd.app, name="change", help="Manage change sets")
app.add_typer(rollback_cmd.app, name="rollback", help="Rollback to previous state")
app.add_typer(export_cmd.app, name="export", help="Export case artifacts")


if __name__ == "__main__":
    app()
