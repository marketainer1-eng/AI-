import typer
from rich.console import Console
from rich.table import Table

app = typer.Typer()
console = Console()


@app.command("register")
def document_register(
    case_id: int = typer.Argument(..., help="Case ID"),
    source_file_id: int = typer.Argument(..., help="SourceFile ID of the DOCX"),
    title: str = typer.Argument(..., help="Document title"),
    doc_type: str = typer.Option(
        "main_brief",
        "--type",
        "-t",
        help="Document type: main_brief | exhibit_list | other",
    ),
) -> None:
    """Register a DOCX source file as a Document."""
    from app.cli.commands._db import get_session
    from app.services.document_service import DocumentService
    from app.api.schemas.document import DocumentCreate

    db = get_session()
    try:
        svc = DocumentService(db)
        doc = svc.register_document(
            case_id=case_id,
            data=DocumentCreate(
                source_file_id=source_file_id,
                title=title,
                doc_type=doc_type,
            ),
        )
        console.print(
            f"[green]Document registered[/green] id={doc.id} title={doc.title!r}"
        )
    except Exception as e:
        console.print(f"[red]Error:[/red] {e}")
        raise typer.Exit(1)
    finally:
        db.close()


@app.command("parse")
def document_parse(
    case_id: int = typer.Argument(..., help="Case ID"),
    document_id: int = typer.Argument(..., help="Document ID to parse"),
) -> None:
    """Parse a Document DOCX and extract placeholder anchors."""
    from app.cli.commands._db import get_session
    from app.services.document_service import DocumentService

    db = get_session()
    try:
        svc = DocumentService(db)
        result = svc.parse_placeholders(case_id=case_id, document_id=document_id)
        console.print(
            f"[green]Parsed[/green] {result.anchors_found} anchors found in document {document_id}"
        )
        table = Table(title="Anchors")
        table.add_column("ID", style="cyan")
        table.add_column("Placeholder")
        table.add_column("Para #")
        table.add_column("Status")
        for a in result.anchors:
            table.add_row(
                str(a.id),
                a.placeholder_text,
                str(a.paragraph_index or "-"),
                a.status,
            )
        console.print(table)
    except Exception as e:
        console.print(f"[red]Error:[/red] {e}")
        raise typer.Exit(1)
    finally:
        db.close()


@app.command("list")
def document_list(
    case_id: int = typer.Argument(..., help="Case ID"),
) -> None:
    """List documents for a case."""
    from app.cli.commands._db import get_session
    from app.services.document_service import DocumentService

    db = get_session()
    try:
        svc = DocumentService(db)
        docs, total = svc.list_documents(case_id)
        table = Table(title=f"Documents — Case {case_id} (total={total})")
        table.add_column("ID", style="cyan")
        table.add_column("Title")
        table.add_column("Type")
        table.add_column("Parse Status")
        for d in docs:
            table.add_row(str(d.id), d.title, d.doc_type, d.parse_status)
        console.print(table)
    except Exception as e:
        console.print(f"[red]Error:[/red] {e}")
        raise typer.Exit(1)
    finally:
        db.close()
