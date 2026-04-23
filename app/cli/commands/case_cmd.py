import typer
from rich.console import Console
from rich.table import Table
from app.cli.commands._db import get_session
from app.api.schemas.case import CaseCreate, CaseUpdate
from app.services.case_service import CaseService
from app.core.exceptions import CaseNotFoundError

app = typer.Typer()
console = Console()


@app.command("create")
def case_create(
    name: str = typer.Argument(..., help="Case name"),
    court: str = typer.Option(None, "--court", "-c", help="Court name"),
    case_number: str = typer.Option(None, "--case-number", "-n", help="Court case number"),
    description: str = typer.Option(None, "--description", "-d", help="Description"),
) -> None:
    """Create a new case."""
    db = get_session()
    try:
        svc = CaseService(db)
        case = svc.create_case(
            CaseCreate(
                name=name,
                court=court,
                case_number=case_number,
                description=description,
            )
        )
        console.print(f"[green]Case created[/green] id={case.id} name={case.name!r}")
    except Exception as e:
        console.print(f"[red]Error:[/red] {e}")
        raise typer.Exit(1)
    finally:
        db.close()


@app.command("list")
def case_list() -> None:
    """List all cases."""
    db = get_session()
    try:
        svc = CaseService(db)
        cases = svc.list_cases()
        table = Table(title="Cases")
        table.add_column("ID", style="cyan")
        table.add_column("Name")
        table.add_column("Court")
        table.add_column("Case Number")
        table.add_column("Status")
        for c in cases:
            table.add_row(
                str(c.id), c.name, c.court or "-", c.case_number or "-", c.status
            )
        console.print(table)
    finally:
        db.close()


@app.command("show")
def case_show(
    case_id: int = typer.Argument(..., help="Case ID"),
) -> None:
    """Show case details."""
    db = get_session()
    try:
        svc = CaseService(db)
        case = svc.get_case(case_id)
        console.print(f"ID:          {case.id}")
        console.print(f"Name:        {case.name}")
        console.print(f"Court:       {case.court or '-'}")
        console.print(f"Case Number: {case.case_number or '-'}")
        console.print(f"Status:      {case.status}")
        console.print(f"Created:     {case.created_at}")
    except CaseNotFoundError as e:
        console.print(f"[red]{e}[/red]")
        raise typer.Exit(1)
    finally:
        db.close()
