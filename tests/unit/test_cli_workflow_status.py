"""
tests/unit/test_cli_workflow_status.py
========================================
Unit tests for the ``workflow status`` CLI command.

Scope
-----
This file tests ONLY the thin CLI layer in ``app/cli/commands/workflow_cmd.py``.
All ``WorkflowDemoService.get_status()`` calls are mocked, so tests run without
a real database.

What is verified
----------------
1.  **정상 집계** – happy path: exits 0, renders all status fields in a panel
2.  **CaseNotFoundError** – exits 1, shows the not-found message
3.  **Generic exception** – exits 1, shows generic error output
4.  **session.close() 보장** – always called (success and failure)
5.  **integrity 출력 형태** – PASS / FAIL / "not run" rendered correctly
6.  **case_id 인수 전달** – correct case_id forwarded to get_status()
7.  **output 구조** – panel contains expected field labels

Mock / Stub strategy
--------------------
- ``app.cli.commands.workflow_cmd.get_session`` → ``MagicMock()`` session
  (prevents any real DB connection).
- ``app.services.workflow_demo_service.WorkflowDemoService`` → patched at the
  canonical module location so the lazy import inside the command resolves to
  the mock.
- ``WorkflowStatusResult`` objects are real dataclass instances — no stubs.

Running
-------
::

    pytest tests/unit/test_cli_workflow_status.py -v

Or as part of the full suite::

    pytest --tb=short -q
"""

from __future__ import annotations

from unittest.mock import MagicMock, patch

import pytest
from typer.testing import CliRunner

from app.cli.commands.workflow_cmd import app as wf_app
from app.core.exceptions import CaseNotFoundError
from app.services.workflow_demo_service import WorkflowStatusResult

# ── Shared runner ─────────────────────────────────────────────────────────────
runner = CliRunner()

# ── Patch targets ─────────────────────────────────────────────────────────────
_SVC_PATH = "app.services.workflow_demo_service.WorkflowDemoService"
_SESSION_PATH = "app.cli.commands.workflow_cmd.get_session"


# ══════════════════════════════════════════════════════════════════════════════
#  Helpers
# ══════════════════════════════════════════════════════════════════════════════

def _make_status(
    case_id: int = 1,
    case_name: str = "손해배상 청구 사건",
    case_status: str = "active",
    court: str = "서울중앙지방법원",
    case_number: str = "2024가합12345",
    *,
    total_files: int = 3,
    document_files: int = 1,
    evidence_files: int = 2,
    total_documents: int = 1,
    total_evidences: int = 2,
    active_evidences: int = 2,
    active_references: int = 2,
    total_changesets: int = 1,
    committed_changesets: int = 1,
    latest_integrity_passed: bool | None = True,
    latest_integrity_violations: int = 0,
) -> WorkflowStatusResult:
    """Build a fully-populated WorkflowStatusResult for test assertions."""
    return WorkflowStatusResult(
        case_id=case_id,
        case_name=case_name,
        case_status=case_status,
        court=court,
        case_number=case_number,
        total_files=total_files,
        document_files=document_files,
        evidence_files=evidence_files,
        total_documents=total_documents,
        total_evidences=total_evidences,
        active_evidences=active_evidences,
        active_references=active_references,
        total_changesets=total_changesets,
        committed_changesets=committed_changesets,
        latest_integrity_passed=latest_integrity_passed,
        latest_integrity_violations=latest_integrity_violations,
    )


def _invoke_status(
    case_id: int = 1,
    mock_status: WorkflowStatusResult | None = None,
    side_effect=None,
):
    """
    Invoke ``workflow status <case_id>`` with mocked session and service.

    Returns ``(invoke_result, mock_db, mock_svc_instance)``.
    """
    mock_db = MagicMock()
    with patch(_SVC_PATH) as MockSvc:
        instance = MockSvc.return_value
        if side_effect is not None:
            instance.get_status.side_effect = side_effect
        else:
            instance.get_status.return_value = mock_status or _make_status()
        with patch(_SESSION_PATH, return_value=mock_db):
            result = runner.invoke(wf_app, ["status", str(case_id)])
    return result, mock_db, instance


