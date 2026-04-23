from pathlib import Path
import typer
from rich.console import Console
from rich.table import Table

app = typer.Typer()
console = Console()


@app.command("upload")
def file_upload(
    case_id: int = typer.Argument(..., help="Case ID"),
    file_path: Path = typer.Argument(..., help="Path to the file to upload", exists=True),
    role: str = typer.Option(
        "unknown",
        "--role",
        "-r",
        help="File role: evidence_attachment | document | unknown",
    ),
) -> None:
    """Upload a file to a case."""
    from app.cli.commands._db import get_session
    from app.services.file_service import FileService
    from fastapi import UploadFile
    import io

    db = get_session()
    try:
        svc = FileService(db)
        content = file_path.read_bytes()

        class _FakeUpload:
            filename = file_path.name
            content_type = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            file = io.BytesIO(content)

            def read(self, size=-1):
                return self.file.read(size)

        sf = svc.upload_file(case_id=case_id, upload=_FakeUpload(), role=role)  # type: ignore
        console.print(
            f"[green]File uploaded[/green] id={sf.id} stored={sf.stored_filename!r}"
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
    """List all files for a case."""
    from app.cli.commands._db import get_session
    from app.services.file_service import FileService

    db = get_session()
    try:
        svc = FileService(db)
        files = svc.list_files(case_id)
        table = Table(title=f"Files — Case {case_id}")
        table.add_column("ID", style="cyan")
        table.add_column("Original Filename")
        table.add_column("Role")
        table.add_column("Size (bytes)")
        for f in files:
            table.add_row(
                str(f.id),
                f.original_filename,
                f.role,
                str(f.file_size_bytes or "-"),
            )
        console.print(table)
    except Exception as e:
        console.print(f"[red]Error:[/red] {e}")
        raise typer.Exit(1)
    finally:
        db.close()
