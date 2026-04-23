import typer
from rich.console import Console

app = typer.Typer()
console = Console()


@app.command("run")
def rollback_run(
    case_id: int = typer.Argument(..., help="Case ID"),
    target_change_set_id: int = typer.Argument(
        ..., help="ChangeSet ID to roll back to (the version snapshot to restore)"
    ),
    force: bool = typer.Option(False, "--force", "-f", help="Skip confirmation prompt"),
) -> None:
    """
    Roll back case state to the VersionSnapshot of the target ChangeSet.
    Creates a new rollback ChangeSet — does NOT overwrite existing data.
    """
    from app.cli.commands._db import get_session
    from app.services.change_service import ChangeService
    from app.api.schemas.changeset import RollbackRequest

    if not force:
        confirm = typer.confirm(
            f"Roll back case {case_id} to the state at ChangeSet {target_change_set_id}?"
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
            f"[green]Rollback complete[/green]\n"
            f"  New ChangeSet ID: {result.new_change_set_id}\n"
            f"  Message: {result.message}"
        )
    except Exception as e:
        console.print(f"[red]Error:[/red] {e}")
        raise typer.Exit(1)
    finally:
        db.close()
