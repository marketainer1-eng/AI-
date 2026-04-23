"""
app/cli/commands/render_cmd.py
================================
CLI commands for rendering previews.

Commands
--------
  preview  – Render a full preview: evidence list, file rename plan, document body
"""
import typer
from rich.console import Console
from rich.table import Table
from rich.panel import Panel

from app.cli.commands._db import get_session

app = typer.Typer()
console = Console()


@app.command("preview")
def render_preview(
    case_id: int = typer.Argument(..., help="Case ID"),
    change_set_id: int = typer.Option(
        None, "--change-set", "-cs", help="Optional DRAFT ChangeSet ID to preview"
    ),
    no_document: bool = typer.Option(False, "--no-document", help="Skip document body preview"),
) -> None:
    """Render a full preview of evidence list, file rename plan, and document body.

    \b
    Example:
        # Preview current committed state
        docref render preview 1

        # Preview with a pending ChangeSet applied
        docref render preview 1 --change-set 3

        # Preview without showing paragraphs (faster)
        docref render preview 1 --no-document
    """
    from app.services.render_service import RenderService

    db = get_session()
    try:
        svc = RenderService(db)
        result = svc.render_preview(case_id=case_id, change_set_id=change_set_id)

        # ── Evidence list ──────────────────────────────────────────────────────
        ev_table = Table(title=f"Evidence List Preview — Case {case_id}")
        ev_table.add_column("Rendered Number", style="cyan")
        ev_table.add_column("Label")
        for entry in result.evidence_list_preview:
            ev_table.add_row(entry.rendered_number, entry.rendered_label)
        console.print(ev_table)

        # ── File rename plan ───────────────────────────────────────────────────
        console.print("\n[bold]File Rename Preview[/bold]")
        if result.file_rename_preview:
            rename_table = Table()
            rename_table.add_column("Current Filename")
            rename_table.add_column("→")
            rename_table.add_column("Planned Filename")
            for rp in result.file_rename_preview:
                rename_table.add_row(rp.current_filename, "→", rp.planned_filename)
            console.print(rename_table)
        else:
            console.print("  [dim](no file renames planned)[/dim]")

        # ── Document body ──────────────────────────────────────────────────────
        if not no_document and result.document_preview:
            dp = result.document_preview
            console.print(
                Panel(
                    "\n".join(
                        f"  [{i}] {para[:120]}"
                        for i, para in enumerate(dp.paragraphs[:15])
                    )
                    + (
                        f"\n  [dim]... {len(dp.paragraphs) - 15} more paragraph(s)[/dim]"
                        if len(dp.paragraphs) > 15
                        else ""
                    ),
                    title=f"Document Body Preview (hash={dp.content_hash})",
                    expand=False,
                )
            )
        elif not no_document:
            console.print("\n[dim](no document preview available)[/dim]")

    except Exception as e:
        console.print(f"[red]Error:[/red] {e}")
        raise typer.Exit(1)
    finally:
        db.close()
