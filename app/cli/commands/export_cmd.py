import typer
from rich.console import Console

app = typer.Typer()
console = Console()


@app.command("run")
def export_run(
    case_id: int = typer.Argument(..., help="Case ID"),
    no_document: bool = typer.Option(False, "--no-document", help="Skip document export"),
    no_evidence_list: bool = typer.Option(
        False, "--no-evidence-list", help="Skip evidence list export"
    ),
    no_rename_manifest: bool = typer.Option(
        False, "--no-rename-manifest", help="Skip rename manifest export"
    ),
) -> None:
    """
    Export case artifacts to the export directory.
    Runs integrity check before export — fails if check does not pass.
    """
    from app.cli.commands._db import get_session
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
        console.print(f"[green]Export complete[/green] → {result.export_path}")
        for f in result.exported_files:
            console.print(f"  📄 {f}")
    except Exception as e:
        console.print(f"[red]Error:[/red] {e}")
        raise typer.Exit(1)
    finally:
        db.close()
