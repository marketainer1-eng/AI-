"""
app/cli/commands/change_cmd.py
================================
CLI commands for ChangeSet management.

Commands
--------
  reorder          – Create a reorder ChangeSet (draft)
  link-refs        – Create a link-references ChangeSet (draft)
  unlink-refs      – Create an unlink-references ChangeSet (draft)
  list             – List ChangeSets for a case
  show             – Show a ChangeSet and its operations
  preview          – Preview the effect of a ChangeSet
  commit           – Commit a ChangeSet (apply changes + rename files)
"""
import typer
from rich.console import Console
from rich.table import Table
from rich.panel import Panel

from app.cli.commands._db import get_session

app = typer.Typer()
console = Console()


@app.command("reorder")
def change_reorder(
    case_id: int = typer.Argument(..., help="Case ID"),
    reorder_spec: str = typer.Argument(
        ...,
        help="Reorder spec as 'evidence_id:new_order,...' e.g. '3:1,1:2,2:3'",
    ),
    description: str = typer.Option(None, "--description", "-d", help="ChangeSet description"),
) -> None:
    """Create a reorder ChangeSet (stays in DRAFT until preview + commit).

    \b
    Example:
        # Swap evidence 3 → order 1, 1 → order 2, 2 → order 3
        docref change reorder 1 "3:1,1:2,2:3" --description "증거 순서 재배치"

        # Then preview the effect
        docref change preview <change_set_id>

        # Then commit
        docref change commit <change_set_id>
    """
    from app.services.change_service import ChangeService
    from app.api.schemas.changeset import ReorderRequest, ReorderEvidenceItem

    items = []
    for part in reorder_spec.split(","):
        eid_str, order_str = part.strip().split(":")
        items.append(
            ReorderEvidenceItem(
                evidence_id=int(eid_str), new_sort_order=int(order_str)
            )
        )

    db = get_session()
    try:
        svc = ChangeService(db)
        cs = svc.create_reorder_changeset(
            case_id=case_id,
            request=ReorderRequest(items=items, description=description),
        )
        console.print(
            Panel(
                f"[green]✓ ChangeSet created[/green]\n"
                f"  ID      : [cyan]{cs.id}[/cyan]\n"
                f"  Status  : {cs.status}\n"
                f"  Items   : {len(items)} operation(s)\n\n"
                f"[dim]Next steps:[/dim]\n"
                f"  docref change preview {cs.id}\n"
                f"  docref change commit  {cs.id}",
                title="New ChangeSet (reorder)",
                expand=False,
            )
        )
    except Exception as e:
        console.print(f"[red]Error:[/red] {e}")
        raise typer.Exit(1)
    finally:
        db.close()


@app.command("link-refs")
def change_link_refs(
    case_id: int = typer.Argument(..., help="Case ID"),
    links_spec: str = typer.Argument(
        ...,
        help="Links as 'anchor_id:evidence_id,...' e.g. '1:2,3:4'",
    ),
    description: str = typer.Option(None, "--description", "-d", help="ChangeSet description"),
) -> None:
    """Create a link-references ChangeSet (draft).

    \b
    Example:
        # Link anchor 1 → evidence 2, anchor 3 → evidence 4
        docref change link-refs 1 "1:2,3:4" --description "참조 연결"
    """
    from app.services.change_service import ChangeService
    from app.api.schemas.changeset import LinkReferencesRequest, LinkReferenceItem

    items = []
    for part in links_spec.split(","):
        anchor_str, evidence_str = part.strip().split(":")
        items.append(
            LinkReferenceItem(
                anchor_id=int(anchor_str), evidence_id=int(evidence_str)
            )
        )

    db = get_session()
    try:
        svc = ChangeService(db)
        cs = svc.create_link_references_changeset(
            case_id=case_id,
            request=LinkReferencesRequest(links=items, description=description),
        )
        console.print(
            Panel(
                f"[green]✓ ChangeSet created[/green]\n"
                f"  ID     : [cyan]{cs.id}[/cyan]\n"
                f"  Status : {cs.status}\n"
                f"  Links  : {len(items)} link(s)\n\n"
                f"[dim]Next steps:[/dim]\n"
                f"  docref change preview {cs.id}\n"
                f"  docref change commit  {cs.id}",
                title="New ChangeSet (link-references)",
                expand=False,
            )
        )
    except Exception as e:
        console.print(f"[red]Error:[/red] {e}")
        raise typer.Exit(1)
    finally:
        db.close()


@app.command("unlink-refs")
def change_unlink_refs(
    case_id: int = typer.Argument(..., help="Case ID"),
    reference_ids: str = typer.Argument(
        ...,
        help="Comma-separated Reference IDs to unlink, e.g. '1,2,3'",
    ),
    description: str = typer.Option(None, "--description", "-d", help="ChangeSet description"),
) -> None:
    """Create an unlink-references ChangeSet (draft).

    \b
    Example:
        docref change unlink-refs 1 "1,2" --description "참조 해제"
    """
    from app.services.change_service import ChangeService
    from app.api.schemas.changeset import UnlinkReferencesRequest

    ref_ids = [int(x.strip()) for x in reference_ids.split(",")]

    db = get_session()
    try:
        svc = ChangeService(db)
        cs = svc.create_unlink_references_changeset(
            case_id=case_id,
            request=UnlinkReferencesRequest(
                reference_ids=ref_ids, description=description
            ),
        )
        console.print(
            Panel(
                f"[green]✓ ChangeSet created[/green]\n"
                f"  ID       : [cyan]{cs.id}[/cyan]\n"
                f"  Status   : {cs.status}\n"
                f"  Unlinks  : {len(ref_ids)} reference(s)\n\n"
                f"[dim]Next steps:[/dim]\n"
                f"  docref change preview {cs.id}\n"
                f"  docref change commit  {cs.id}",
                title="New ChangeSet (unlink-references)",
                expand=False,
            )
        )
    except Exception as e:
        console.print(f"[red]Error:[/red] {e}")
        raise typer.Exit(1)
    finally:
        db.close()


