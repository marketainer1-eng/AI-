"""
app/cli/commands/workflow_cmd.py
=================================
Thin CLI layer for high-level workflow commands.

This module contains ONLY:
- Typer command definitions
- Input parameter declarations
- Calls to WorkflowDemoService
- Rich output rendering
- Exit-code handling

All orchestration logic lives in ``app/services/workflow_demo_service.py``.
DB session rollback on failure is guaranteed by ``WorkflowDemoService.run_demo()``
internally; this CLI layer only needs to close the session.

Commands
--------
  demo   – Run a complete end-to-end demo with a sample DOCX file
  status – Show a summary of a case's current workflow state
"""

from __future__ import annotations

import typer
from rich.console import Console
from rich.panel import Panel
from rich.rule import Rule
from rich.table import Table

from app.cli.commands._db import get_session

app = typer.Typer()
console = Console()


# ══════════════════════════════════════════════════════════════════════════════
#  workflow demo
# ══════════════════════════════════════════════════════════════════════════════

@app.command("demo")
def workflow_demo(
    case_name: str = typer.Option(
        "손해배상 청구 데모",
        "--name",
        "-n",
        help="Case name for the demo",
    ),
    court: str = typer.Option(
        "서울중앙지방법원",
        "--court",
        "-c",
        help="Court name",
    ),
    case_number: str = typer.Option(
        "2024가합99999",
        "--case-number",
        help="Court case number",
    ),
    skip_export: bool = typer.Option(
        False,
        "--skip-export",
        help="Skip the export step (useful when export dir is not writable)",
    ),
) -> None:
    """Run a complete end-to-end workflow demo.

    Steps executed in order:
      1.  Create a case
      2.  Upload a demo DOCX file (role=document)
      3.  Upload two evidence attachments (role=evidence_attachment)
      4.  Register the DOCX as a Document
      5.  Parse placeholders → extract DocumentAnchors
      6.  Create two Evidence records (갑 제1·2호증)
      7.  Link each anchor to the corresponding Evidence (References)
      8.  Render baseline preview (evidence list + file rename plan)
      9.  Run integrity check
      10. Create a reorder ChangeSet (swap evidence order)
      11. Preview the ChangeSet
      12. Commit the ChangeSet
      13. (optional) Export case artifacts

    \\b
    Requires:
        pip install python-docx

    \\b
    Example:
        docref workflow demo
        docref workflow demo --name "계약 분쟁" --skip-export
    """
    from app.services.workflow_demo_service import WorkflowDemoService

    db = get_session()
    try:
        # WorkflowDemoService.run_demo() guarantees DB rollback on exception
        svc = WorkflowDemoService(db)
        result = svc.run_demo(
            case_name=case_name,
            court=court,
            case_number=case_number,
            skip_export=skip_export,
        )
    except Exception as exc:
        # Session already rolled back by the service; just report and exit
        console.print(f"[red]Demo failed:[/red] {exc}")
        raise typer.Exit(1)
    finally:
        db.close()

    # ── Render step results ──────────────────────────────────────────────────
    for step in result.steps:
        icon = "[green]✓[/green]" if step.success else "[yellow]⚠[/yellow]"
        console.print(Rule(f"[bold cyan]Step {step.step}[/bold cyan] — {step.title}"))
        console.print(f"  {icon} {step.message}")

    # ── Baseline evidence list ───────────────────────────────────────────────
    if result.baseline_preview_rows:
        base_table = Table(title="Evidence List (baseline)")
        base_table.add_column("Rendered Number", style="cyan")
        base_table.add_column("Label")
        for row in result.baseline_preview_rows:
            base_table.add_row(row.rendered_number, row.rendered_label)
        console.print(base_table)

    # ── Reordered evidence list preview ─────────────────────────────────────
    if result.evidence_preview_rows:
        preview_table = Table(title="Evidence List After Reorder (preview)")
        preview_table.add_column("Rendered Number", style="cyan")
        preview_table.add_column("Label")
        for row in result.evidence_preview_rows:
            preview_table.add_row(row.rendered_number, row.rendered_label)
        console.print(preview_table)

    # ── Summary panel ────────────────────────────────────────────────────────
    integrity_label = "PASS" if result.integrity_passed else "FAIL"
    export_detail = (
        "skipped"
        if result.export_skipped
        else (result.export_path or "n/a")
    )

    console.print(
        Panel(
            f"[green]✓ Demo workflow complete![/green]\n\n"
            f"  Case ID     : [cyan]{result.case_id}[/cyan]\n"
            f"  Anchors     : {result.anchor_count}\n"
            f"  Evidences   : {result.evidence_count}\n"
            f"  References  : {result.reference_count}\n"
            f"  Integrity   : {integrity_label}\n"
            f"  Version     : {result.version_label or 'n/a'}\n"
            f"  Files renamed: {result.files_renamed}\n"
            f"  Export      : {export_detail}\n\n"
            f"[dim]Explore:[/dim]\n"
            f"  docref case show {result.case_id}\n"
            f"  docref evidence list {result.case_id}\n"
            f"  docref render preview {result.case_id}\n"
            f"  docref integrity history {result.case_id}",
            title="Demo Complete",
            border_style="green",
            expand=False,
        )
    )


