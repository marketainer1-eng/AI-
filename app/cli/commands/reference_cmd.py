"""
app/cli/commands/reference_cmd.py
==================================
CLI commands for Reference management.

Commands
--------
  link     – Link a DocumentAnchor to an Evidence
  unlink   – Deactivate (unlink) a Reference
  list     – List active references for a case or evidence
  show     – Show details of a single reference
"""
import typer
from rich.console import Console
from rich.table import Table
from rich.panel import Panel

from app.cli.commands._db import get_session

app = typer.Typer()
console = Console()


@app.command("link")
def reference_link(
    anchor_id: int = typer.Argument(..., help="DocumentAnchor ID"),
    evidence_id: int = typer.Argument(..., help="Evidence ID"),
    note: str = typer.Option(None, "--note", "-n", help="Optional note"),
) -> None:
    """Link a DocumentAnchor to an Evidence (create a Reference).

    \b
    Example:
        # Link anchor 1 → evidence 2
        docref reference link 1 2

        # With a note
        docref reference link 1 2 --note "갑 제1호증 기재 계약서"
    """
    from app.services.reference_service import ReferenceService
    from app.api.schemas.reference import ReferenceCreate

    db = get_session()
    try:
        svc = ReferenceService(db)
        ref = svc.create_reference(
            data=ReferenceCreate(anchor_id=anchor_id, evidence_id=evidence_id, note=note)
        )
        console.print(
            Panel(
                f"[green]✓ Reference created[/green]\n"
                f"  Reference ID : [cyan]{ref.id}[/cyan]\n"
                f"  Anchor ID    : {anchor_id}\n"
                f"  Evidence ID  : {evidence_id}\n"
                f"  Status       : {ref.status}\n"
                f"  Note         : {note or '-'}",
                title="New Reference",
                expand=False,
            )
        )
    except Exception as e:
        console.print(f"[red]Error:[/red] {e}")
        raise typer.Exit(1)
    finally:
        db.close()


@app.command("unlink")
def reference_unlink(
    reference_id: int = typer.Argument(..., help="Reference ID to deactivate"),
    force: bool = typer.Option(False, "--force", "-f", help="Skip confirmation"),
) -> None:
    """Unlink (deactivate) a Reference; the anchor reverts to 'unlinked'.

    \b
    Example:
        docref reference unlink 1
        docref reference unlink 1 --force
    """
    from app.services.reference_service import ReferenceService

    if not force:
        confirm = typer.confirm(
            f"Deactivate reference {reference_id}? "
            "The anchor will revert to 'unlinked' status."
        )
        if not confirm:
            console.print("Aborted.")
            raise typer.Exit(0)

    db = get_session()
    try:
        svc = ReferenceService(db)
        svc.deactivate_reference(reference_id)
        console.print(
            f"[green]✓ Reference {reference_id} deactivated[/green] "
            "(anchor status → unlinked)"
        )
    except Exception as e:
        console.print(f"[red]Error:[/red] {e}")
        raise typer.Exit(1)
    finally:
        db.close()


@app.command("list")
def reference_list(
    case_id: int = typer.Argument(..., help="Case ID"),
    evidence_id: int = typer.Option(
        None, "--evidence", "-e", help="Filter by Evidence ID"
    ),
) -> None:
    """List active references for a case (or for a specific evidence).

    \b
    Example:
        # All active references in case 1
        docref reference list 1

        # Only references for evidence 2 in case 1
        docref reference list 1 --evidence 2
    """
    from app.services.reference_service import ReferenceService

    db = get_session()
    try:
        svc = ReferenceService(db)
        if evidence_id is not None:
            refs = svc.list_references_by_evidence(case_id=case_id, evidence_id=evidence_id)
        else:
            refs = svc.list_references_by_case(case_id=case_id)

        table = Table(
            title=f"References — Case {case_id}"
            + (f" / Evidence {evidence_id}" if evidence_id else "")
        )
        table.add_column("Ref ID", style="cyan", no_wrap=True)
        table.add_column("Anchor ID")
        table.add_column("Placeholder")
        table.add_column("Evidence ID")
        table.add_column("Status")
        table.add_column("Note")
        for r in refs:
            table.add_row(
                str(r.id),
                str(r.anchor_id),
                r.anchor.placeholder_text if r.anchor else "-",
                str(r.evidence_id),
                r.status,
                r.note or "-",
            )
        console.print(table)
    except Exception as e:
        console.print(f"[red]Error:[/red] {e}")
        raise typer.Exit(1)
    finally:
        db.close()


@app.command("show")
def reference_show(
    reference_id: int = typer.Argument(..., help="Reference ID"),
) -> None:
    """Show details of a single reference.

    \b
    Example:
        docref reference show 1
    """
    from app.services.reference_service import ReferenceService

    db = get_session()
    try:
        svc = ReferenceService(db)
        ref = svc.get_reference(reference_id)
        anchor_text = ref.anchor.placeholder_text if ref.anchor else "-"
        console.print(
            Panel(
                f"Reference ID  : [cyan]{ref.id}[/cyan]\n"
                f"Anchor ID     : {ref.anchor_id}\n"
                f"Placeholder   : {anchor_text}\n"
                f"Evidence ID   : {ref.evidence_id}\n"
                f"Status        : {ref.status}\n"
                f"Note          : {ref.note or '-'}\n"
                f"Created At    : {ref.created_at}",
                title=f"Reference #{ref.id}",
                expand=False,
            )
        )
    except Exception as e:
        console.print(f"[red]Error:[/red] {e}")
        raise typer.Exit(1)
    finally:
        db.close()
