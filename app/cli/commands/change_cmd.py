import typer
from rich.console import Console

app = typer.Typer()
console = Console()


@app.command("reorder")
def change_reorder(
    case_id: int = typer.Argument(..., help="Case ID"),
    reorder_spec: str = typer.Argument(
        ...,
        help="Reorder spec as 'evidence_id:new_order,...' e.g. '3:1,1:2,2:3'",
    ),
    description: str = typer.Option(None, "--description", "-d"),
) -> None:
    """
    Create a reorder ChangeSet.
    Example: docref change reorder 1 "3:1,1:2,2:3"
    Creates a DRAFT ChangeSet — use 'change preview' and 'change commit' to apply.
    """
    from app.cli.commands._db import get_session
    from app.services.change_service import ChangeService
    from app.api.schemas.changeset import ReorderRequest, ReorderEvidenceItem

    items = []
    for part in reorder_spec.split(","):
        eid_str, order_str = part.strip().split(":")
        items.append(ReorderEvidenceItem(evidence_id=int(eid_str), new_sort_order=int(order_str)))

    db = get_session()
    try:
        svc = ChangeService(db)
        cs = svc.create_reorder_changeset(
            case_id=case_id,
            request=ReorderRequest(items=items, description=description),
        )
        console.print(
            f"[green]ChangeSet created[/green] id={cs.id} status={cs.status}\n"
            f"Run: docref change preview {cs.id}\n"
            f"Then: docref change commit {cs.id}"
        )
    except Exception as e:
        console.print(f"[red]Error:[/red] {e}")
        raise typer.Exit(1)
    finally:
        db.close()


@app.command("preview")
def change_preview(
    change_set_id: int = typer.Argument(..., help="ChangeSet ID"),
) -> None:
    """Preview the effect of a ChangeSet."""
    from app.cli.commands._db import get_session
    from app.services.change_service import ChangeService

    db = get_session()
    try:
        svc = ChangeService(db)
        result = svc.preview_changeset(change_set_id=change_set_id)
        console.print(f"\n[bold]ChangeSet {change_set_id} Preview[/bold]")
        console.print("\n[bold]Evidence List:[/bold]")
        for e in result.evidence_list_preview:
            console.print(f"  {e.rendered_number}: {e.rendered_label}")
        console.print("\n[bold]File Renames:[/bold]")
        if result.file_rename_preview:
            for r in result.file_rename_preview:
                console.print(f"  {r.current_filename!r} -> {r.planned_filename!r}")
        else:
            console.print("  (none)")
    except Exception as e:
        console.print(f"[red]Error:[/red] {e}")
        raise typer.Exit(1)
    finally:
        db.close()


@app.command("commit")
def change_commit(
    change_set_id: int = typer.Argument(..., help="ChangeSet ID to commit"),
    force: bool = typer.Option(False, "--force", "-f", help="Skip confirmation"),
) -> None:
    """Commit a ChangeSet (applies changes and renames files on disk)."""
    from app.cli.commands._db import get_session
    from app.services.change_service import ChangeService

    if not force:
        confirm = typer.confirm(
            f"Commit ChangeSet {change_set_id}? This will rename files on disk."
        )
        if not confirm:
            console.print("Aborted.")
            raise typer.Exit(0)

    db = get_session()
    try:
        svc = ChangeService(db)
        result = svc.commit_changeset(change_set_id=change_set_id)
        console.print(
            f"[green]Committed[/green] ChangeSet {change_set_id} "
            f"version={result.version_label} files_renamed={result.files_renamed}"
        )
    except Exception as e:
        console.print(f"[red]Error:[/red] {e}")
        raise typer.Exit(1)
    finally:
        db.close()
