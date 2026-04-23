"""
app/cli/commands/case_cmd.py
============================
CLI commands for Case management.

Commands
--------
  create   – Create a new case
  list     – List all cases (paginated)
  show     – Show case details
  update   – Update case fields
  audit    – Show audit log for a case
"""
import typer
from rich.console import Console
from rich.table import Table
from rich.panel import Panel

from app.cli.commands._db import get_session
from app.api.schemas.case import CaseCreate, CaseUpdate
from app.services.case_service import CaseService
from app.services.audit_service import AuditService
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
    """Create a new case.

    \b
    Example:
        docref case create "손해배상 청구" \\
            --court "서울중앙지방법원" \\
            --case-number "2024가합12345" \\
            --description "2024년 계약 분쟁 사건"
    """
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
        console.print(
            Panel(
                f"[green]✓ Case created[/green]\n"
                f"  ID          : [cyan]{case.id}[/cyan]\n"
                f"  Name        : {case.name}\n"
                f"  Court       : {case.court or '-'}\n"
                f"  Case Number : {case.case_number or '-'}\n"
                f"  Status      : {case.status}",
                title="New Case",
                expand=False,
            )
        )
    except Exception as e:
        console.print(f"[red]Error:[/red] {e}")
        raise typer.Exit(1)
    finally:
        db.close()


@app.command("list")
def case_list(
    skip: int = typer.Option(0, "--skip", "-s", help="Number of records to skip"),
    limit: int = typer.Option(50, "--limit", "-l", help="Maximum records to return"),
) -> None:
    """List all cases.

    \b
    Example:
        docref case list
        docref case list --limit 10 --skip 0
    """
    db = get_session()
    try:
        svc = CaseService(db)
        cases, total = svc.list_cases(skip=skip, limit=limit)
        table = Table(title=f"Cases (total={total})")
        table.add_column("ID", style="cyan", no_wrap=True)
        table.add_column("Name")
        table.add_column("Court")
        table.add_column("Case Number")
        table.add_column("Status")
        table.add_column("Created At")
        for c in cases:
            table.add_row(
                str(c.id),
                c.name,
                c.court or "-",
                c.case_number or "-",
                c.status,
                str(c.created_at)[:19],
            )
        console.print(table)
    except Exception as e:
        console.print(f"[red]Error:[/red] {e}")
        raise typer.Exit(1)
    finally:
        db.close()


@app.command("show")
def case_show(
    case_id: int = typer.Argument(..., help="Case ID"),
) -> None:
    """Show case details.

    \b
    Example:
        docref case show 1
    """
    db = get_session()
    try:
        svc = CaseService(db)
        case = svc.get_case(case_id)
        console.print(
            Panel(
                f"ID          : [cyan]{case.id}[/cyan]\n"
                f"Name        : [bold]{case.name}[/bold]\n"
                f"Court       : {case.court or '-'}\n"
                f"Case Number : {case.case_number or '-'}\n"
                f"Description : {case.description or '-'}\n"
                f"Status      : {case.status}\n"
                f"Created At  : {case.created_at}",
                title=f"Case #{case.id}",
                expand=False,
            )
        )
    except CaseNotFoundError as e:
        console.print(f"[red]{e}[/red]")
        raise typer.Exit(1)
    finally:
        db.close()


@app.command("update")
def case_update(
    case_id: int = typer.Argument(..., help="Case ID"),
    name: str = typer.Option(None, "--name", "-n", help="New case name"),
    court: str = typer.Option(None, "--court", "-c", help="New court name"),
    case_number: str = typer.Option(None, "--case-number", help="New case number"),
    description: str = typer.Option(None, "--description", "-d", help="New description"),
    status: str = typer.Option(
        None, "--status", "-s", help="New status: active | closed | archived"
    ),
) -> None:
    """Update case fields (only supplied options are changed).

    \b
    Example:
        docref case update 1 --status closed
        docref case update 1 --name "수정된 사건명" --court "부산지방법원"
    """
    db = get_session()
    try:
        svc = CaseService(db)
        data = CaseUpdate(
            name=name,
            court=court,
            case_number=case_number,
            description=description,
            status=status,
        )
        case = svc.update_case(case_id, data)
        console.print(
            f"[green]✓ Case {case_id} updated[/green] "
            f"name={case.name!r} status={case.status}"
        )
    except CaseNotFoundError as e:
        console.print(f"[red]{e}[/red]")
        raise typer.Exit(1)
    except Exception as e:
        console.print(f"[red]Error:[/red] {e}")
        raise typer.Exit(1)
    finally:
        db.close()


@app.command("audit")
def case_audit(
    case_id: int = typer.Argument(..., help="Case ID"),
    limit: int = typer.Option(20, "--limit", "-n", help="Number of log entries to display"),
    action: str = typer.Option(None, "--action", "-a", help="Filter by action name"),
) -> None:
    """Display the audit log for a case.

    \b
    Example:
        docref case audit 1
        docref case audit 1 --limit 5
        docref case audit 1 --action evidence_created
    """
    db = get_session()
    try:
        svc = AuditService(db)
        logs, total = svc.get_audit_logs(
            case_id=case_id, skip=0, limit=limit, action_filter=action
        )
        table = Table(title=f"Audit Log — Case {case_id} (total={total})")
        table.add_column("ID", style="cyan", no_wrap=True)
        table.add_column("Action")
        table.add_column("Entity Type")
        table.add_column("Entity ID")
        table.add_column("Details")
        table.add_column("Created At")
        for lg in logs:
            details = str(lg.details or "")[:60]
            table.add_row(
                str(lg.id),
                lg.action,
                lg.entity_type or "-",
                str(lg.entity_id) if lg.entity_id else "-",
                details,
                str(lg.created_at)[:19],
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
