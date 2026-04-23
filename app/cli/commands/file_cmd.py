"""
app/cli/commands/file_cmd.py
============================
CLI commands for SourceFile management.

Commands
--------
  upload   – Upload a file to a case
  list     – List all files for a case
  show     – Show details of a single file
  role     – Update the role of a file
"""
from pathlib import Path
import typer
from rich.console import Console
from rich.table import Table
from rich.panel import Panel

from app.cli.commands._db import get_session

app = typer.Typer()
console = Console()

_VALID_ROLES = ("evidence_attachment", "document", "unknown")


@app.command("upload")
def file_upload(
    case_id: int = typer.Argument(..., help="Case ID"),
    file_path: Path = typer.Argument(..., help="Local path of the file to upload"),
    role: str = typer.Option(
        "unknown",
        "--role",
        "-r",
        help="File role: evidence_attachment | document | unknown",
    ),
) -> None:
    """Upload a file to a case.

    \b
    Example:
        # Upload a DOCX as a legal brief document
        docref file upload 1 ./brief.docx --role document

        # Upload a PDF as an evidence attachment
        docref file upload 1 ./contract.pdf --role evidence_attachment
    """
    if not file_path.exists():
        console.print(f"[red]File not found:[/red] {file_path}")
        raise typer.Exit(1)

    if role not in _VALID_ROLES:
        console.print(
            f"[red]Invalid role '{role}'.[/red] "
            f"Choose from: {', '.join(_VALID_ROLES)}"
        )
        raise typer.Exit(1)

    from app.services.file_service import FileService
    import io

    db = get_session()
    try:
        svc = FileService(db)
        content = file_path.read_bytes()

        # Detect MIME type from extension
        suffix = file_path.suffix.lower()
        mime_map = {
            ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            ".pdf": "application/pdf",
            ".doc": "application/msword",
            ".txt": "text/plain",
            ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            ".hwp": "application/x-hwp",
        }
        content_type = mime_map.get(suffix, "application/octet-stream")

        class _FakeUpload:
            filename = file_path.name
            file = io.BytesIO(content)
            size = len(content)

            def read(self, n: int = -1) -> bytes:
                return self.file.read(n)

        sf = svc.upload_file(case_id=case_id, upload=_FakeUpload(), role=role)  # type: ignore
        console.print(
            Panel(
                f"[green]✓ File uploaded[/green]\n"
                f"  ID              : [cyan]{sf.id}[/cyan]\n"
                f"  Original Name   : {sf.original_filename}\n"
                f"  Stored Name     : {sf.stored_filename}\n"
                f"  Role            : {sf.role}\n"
                f"  Size (bytes)    : {sf.file_size_bytes or '-'}\n"
                f"  MIME            : {sf.mime_type or '-'}",
                title="Uploaded File",
                expand=False,
            )
        )
    except Exception as e:
        console.print(f"[red]Error:[/red] {e}")
        raise typer.Exit(1)
    finally:
        db.close()


@app.command("list")
def file_list(
    case_id: int = typer.Argument(..., help="Case ID"),
) -> None:
    """List all files for a case.

    \b
    Example:
        docref file list 1
    """
    from app.services.file_service import FileService

    db = get_session()
    try:
        svc = FileService(db)
        files, total = svc.list_files(case_id)
        table = Table(title=f"Files — Case {case_id} (total={total})")
        table.add_column("ID", style="cyan", no_wrap=True)
        table.add_column("Original Filename")
        table.add_column("Role")
        table.add_column("Size (bytes)")
        table.add_column("MIME Type")
        table.add_column("Uploaded At")
        for f in files:
            table.add_row(
                str(f.id),
                f.original_filename,
                f.role,
                str(f.file_size_bytes or "-"),
                f.mime_type or "-",
                str(f.created_at)[:19],
            )
        console.print(table)
    except Exception as e:
        console.print(f"[red]Error:[/red] {e}")
        raise typer.Exit(1)
    finally:
        db.close()


@app.command("show")
def file_show(
    case_id: int = typer.Argument(..., help="Case ID"),
    file_id: int = typer.Argument(..., help="File ID"),
) -> None:
    """Show details of a single file.

    \b
    Example:
        docref file show 1 2
    """
    from app.services.file_service import FileService

    db = get_session()
    try:
        svc = FileService(db)
        f = svc.get_file(case_id, file_id)
        console.print(
            Panel(
                f"ID              : [cyan]{f.id}[/cyan]\n"
                f"Original Name   : {f.original_filename}\n"
                f"Stored Name     : {f.stored_filename}\n"
                f"Storage Path    : {f.storage_path}\n"
                f"Role            : {f.role}\n"
                f"Size (bytes)    : {f.file_size_bytes or '-'}\n"
                f"MIME Type       : {f.mime_type or '-'}\n"
                f"Hash (SHA-256)  : {f.file_hash or '-'}\n"
                f"Uploaded At     : {f.created_at}",
                title=f"File #{f.id} — Case {case_id}",
                expand=False,
            )
        )
    except Exception as e:
        console.print(f"[red]Error:[/red] {e}")
        raise typer.Exit(1)
    finally:
        db.close()


@app.command("role")
def file_role(
    case_id: int = typer.Argument(..., help="Case ID"),
    file_id: int = typer.Argument(..., help="File ID"),
    role: str = typer.Argument(
        ...,
        help="New role: evidence_attachment | document | unknown",
    ),
) -> None:
    """Update the role of an uploaded file.

    \b
    Example:
        docref file role 1 2 document
        docref file role 1 3 evidence_attachment
    """
    if role not in _VALID_ROLES:
        console.print(
            f"[red]Invalid role '{role}'.[/red] "
            f"Choose from: {', '.join(_VALID_ROLES)}"
        )
        raise typer.Exit(1)

    from app.services.file_service import FileService

    db = get_session()
    try:
        svc = FileService(db)
        f = svc.update_role(case_id=case_id, file_id=file_id, role=role)
        console.print(
            f"[green]✓ File {file_id} role updated[/green] → {f.role}"
        )
    except Exception as e:
        console.print(f"[red]Error:[/red] {e}")
        raise typer.Exit(1)
    finally:
        db.close()
