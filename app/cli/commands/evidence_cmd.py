"""
app/cli/commands/evidence_cmd.py
=================================
CLI commands for Evidence management.

Commands
--------
  create   – Create a new evidence record
  list     – List evidences for a case
  show     – Show a single evidence in detail
  update   – Update evidence fields
  delete   – Soft-delete (deactivate) an evidence
  files    – List file links attached to an evidence
"""
import typer
from rich.console import Console
from rich.table import Table
from rich.panel import Panel

from app.cli.commands._db import get_session

app = typer.Typer()
console = Console()


@app.command("create")
def evidence_create(
    case_id: int = typer.Argument(..., help="Case ID"),
    label: str = typer.Argument(..., help="Evidence label, e.g. '계약서 사본'"),
    party: str = typer.Option(
        "plaintiff",
        "--party",
        "-p",
        help="Party: plaintiff (갑) | defendant (을)",
    ),
    description: str = typer.Option(None, "--description", "-d", help="Optional description"),
    sort_order: int = typer.Option(0, "--order", "-o", help="Sort order (0 = auto-append)"),
    file_ids: str = typer.Option(
        None,
        "--files",
        "-f",
        help="Comma-separated SourceFile IDs to attach, e.g. '1,2,3'",
    ),
) -> None:
    """Create a new evidence record.

    \b
    Example:
        # 갑 제1호증: 계약서 사본 (files: 3, 4)
        docref evidence create 1 "계약서 사본" \\
            --party plaintiff --order 1 --files "3,4"

        # 을 제1호증: 답변서
        docref evidence create 1 "답변서" --party defendant --order 1
    """
    from app.services.evidence_service import EvidenceService
    from app.api.schemas.evidence import EvidenceCreate

    source_file_ids = [int(x.strip()) for x in file_ids.split(",")] if file_ids else []

    db = get_session()
    try:
        svc = EvidenceService(db)
        e = svc.create_evidence(
            case_id=case_id,
            data=EvidenceCreate(
                party=party,
                label=label,
                description=description,
                sort_order=sort_order,
                source_file_ids=source_file_ids,
            ),
        )
        party_label = "갑" if e.party == "plaintiff" else "을"
        console.print(
            Panel(
                f"[green]✓ Evidence created[/green]\n"
                f"  ID         : [cyan]{e.id}[/cyan]\n"
                f"  Party      : {party_label} ({e.party})\n"
                f"  Sort Order : {e.sort_order}\n"
                f"  Label      : {e.label}\n"
                f"  Files      : {len(source_file_ids)} attached",
                title="New Evidence",
                expand=False,
            )
        )
    except Exception as e_:
        console.print(f"[red]Error:[/red] {e_}")
        raise typer.Exit(1)
    finally:
        db.close()


@app.command("list")
def evidence_list(
    case_id: int = typer.Argument(..., help="Case ID"),
    party: str = typer.Option(None, "--party", "-p", help="Filter: plaintiff | defendant"),
) -> None:
    """List evidences for a case.

    \b
    Example:
        docref evidence list 1
        docref evidence list 1 --party plaintiff
        docref evidence list 1 --party defendant
    """
    from app.services.evidence_service import EvidenceService

    db = get_session()
    try:
        svc = EvidenceService(db)
        items, total = svc.list_evidences(case_id=case_id, party=party)
        table = Table(title=f"Evidences — Case {case_id} (total={total})")
        table.add_column("ID", style="cyan", no_wrap=True)
        table.add_column("Party")
        table.add_column("Sort Order")
        table.add_column("Label")
        table.add_column("Active")
        for e in items:
            party_label = "갑" if e.party == "plaintiff" else "을"
            table.add_row(
                str(e.id),
                f"{party_label} ({e.party})",
                str(e.sort_order),
                e.label,
                "[green]✓[/green]" if e.is_active else "[red]✗[/red]",
            )
        console.print(table)
    except Exception as e_:
        console.print(f"[red]Error:[/red] {e_}")
        raise typer.Exit(1)
    finally:
        db.close()