@app.command("list")
def change_list(
    case_id: int = typer.Argument(..., help="Case ID"),
    skip: int = typer.Option(0, "--skip", help="Records to skip"),
    limit: int = typer.Option(20, "--limit", "-n", help="Max records to return"),
) -> None:
    """List ChangeSets for a case.

    \b
    Example:
        docref change list 1
        docref change list 1 --limit 5
    """
    from app.services.change_service import ChangeService

    db = get_session()
    try:
        svc = ChangeService(db)
        items, total = svc.list_changesets(case_id=case_id, skip=skip, limit=limit)
        table = Table(title=f"ChangeSets — Case {case_id} (total={total})")
        table.add_column("ID", style="cyan", no_wrap=True)
        table.add_column("Status")
        table.add_column("Description")
        table.add_column("Created At")
        table.add_column("Committed At")
        for cs in items:
            table.add_row(
                str(cs.id),
                cs.status,
                (cs.description or "-")[:50],
                str(cs.created_at)[:19],
                str(cs.committed_at)[:19] if cs.committed_at else "-",
            )
        console.print(table)
    except Exception as e:
        console.print(f"[red]Error:[/red] {e}")
        raise typer.Exit(1)
    finally:
        db.close()


@app.command("show")
def change_show(
    case_id: int = typer.Argument(..., help="Case ID"),
    change_set_id: int = typer.Argument(..., help="ChangeSet ID"),
) -> None:
    """Show a ChangeSet and its operations.

    \b
    Example:
        docref change show 1 2
    """
    from app.services.change_service import ChangeService

    db = get_session()
    try:
        svc = ChangeService(db)
        cs = svc.get_changeset(case_id=case_id, change_set_id=change_set_id)
        console.print(
            Panel(
                f"ID           : [cyan]{cs.id}[/cyan]\n"
                f"Case ID      : {cs.case_id}\n"
                f"Status       : {cs.status}\n"
                f"Description  : {cs.description or '-'}\n"
                f"Created At   : {cs.created_at}\n"
                f"Committed At : {cs.committed_at or '-'}",
                title=f"ChangeSet #{cs.id}",
                expand=False,
            )
        )
        if cs.operations:
            op_table = Table(title="Operations")
            op_table.add_column("Seq", style="cyan")
            op_table.add_column("Type")
            op_table.add_column("Payload")
            op_table.add_column("Applied")
            for op in sorted(cs.operations, key=lambda o: o.sequence):
                op_table.add_row(
                    str(op.sequence),
                    op.op_type,
                    str(op.payload or {})[:80],
                    "[green]✓[/green]" if op.is_applied else "[dim]pending[/dim]",
                )
            console.print(op_table)
    except Exception as e:
        console.print(f"[red]Error:[/red] {e}")
        raise typer.Exit(1)
    finally:
        db.close()


@app.command("preview")
def change_preview(
    change_set_id: int = typer.Argument(..., help="ChangeSet ID"),
) -> None:
    """Preview the effect of a ChangeSet (evidence list + file renames).

    \b
    Example:
        docref change preview 2
    """
    from app.services.change_service import ChangeService

    db = get_session()
    try:
        svc = ChangeService(db)
        result = svc.preview_changeset(change_set_id=change_set_id)

        console.print(f"\n[bold]ChangeSet {change_set_id} — Preview[/bold]")

        ev_table = Table(title="Evidence List After Change")
        ev_table.add_column("Rendered Number", style="cyan")
        ev_table.add_column("Label")
        for e in result.evidence_list_preview:
            ev_table.add_row(e.rendered_number, e.rendered_label)
        console.print(ev_table)

        console.print("\n[bold]File Rename Plan[/bold]")
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
    except Exception as e:
        console.print(f"[red]Error:[/red] {e}")
        raise typer.Exit(1)
    finally:
        db.close()


@app.command("commit")
def change_commit(
    change_set_id: int = typer.Argument(..., help="ChangeSet ID to commit"),
    force: bool = typer.Option(False, "--force", "-f", help="Skip confirmation prompt"),
) -> None:
    """Commit a ChangeSet — applies changes and renames files on disk.

    \b
    Example:
        docref change commit 2
        docref change commit 2 --force    # skip confirmation
    """
    from app.services.change_service import ChangeService

    if not force:
        confirm = typer.confirm(
            f"Commit ChangeSet {change_set_id}? "
            "This will apply all operations and rename files on disk."
        )
        if not confirm:
            console.print("Aborted.")
            raise typer.Exit(0)

    db = get_session()
    try:
        svc = ChangeService(db)
        result = svc.commit_changeset(change_set_id=change_set_id)
        console.print(
            Panel(
                f"[green]✓ Committed[/green]\n"
                f"  ChangeSet ID  : [cyan]{change_set_id}[/cyan]\n"
                f"  Version       : [bold]{result.version_label}[/bold]\n"
                f"  Files Renamed : {result.files_renamed}",
                title="Commit Complete",
                expand=False,
            )
        )
    except Exception as e:
        console.print(f"[red]Error:[/red] {e}")
        raise typer.Exit(1)
    finally:
        db.close()