# ══════════════════════════════════════════════════════════════════════════════
#  1. 정상 집계 – happy path
# ══════════════════════════════════════════════════════════════════════════════

class TestWorkflowStatusHappyPath:
    """CLI exits 0 and renders all status fields in a panel."""

    def test_exit_code_zero_on_success(self):
        result, _, _ = _invoke_status()
        assert result.exit_code == 0, result.output

    def test_output_contains_workflow_status_title(self):
        result, _, _ = _invoke_status(case_id=5)
        assert "Workflow Status" in result.output
        assert "5" in result.output

    def test_output_contains_case_name(self):
        status = _make_status(case_name="임대차 분쟁 사건")
        result, _, _ = _invoke_status(mock_status=status)
        assert "임대차 분쟁 사건" in result.output

    def test_output_contains_case_status(self):
        status = _make_status(case_status="active")
        result, _, _ = _invoke_status(mock_status=status)
        assert "active" in result.output

    def test_output_contains_court(self):
        status = _make_status(court="부산지방법원")
        result, _, _ = _invoke_status(mock_status=status)
        assert "부산지방법원" in result.output

    def test_output_contains_case_number(self):
        status = _make_status(case_number="2023나98765")
        result, _, _ = _invoke_status(mock_status=status)
        assert "2023나98765" in result.output

    def test_output_contains_file_counts(self):
        status = _make_status(total_files=5, document_files=2, evidence_files=3)
        result, _, _ = _invoke_status(mock_status=status)
        assert "5" in result.output
        assert "2" in result.output
        assert "3" in result.output

    def test_output_contains_evidence_counts(self):
        status = _make_status(total_evidences=4, active_evidences=3)
        result, _, _ = _invoke_status(mock_status=status)
        assert "4" in result.output
        assert "3" in result.output

    def test_output_contains_reference_count(self):
        status = _make_status(active_references=7)
        result, _, _ = _invoke_status(mock_status=status)
        assert "7" in result.output

    def test_output_contains_changeset_counts(self):
        status = _make_status(total_changesets=3, committed_changesets=2)
        result, _, _ = _invoke_status(mock_status=status)
        assert "3" in result.output
        assert "2" in result.output

    def test_output_contains_section_headers(self):
        """Panel must contain Files, Documents, Evidences, References, Change Sets sections."""
        result, _, _ = _invoke_status()
        assert "Files" in result.output
        assert "Documents" in result.output
        assert "Evidences" in result.output
        assert "References" in result.output
        assert "Change Sets" in result.output

    def test_session_closed_on_success(self):
        _, mock_db, _ = _invoke_status()
        mock_db.close.assert_called_once()

    def test_get_status_called_with_correct_case_id(self):
        _, _, mock_svc = _invoke_status(case_id=42)
        mock_svc.get_status.assert_called_once_with(42)

    def test_output_contains_latest_integrity_header(self):
        result, _, _ = _invoke_status()
        assert "Integrity" in result.output

    def test_output_contains_case_id_in_title(self):
        result, _, _ = _invoke_status(case_id=99)
        assert "99" in result.output

    def test_session_passed_to_service_constructor(self):
        """Session from get_session() must be passed to WorkflowDemoService()."""
        mock_db = MagicMock()
        with patch(_SVC_PATH) as MockSvc:
            MockSvc.return_value.get_status.return_value = _make_status()
            with patch(_SESSION_PATH, return_value=mock_db):
                runner.invoke(wf_app, ["status", "1"])
            MockSvc.assert_called_once_with(mock_db)


# ══════════════════════════════════════════════════════════════════════════════
#  2. CaseNotFoundError – exit 1 with message
# ══════════════════════════════════════════════════════════════════════════════

