"""
app/cli/commands/rollback_cmd.py
=================================
CLI commands for Rollback.

Commands
--------
  run        – Roll back to the VersionSnapshot of a committed ChangeSet
  snapshots  – List version snapshots for a case
"""
import typer
from rich.console import Console
from rich.table import Table
from rich.panel import Panel

from app.cli.commands._db import get_session

app = typer.Typer()
console = Console()


@app.command("run")
def rollback_run(
    case_id: int = typer.Argument(..., help="Case ID"),
    target_change_set_id: int = typer.Argument(
        ..., help="ChangeSet ID whose VersionSnapshot to restore"
    ),
    force: bool = typer.Option(False, "--force", "-f", help="Skip confirmation prompt"),
) -> None:
    """Roll back case state to the VersionSnapshot of the target ChangeSet.

    Creates a NEW rollback ChangeSet — does NOT overwrite existing data.

    \b
    Example:
        docref rollback run 1 2
        docref rollback run 1 2 --force
    """
    from app.services.change_service import ChangeService

    if not force:
        confirm = typer.confirm(
            f"Roll back case {case_id} to the state captured in "
            f"ChangeSet {target_change_set_id}?"
        )
        if not confirm:
            console.print("Aborted.")
            raise typer.Exit(0)

    db = get_session()
    try:
        svc = ChangeService(db)
        result = svc.rollback(
            case_id=case_id,
            target_change_set_id=target_change_set_id,
        )
        console.print(
            Panel(
                f"[green]✓ Rollback complete[/green]\n"
                f"  New ChangeSet ID : [cyan]{result.new_change_set_id}[/cyan]\n"
                f"  Version Label    : {result.version_label}\n"
                f"  Message          : {result.message}",
                title="Rollback Complete",
                expand=False,
            )
        )
    except Exception as e:
        console.print(f"[red]Error:[/red] {e}")
        raise typer.Exit(1)
    finally:
        db.close()


@app.command("snapshots")
def rollback_snapshots(
    case_id: int = typer.Argument(..., help="Case ID"),
    limit: int = typer.Option(10, "--limit", "-n", help="Max snapshots to show"),
) -> None:
    """List version snapshots for a case (most recent first).

    \b
    Example:
        docref rollback snapshots 1
        docref rollback snapshots 1 --limit 5
    """
    from app.repositories.changeset_repository import VersionSnapshotRepository
    from app.repositories.case_repository import CaseRepository
    from app.core.exceptions import CaseNotFoundError

    db = get_session()
    try:
        case_repo = CaseRepository(db)
        if case_repo.get_by_id(case_id) is None:
            raise CaseNotFoundError(case_id)

        snap_repo = VersionSnapshotRepository(db)
        snapshots = snap_repo.get_by_case(case_id, limit=limit)

        table = Table(title=f"Version Snapshots — Case {case_id}")
        table.add_column("Snapshot ID", style="cyan")
        table.add_column("ChangeSet ID")
        table.add_column("Version #")
        table.add_column("Evidence Count")
        table.add_column("Created At")
        for sn in snapshots:
            ev_count = len(sn.snapshot_data.get("evidences", [])) if sn.snapshot_data else 0
            table.add_row(
                str(sn.id),
                str(sn.change_set_id),
                str(sn.version_number),
                str(ev_count),
                str(sn.created_at)[:19],
            )
        console.print(table)
    except CaseNotFoundError as e:
        console.print(f"[red]{e}[/red]")
        raise typer.Exit(1)
    except Exception as e:
        console.print(f"[red]Error:[/red] {e}")
        raise typer.Exit(1)
    finally:
        db.close()
