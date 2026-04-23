import typer
from rich.console import Console

app = typer.Typer()
console = Console()


@app.command("preview")
def render_preview(
    case_id: int = typer.Argument(..., help="Case ID"),
    change_set_id: int = typer.Option(
        None, "--change-set", "-cs", help="Optional ChangeSet ID to preview"
    ),
) -> None:
    """Render a full preview of document body, evidence list, and file rename plan."""
    from app.cli.commands._db import get_session
    from app.services.render_service import RenderService

    db = get_session()
    try:
        svc = RenderService(db)
        result = svc.render_preview(case_id=case_id, change_set_id=change_set_id)

        console.print(f"\n[bold]Evidence List Preview[/bold] (Case {case_id})")
        for entry in result.evidence_list_preview:
            console.print(f"  {entry.rendered_number}: {entry.rendered_label}")

        console.print(f"\n[bold]File Rename Preview[/bold]")
        if result.file_rename_preview:
            for rp in result.file_rename_preview:
                console.print(f"  {rp.current_filename!r} -> {rp.planned_filename!r}")
        else:
            console.print("  (no file renames planned)")

        if result.document_preview:
            console.print(f"\n[bold]Document Preview[/bold] (hash={result.document_preview.content_hash})")
            for i, para in enumerate(result.document_preview.paragraphs[:10]):
                console.print(f"  [{i}] {para[:100]}")
            if len(result.document_preview.paragraphs) > 10:
                console.print(f"  ... ({len(result.document_preview.paragraphs) - 10} more paragraphs)")
    except Exception as e:
        console.print(f"[red]Error:[/red] {e}")
        raise typer.Exit(1)
    finally:
        db.close()
