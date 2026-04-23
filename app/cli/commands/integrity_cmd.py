import typer
from rich.console import Console

app = typer.Typer()
console = Console()


@app.command("check")
def integrity_check(
    case_id: int = typer.Argument(..., help="Case ID"),
) -> None:
    """Run an integrity check on a case and display the report."""
    from app.cli.commands._db import get_session
    from app.services.integrity_service import IntegrityService

    db = get_session()
    try:
        svc = IntegrityService(db)
        report = svc.run_integrity_check(case_id)

        if report.is_passed:
            console.print(f"[green]PASS[/green] — Integrity check passed for case {case_id}")
        else:
            console.print(
                f"[red]FAIL[/red] — {report.violation_count} violation(s) found in case {case_id}"
            )
            for v in report.violations:
                console.print(f"  [red]✗[/red] [{v['violation_type']}] {v['message']}")

        if report.warnings:
            console.print(f"\n[yellow]Warnings:[/yellow] {report.warning_count}")
            for w in report.warnings:
                console.print(f"  [yellow]⚠[/yellow] [{w['warning_type']}] {w['message']}")
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
    """Show the integrity check history for a case."""
    from app.cli.commands._db import get_session
    from app.services.integrity_service import IntegrityService
    from rich.table import Table

    db = get_session()
    try:
        svc = IntegrityService(db)
        reports = svc.get_integrity_history(case_id=case_id, limit=limit)
        table = Table(title=f"Integrity History — Case {case_id}")
        table.add_column("ID", style="cyan")
        table.add_column("Result")
        table.add_column("Violations")
        table.add_column("Warnings")
        table.add_column("Checked At")
        for r in reports:
            result_str = "[green]PASS[/green]" if r.is_passed else "[red]FAIL[/red]"
            table.add_row(
                str(r.id),
                result_str,
                str(r.violation_count),
                str(r.warning_count),
                str(r.checked_at),
            )
        console.print(table)
    except Exception as e:
        console.print(f"[red]Error:[/red] {e}")
        raise typer.Exit(1)
    finally:
        db.close()
