"""
app/cli/commands/export_cmd.py
================================
CLI commands for Export.

Commands
--------
  run  – Export case artifacts (document DOCX, evidence list DOCX, rename manifest)
"""
import typer
from rich.console import Console
from rich.panel import Panel

from app.cli.commands._db import get_session

app = typer.Typer()
console = Console()


@app.command("run")
def export_run(
    case_id: int = typer.Argument(..., help="Case ID"),
    no_document: bool = typer.Option(
        False, "--no-document", help="Skip document DOCX export"
    ),
    no_evidence_list: bool = typer.Option(
        False, "--no-evidence-list", help="Skip evidence list DOCX export"
    ),
    no_rename_manifest: bool = typer.Option(
        False, "--no-rename-manifest", help="Skip file rename manifest JSON export"
    ),
) -> None:
    """Export case artifacts to the configured export directory.

    Runs an integrity check before export; fails if the check does not pass.

    \b
    Example:
        # Full export
        docref export run 1

        # Export without the rename manifest
        docref export run 1 --no-rename-manifest

        # Export only the evidence list
        docref export run 1 --no-document --no-rename-manifest
    """
    from app.services.export_service import ExportService
    from app.api.schemas.export import ExportRequest

    db = get_session()
    try:
        svc = ExportService(db)
        result = svc.export_case(
            case_id=case_id,
            request=ExportRequest(
                include_document=not no_document,
                include_evidence_list=not no_evidence_list,
                include_rename_manifest=not no_rename_manifest,
            ),
        )
        files_block = "\n".join(f"  📄 {f}" for f in result.exported_files)
        console.print(
            Panel(
                f"[green]✓ Export complete[/green]\n"
                f"  Case ID    : [cyan]{result.case_id}[/cyan]\n"
                f"  Directory  : [bold]{result.export_path}[/bold]\n"
                f"  Exported At: {result.exported_at}\n\n"
                f"Files:\n{files_block}",
                title="Export Complete",
                expand=False,
            )
        )
    except Exception as e:
        console.print(f"[red]Error:[/red] {e}")
        raise typer.Exit(1)
    finally:
        db.close()