@app.command("show")
def evidence_show(
    case_id: int = typer.Argument(..., help="Case ID"),
    evidence_id: int = typer.Argument(..., help="Evidence ID"),
) -> None:
    """Show details of a single evidence record.

    \b
    Example:
        docref evidence show 1 2
    """
    from app.services.evidence_service import EvidenceService

    db = get_session()
    try:
        svc = EvidenceService(db)
        e = svc.get_evidence(case_id=case_id, evidence_id=evidence_id)
        party_label = "갑" if e.party == "plaintiff" else "을"
        console.print(
            Panel(
                f"ID          : [cyan]{e.id}[/cyan]\n"
                f"Party       : {party_label} ({e.party})\n"
                f"Sort Order  : {e.sort_order}\n"
                f"Label       : [bold]{e.label}[/bold]\n"
                f"Description : {e.description or '-'}\n"
                f"Active      : {'[green]Yes[/green]' if e.is_active else '[red]No[/red]'}\n"
                f"Created At  : {e.created_at}",
                title=f"Evidence #{e.id} — Case {case_id}",
                expand=False,
            )
        )
    except Exception as e_:
        console.print(f"[red]Error:[/red] {e_}")
        raise typer.Exit(1)
    finally:
        db.close()


@app.command("update")
def evidence_update(
    case_id: int = typer.Argument(..., help="Case ID"),
    evidence_id: int = typer.Argument(..., help="Evidence ID"),
    label: str = typer.Option(None, "--label", "-l", help="New label"),
    description: str = typer.Option(None, "--description", "-d", help="New description"),
    sort_order: int = typer.Option(None, "--order", "-o", help="New sort order"),
    is_active: bool = typer.Option(None, "--active/--inactive", help="Toggle active status"),
) -> None:
    """Update evidence fields (only supplied options are changed).

    \b
    Example:
        docref evidence update 1 2 --label "수정된 계약서"
        docref evidence update 1 2 --order 3
        docref evidence update 1 2 --inactive
    """
    from app.services.evidence_service import EvidenceService
    from app.api.schemas.evidence import EvidenceUpdate

    db = get_session()
    try:
        svc = EvidenceService(db)
        data = EvidenceUpdate(
            label=label,
            description=description,
            sort_order=sort_order,
            is_active=is_active,
        )
        e = svc.update_evidence(case_id=case_id, evidence_id=evidence_id, data=data)
        console.print(
            f"[green]✓ Evidence {evidence_id} updated[/green] "
            f"label={e.label!r} sort_order={e.sort_order} active={e.is_active}"
        )
    except Exception as e_:
        console.print(f"[red]Error:[/red] {e_}")
        raise typer.Exit(1)
    finally:
        db.close()


@app.command("delete")
def evidence_delete(
    case_id: int = typer.Argument(..., help="Case ID"),
    evidence_id: int = typer.Argument(..., help="Evidence ID"),
    force: bool = typer.Option(False, "--force", "-f", help="Skip confirmation"),
) -> None:
    """Soft-delete (deactivate) an evidence record.

    \b
    Example:
        docref evidence delete 1 2
        docref evidence delete 1 2 --force
    """
    from app.services.evidence_service import EvidenceService

    if not force:
        confirm = typer.confirm(
            f"Deactivate evidence {evidence_id} in case {case_id}? "
            "This will mark it as inactive."
        )
        if not confirm:
            console.print("Aborted.")
            raise typer.Exit(0)

    db = get_session()
    try:
        svc = EvidenceService(db)
        svc.delete_evidence(case_id=case_id, evidence_id=evidence_id)
        console.print(
            f"[green]✓ Evidence {evidence_id} deactivated[/green] (soft delete)"
        )
    except Exception as e_:
        console.print(f"[red]Error:[/red] {e_}")
        raise typer.Exit(1)
    finally:
        db.close()


@app.command("files")
def evidence_files(
    case_id: int = typer.Argument(..., help="Case ID"),
    evidence_id: int = typer.Argument(..., help="Evidence ID"),
) -> None:
    """List file links attached to an evidence.

    \b
    Example:
        docref evidence files 1 2
    """
    from app.services.evidence_service import EvidenceService

    db = get_session()
    try:
        svc = EvidenceService(db)
        # Fetch the evidence (validates existence) then access file_links
        e = svc.get_evidence(case_id=case_id, evidence_id=evidence_id)
        links = e.file_links  # ORM relationship
        table = Table(title=f"File Links — Evidence #{evidence_id}")
        table.add_column("Link ID", style="cyan")
        table.add_column("File ID", style="cyan")
        table.add_column("Original Filename")
        table.add_column("File Order")
        for lk in links:
            sf = lk.source_file
            table.add_row(
                str(lk.id),
                str(lk.source_file_id),
                sf.original_filename if sf else "-",
                str(lk.file_order),
            )
        console.print(table)
    except Exception as e_:
        console.print(f"[red]Error:[/red] {e_}")
        raise typer.Exit(1)
    finally:
        db.close()