class TestWorkflowStatusCaseNotFound:
    """CLI exits 1 and shows not-found message when case is missing."""

    def test_exit_code_one_on_not_found(self):
        result, _, _ = _invoke_status(
            case_id=999,
            side_effect=CaseNotFoundError(999),
        )
        assert result.exit_code == 1

    def test_output_contains_not_found_message(self):
        result, _, _ = _invoke_status(
            case_id=999,
            side_effect=CaseNotFoundError(999),
        )
        # CaseNotFoundError.__str__ returns "Case 999 not found"
        assert "999" in result.output
        assert "not found" in result.output.lower() or "Case" in result.output

    def test_session_closed_on_not_found(self):
        _, mock_db, _ = _invoke_status(
            case_id=999,
            side_effect=CaseNotFoundError(999),
        )
        mock_db.close.assert_called_once()

    def test_no_panel_rendered_on_not_found(self):
        """Status panel must NOT appear when case is not found."""
        result, _, _ = _invoke_status(
            case_id=999,
            side_effect=CaseNotFoundError(999),
        )
        assert "Workflow Status" not in result.output

    def test_different_case_id_in_error_message(self):
        result, _, _ = _invoke_status(
            case_id=12345,
            side_effect=CaseNotFoundError(12345),
        )
        assert "12345" in result.output


# ══════════════════════════════════════════════════════════════════════════════
#  3. Generic exception – exit 1
# ══════════════════════════════════════════════════════════════════════════════

class TestWorkflowStatusGenericError:
    """CLI exits 1 with "Error:" prefix for unexpected exceptions."""

    def test_exit_code_one_on_generic_exception(self):
        result, _, _ = _invoke_status(side_effect=ValueError("db timeout"))
        assert result.exit_code == 1

    def test_output_contains_error_prefix(self):
        result, _, _ = _invoke_status(side_effect=RuntimeError("unexpected"))
        assert "Error" in result.output

    def test_session_closed_on_generic_exception(self):
        _, mock_db, _ = _invoke_status(side_effect=RuntimeError("boom"))
        mock_db.close.assert_called_once()

    def test_no_panel_on_generic_exception(self):
        result, _, _ = _invoke_status(side_effect=OSError("permission denied"))
        assert "Workflow Status" not in result.output


# ══════════════════════════════════════════════════════════════════════════════
#  4. session.close() always called
# ══════════════════════════════════════════════════════════════════════════════

class TestWorkflowStatusSessionCleanup:
    """Session is always closed via the finally block in the command."""

    def test_closed_on_success(self):
        _, mock_db, _ = _invoke_status()
        mock_db.close.assert_called_once()

    def test_closed_on_case_not_found(self):
        _, mock_db, _ = _invoke_status(side_effect=CaseNotFoundError(1))
        mock_db.close.assert_called_once()

    def test_closed_on_runtime_error(self):
        _, mock_db, _ = _invoke_status(side_effect=RuntimeError("fail"))
        mock_db.close.assert_called_once()

    def test_closed_exactly_once(self):
        """close() must be called exactly once, not multiple times."""
        _, mock_db, _ = _invoke_status()
        assert mock_db.close.call_count == 1


# ══════════════════════════════════════════════════════════════════════════════
#  5. integrity 출력 형태 검증
# ══════════════════════════════════════════════════════════════════════════════

class TestWorkflowStatusIntegrityRendering:
    """
    The Latest Integrity Check section renders correctly based on
    ``latest_integrity_passed`` value.
    """

    def test_integrity_pass_shows_pass(self):
        status = _make_status(latest_integrity_passed=True, latest_integrity_violations=0)
        result, _, _ = _invoke_status(mock_status=status)
        assert "PASS" in result.output

    def test_integrity_fail_shows_fail_with_violation_count(self):
        status = _make_status(latest_integrity_passed=False, latest_integrity_violations=3)
        result, _, _ = _invoke_status(mock_status=status)
        assert "FAIL" in result.output
        assert "3" in result.output

    def test_integrity_not_run_shows_not_run(self):
        """When latest_integrity_passed is None, display 'not run'."""
        status = _make_status(latest_integrity_passed=None)
        result, _, _ = _invoke_status(mock_status=status)
        assert "not run" in result.output

    def test_integrity_fail_with_zero_violations(self):
        """FAIL with 0 violations is an edge case — output still shows FAIL."""
        status = _make_status(latest_integrity_passed=False, latest_integrity_violations=0)
        result, _, _ = _invoke_status(mock_status=status)
        assert "FAIL" in result.output

    def test_integrity_pass_no_violations_mentioned(self):
        """PASS result does not need a violation count in the output."""
        status = _make_status(latest_integrity_passed=True, latest_integrity_violations=0)
        result, _, _ = _invoke_status(mock_status=status)
        # PASS means no violations; violation count may or may not appear but PASS must
        assert "PASS" in result.output

    def test_integrity_fail_shows_violation_count_number(self):
        status = _make_status(latest_integrity_passed=False, latest_integrity_violations=5)
        result, _, _ = _invoke_status(mock_status=status)
        assert "5" in result.output


