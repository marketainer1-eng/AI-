import typer
from rich.console import Console

app = typer.Typer()
console = Console()


@app.command("link")
def reference_link(
    anchor_id: int = typer.Argument(..., help="DocumentAnchor ID"),
    evidence_id: int = typer.Argument(..., help="Evidence ID"),
    note: str = typer.Option(None, "--note", "-n", help="Optional note"),
) -> None:
    """Link a DocumentAnchor to an Evidence (create a Reference)."""
    from app.cli.commands._db import get_session
    from app.services.reference_service import ReferenceService
    from app.api.schemas.reference import ReferenceCreate

    db = get_session()
    try:
        svc = ReferenceService(db)
        ref = svc.create_reference(
            data=ReferenceCreate(anchor_id=anchor_id, evidence_id=evidence_id, note=note)
        )
        console.print(
            f"[green]Reference created[/green] id={ref.id} anchor={anchor_id} evidence={evidence_id}"
        )
    except Exception as e:
        console.print(f"[red]Error:[/red] {e}")
        raise typer.Exit(1)
    finally:
        db.close()


@app.command("unlink")
def reference_unlink(
    reference_id: int = typer.Argument(..., help="Reference ID to deactivate"),
) -> None:
    """Unlink a Reference (set status to superseded, anchor back to unlinked)."""
    from app.cli.commands._db import get_session
    from app.services.reference_service import ReferenceService

    db = get_session()
    try:
        svc = ReferenceService(db)
        svc.deactivate_reference(reference_id)
        console.print(f"[green]Reference {reference_id} deactivated[/green]")
    except Exception as e:
        console.print(f"[red]Error:[/red] {e}")
        raise typer.Exit(1)
    finally:
        db.close()
