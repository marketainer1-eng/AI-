import typer
from rich.console import Console
from rich.table import Table

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
    description: str = typer.Option(None, "--description", "-d"),
    sort_order: int = typer.Option(0, "--order", "-o", help="Sort order (0=auto-append)"),
    file_ids: str = typer.Option(
        None,
        "--files",
        "-f",
        help="Comma-separated SourceFile IDs to attach, e.g. '1,2,3'",
    ),
) -> None:
    """Create a new evidence record."""
    from app.cli.commands._db import get_session
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
        console.print(f"[green]Evidence created[/green] id={e.id} label={e.label!r} sort_order={e.sort_order}")
    except Exception as e_:
        console.print(f"[red]Error:[/red] {e_}")
        raise typer.Exit(1)
    finally:
        db.close()


@app.command("list")
def evidence_list(
    case_id: int = typer.Argument(..., help="Case ID"),
    party: str = typer.Option(None, "--party", "-p", help="Filter by party"),
) -> None:
    """List evidences for a case."""
    from app.cli.commands._db import get_session
    from app.services.evidence_service import EvidenceService

    db = get_session()
    try:
        svc = EvidenceService(db)
        items = svc.list_evidences(case_id=case_id, party=party)
        table = Table(title=f"Evidences — Case {case_id}")
        table.add_column("ID", style="cyan")
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
                "✓" if e.is_active else "✗",
            )
        console.print(table)
    except Exception as e_:
        console.print(f"[red]Error:[/red] {e_}")
        raise typer.Exit(1)
    finally:
        db.close()
