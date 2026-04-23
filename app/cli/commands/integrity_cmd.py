"""
app/cli/commands/integrity_cmd.py
===================================
CLI commands for Integrity checks.

Commands
--------
  check    – Run an integrity check on a case
  history  – Show integrity check history for a case
"""
import typer
from rich.console import Console
from rich.table import Table
from rich.panel import Panel

from app.cli.commands._db import get_session

app = typer.Typer()
console = Console()


@app.command("check")
def integrity_check(
    case_id: int = typer.Argument(..., help="Case ID"),
    verbose: bool = typer.Option(
        False, "--verbose", "-v", help="Show violation and warning details"
    ),
) -> None:
    """Run an integrity check on a case and display the report.

    \b
    Checks performed:
      - Unlinked anchors (placeholders with no active Reference)
      - References pointing to inactive Evidence
      - Missing SourceFile records or files on disk
      - Duplicate sort_order values within a party

    \b
    Example:
        docref integrity check 1
        docref integrity check 1 --verbose
    """
    from app.services.integrity_service import IntegrityService

    db = get_session()
    try:
        svc = IntegrityService(db)
        report = svc.run_integrity_check(case_id)

        if report.is_passed:
            console.print(
                Panel(
                    f"[green]✓ PASS[/green] — All integrity checks passed.\n"
                    f"  Violations : 0\n"
                    f"  Warnings   : {report.warning_count}",
                    title=f"Integrity Check — Case {case_id}",
                    border_style="green",
                    expand=False,
                )
            )
        else:
            console.print(
                Panel(
                    f"[red]✗ FAIL[/red] — {report.violation_count} violation(s) found.\n"
                    f"  Warnings   : {report.warning_count}",
                    title=f"Integrity Check — Case {case_id}",
                    border_style="red",
                    expand=False,
                )
            )

        if verbose or not report.is_passed:
            for v in report.violations or []:
                vtype = v.get("violation_type", "?") if isinstance(v, dict) else getattr(v, "violation_type", "?")
                vmsg = v.get("message", "") if isinstance(v, dict) else getattr(v, "message", "")
                console.print(f"  [red]✗[/red] [{vtype}] {vmsg}")

        if report.warnings:
            for w in report.warnings or []:
                wtype = w.get("warning_type", "?") if isinstance(w, dict) else getattr(w, "warning_type", "?")
                wmsg = w.get("message", "") if isinstance(w, dict) else getattr(w, "message", "")
                console.print(f"  [yellow]⚠[/yellow] [{wtype}] {wmsg}")

    except Exception as e:
        console.print(f"[red]Error:[/red] {e}")
        raise typer.Exit(1)
    finally:
        db.close()


@app.command("history")
def integrity_history(
    case_id: int = typer.Argument(..., help="Case ID"),
    limit: int = typer.Option(10, "--limit", "-n", help="Number of reports to show"),
) -> None:
    """Show the integrity check history for a case.

    \b
    Example:
        docref integrity history 1
        docref integrity history 1 --limit 5
    """
    from app.services.integrity_service import IntegrityService

    db = get_session()
    try:
        svc = IntegrityService(db)
        reports = svc.get_integrity_history(case_id=case_id, limit=limit)
        table = Table(title=f"Integrity History — Case {case_id}")
        table.add_column("ID", style="cyan", no_wrap=True)
        table.add_column("Result")
        table.add_column("Violations")
        table.add_column("Warnings")
        table.add_column("Checked At")
        for r in reports:
            result_str = (
                "[green]PASS[/green]" if r.is_passed else "[red]FAIL[/red]"
            )
            table.add_row(
                str(r.id),
                result_str,
                str(r.violation_count),
                str(r.warning_count),
                str(r.checked_at)[:19],
            )
        console.print(table)
    except Exception as e:
        console.print(f"[red]Error:[/red] {e}")
        raise typer.Exit(1)
    finally:
        db.close()