# ══════════════════════════════════════════════════════════════════════════════
#  6. case_id 인수 전달 검증
# ══════════════════════════════════════════════════════════════════════════════

class TestWorkflowStatusCaseIdForwarding:
    """The integer case_id CLI argument is forwarded correctly to get_status()."""

    def test_case_id_1_forwarded(self):
        _, _, mock_svc = _invoke_status(case_id=1)
        mock_svc.get_status.assert_called_once_with(1)

    def test_case_id_100_forwarded(self):
        _, _, mock_svc = _invoke_status(case_id=100)
        mock_svc.get_status.assert_called_once_with(100)

    def test_case_id_large_forwarded(self):
        _, _, mock_svc = _invoke_status(case_id=99999)
        mock_svc.get_status.assert_called_once_with(99999)

    def test_case_id_required_argument(self):
        """Invoking without case_id must fail with a usage error (exit ≠ 0)."""
        result = runner.invoke(wf_app, ["status"])
        assert result.exit_code != 0

    def test_non_integer_case_id_fails(self):
        """Typer rejects non-integer case_id before calling the service."""
        result = runner.invoke(wf_app, ["status", "abc"])
        assert result.exit_code != 0


# ══════════════════════════════════════════════════════════════════════════════
#  7. output 구조 및 edge case
# ══════════════════════════════════════════════════════════════════════════════

class TestWorkflowStatusOutputStructure:
    """Verify panel structure and content for edge-case field values."""

    def test_help_flag_exits_zero(self):
        result = runner.invoke(wf_app, ["status", "--help"])
        assert result.exit_code == 0
        assert "Usage" in result.output

    def test_help_contains_case_id_argument(self):
        result = runner.invoke(wf_app, ["status", "--help"])
        assert "CASE_ID" in result.output or "case_id" in result.output.lower()

    def test_empty_court_shows_dash(self):
        """When court is empty string, '-' is displayed."""
        status = _make_status(court="")
        result, _, _ = _invoke_status(mock_status=status)
        assert "-" in result.output

    def test_empty_case_number_shows_dash(self):
        """When case_number is empty string, '-' is displayed."""
        status = _make_status(case_number="")
        result, _, _ = _invoke_status(mock_status=status)
        assert "-" in result.output

    def test_closed_case_status_shown(self):
        status = _make_status(case_status="closed")
        result, _, _ = _invoke_status(mock_status=status)
        assert "closed" in result.output

    def test_zero_counts_shown(self):
        """All-zero counters are rendered (not hidden)."""
        status = _make_status(
            total_files=0, document_files=0, evidence_files=0,
            total_documents=0, total_evidences=0, active_evidences=0,
            active_references=0, total_changesets=0, committed_changesets=0,
            latest_integrity_passed=None,
        )
        result, _, _ = _invoke_status(mock_status=status)
        assert result.exit_code == 0
        # At least some zeros must appear
        assert "0" in result.output

    def test_large_counts_shown(self):
        status = _make_status(
            total_files=9999, total_evidences=500, total_changesets=200
        )
        result, _, _ = _invoke_status(mock_status=status)
        assert "9999" in result.output
        assert "500" in result.output

    def test_output_is_non_empty(self):
        result, _, _ = _invoke_status()
        assert len(result.output.strip()) > 0

    def test_get_status_called_exactly_once(self):
        _, _, mock_svc = _invoke_status()
        assert mock_svc.get_status.call_count == 1

    def test_case_name_with_special_chars(self):
        status = _make_status(case_name="손해배상(서울고법 2024나12345)")
        result, _, _ = _invoke_status(mock_status=status)
        # The case name or a significant portion must appear
        assert "손해배상" in result.output or "2024나" in result.output