# ══════════════════════════════════════════════════════════════════════════════
#  workflow status
# ══════════════════════════════════════════════════════════════════════════════

@app.command("status")
def workflow_status(
    case_id: int = typer.Argument(..., help="Case ID"),
) -> None:
    """Show a comprehensive workflow status summary for a case.

    Displays counts for files, documents, evidences, references,
    change sets, and the latest integrity check result.

    \\b
    Example:
        docref workflow status 1
    """
    from app.services.workflow_demo_service import WorkflowDemoService
    from app.core.exceptions import CaseNotFoundError

    db = get_session()
    try:
        svc = WorkflowDemoService(db)
        status = svc.get_status(case_id)
    except CaseNotFoundError as exc:
        console.print(f"[red]{exc}[/red]")
        raise typer.Exit(1)
    except Exception as exc:
        console.print(f"[red]Error:[/red] {exc}")
        raise typer.Exit(1)
    finally:
        db.close()

    # ── Integrity label ──────────────────────────────────────────────────────
    if status.latest_integrity_passed is None:
        integrity_str = "[dim]not run[/dim]"
    elif status.latest_integrity_passed:
        integrity_str = "[green]PASS[/green]"
    else:
        integrity_str = (
            f"[red]FAIL[/red] ({status.latest_integrity_violations} violation(s))"
        )

    # ── Render panel ─────────────────────────────────────────────────────────
    console.print(
        Panel(
            f"Case        : [bold]{status.case_name}[/bold] (id=[cyan]{status.case_id}[/cyan])\n"
            f"Status      : {status.case_status}\n"
            f"Court       : {status.court or '-'}\n"
            f"Case Number : {status.case_number or '-'}\n"
            f"\n"
            f"[bold]Files[/bold]\n"
            f"  Total     : {status.total_files}\n"
            f"  Documents : {status.document_files}\n"
            f"  Evidence  : {status.evidence_files}\n"
            f"\n"
            f"[bold]Documents[/bold]\n"
            f"  Registered: {status.total_documents}\n"
            f"\n"
            f"[bold]Evidences[/bold]\n"
            f"  Total     : {status.total_evidences}\n"
            f"  Active    : {status.active_evidences}\n"
            f"\n"
            f"[bold]References[/bold]\n"
            f"  Active    : {status.active_references}\n"
            f"\n"
            f"[bold]Change Sets[/bold]\n"
            f"  Total     : {status.total_changesets}\n"
            f"  Committed : {status.committed_changesets}\n"
            f"\n"
            f"[bold]Latest Integrity Check[/bold]\n"
            f"  Result    : {integrity_str}",
            title=f"Workflow Status — Case {case_id}",
            expand=False,
        )
    )
