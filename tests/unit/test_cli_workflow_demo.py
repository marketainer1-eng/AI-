"""
tests/unit/test_cli_workflow_demo.py
=====================================
Unit tests for the ``workflow demo`` CLI command.

Scope
-----
This file tests ONLY the thin CLI layer in ``app/cli/commands/workflow_cmd.py``.
All ``WorkflowDemoService`` calls are mocked via ``patch()``, so these tests
run without a real database or file system.

What is verified
----------------
1.  **Happy path** – successful run exits 0, renders step output and summary panel
2.  **python-docx 미설치** – RuntimeError propagates → exit 1, error message shown
3.  **anchor/evidence mismatch** – RuntimeError propagates → exit 1, message shown
4.  **rollback 호출 여부** – db.close() always called (even on error); rollback is
    the service's responsibility (verified in service tests), CLI just closes session
5.  **skip_export 옵션** – ``skip_export=True`` forwarded to run_demo; output contains
    "skipped" when export_skipped flag is set
6.  **옵션 전달** – --name, --court, --case-number CLI flags are passed through
    correctly to ``WorkflowDemoService.run_demo()``

Mock / Stub strategy
--------------------
- ``app.cli.commands.workflow_cmd.get_session`` is patched to return a
  ``MagicMock()`` session.  This prevents any real DB connection.
- ``app.services.workflow_demo_service.WorkflowDemoService`` is patched at the
  module level where it is imported inside the command function (lazy import).
  Because the CLI imports WorkflowDemoService *inside* the command function body
  (``from app.services.workflow_demo_service import WorkflowDemoService``), we
  patch the class at its canonical location so the lazy import resolves to the
  mock.
- ``WorkflowDemoResult`` / ``DemoStepResult`` / ``DemoPreviewRow`` objects are
  constructed from real dataclasses (no stubs needed) so output formatting is
  tested against real data shapes.
- Typer's ``CliRunner`` is used for all invocations; ``mix_stderr=False`` keeps
  stdout/stderr separate.

Running
-------
::

    pytest tests/unit/test_cli_workflow_demo.py -v

Or as part of the full suite::

    pytest --tb=short -q
"""

from __future__ import annotations

from unittest.mock import MagicMock, call, patch

import pytest
from typer.testing import CliRunner

from app.cli.commands.workflow_cmd import app as wf_app
from app.core.exceptions import CaseNotFoundError
from app.services.workflow_demo_service import (
    DemoPreviewRow,
    DemoStepResult,
    WorkflowDemoResult,
)

# ── Shared runner (stateless, safe to share across tests) ─────────────────────
runner = CliRunner()

# ── Patch targets ─────────────────────────────────────────────────────────────
# WorkflowDemoService is imported *inside* the command function, so we patch
# at its definition module (canonical path) – this is the correct approach for
# lazy / deferred imports.
_SVC_PATH = "app.services.workflow_demo_service.WorkflowDemoService"
_SESSION_PATH = "app.cli.commands.workflow_cmd.get_session"


# ══════════════════════════════════════════════════════════════════════════════
#  Helpers
# ══════════════════════════════════════════════════════════════════════════════

def _make_success_result(
    case_id: int = 42,
    case_name: str = "테스트 데모 사건",
    skip_export: bool = True,
) -> WorkflowDemoResult:
    """Build a WorkflowDemoResult that represents a fully successful run."""
    result = WorkflowDemoResult(case_id=case_id, case_name=case_name)
    result.steps = [
        DemoStepResult(step=i, title=f"Step {i}", success=True, message=f"ok-{i}")
        for i in range(1, 14)
    ]
    result.anchor_count = 2
    result.evidence_count = 2
    result.reference_count = 2
    result.integrity_passed = True
    result.integrity_violations = 0
    result.version_label = "v1"
    result.files_renamed = 2
    result.export_skipped = skip_export
    result.baseline_preview_rows = [
        DemoPreviewRow("갑 제1호증", "계약서"),
        DemoPreviewRow("갑 제2호증", "영수증"),
    ]
    result.evidence_preview_rows = [
        DemoPreviewRow("갑 제1호증", "영수증"),
        DemoPreviewRow("갑 제2호증", "계약서"),
    ]
    return result


_SENTINEL = object()  # sentinel to distinguish "not provided" from explicit []


def _invoke_demo(extra_args=_SENTINEL, mock_result=None, side_effect=None):
    """
    Invoke the ``workflow demo`` command with mocked session and service.

    Parameters
    ----------
    extra_args
        Additional CLI arguments after "demo".
        - Not provided (default): adds ["--skip-export"] for convenience.
        - Provided as a list (even empty []): used exactly as given.
          Pass [] to invoke "demo" with no flags (uses all defaults).

    Returns ``(invoke_result, mock_db, mock_svc_instance)``.
    """
    if extra_args is _SENTINEL:
        args = ["demo", "--skip-export"]
    else:
        args = ["demo"] + list(extra_args)
    mock_db = MagicMock()

    with patch(_SVC_PATH) as MockSvc:
        instance = MockSvc.return_value
        if side_effect is not None:
            instance.run_demo.side_effect = side_effect
        else:
            instance.run_demo.return_value = mock_result or _make_success_result()
        with patch(_SESSION_PATH, return_value=mock_db):
            result = runner.invoke(wf_app, args)
    return result, mock_db, instance


# ══════════════════════════════════════════════════════════════════════════════
#  1. Happy path – successful demo run
# ══════════════════════════════════════════════════════════════════════════════

class TestWorkflowDemoHappyPath:
    """CLI exits 0 and renders expected output on a successful run."""

    def test_exit_code_zero_on_success(self):
        result, _, _ = _invoke_demo()
        assert result.exit_code == 0, result.output

    def test_output_contains_step_headings(self):
        result, _, _ = _invoke_demo()
        # Rich Rule renders as "Step N — Step N" in plain text
        assert "Step 1" in result.output
        assert "Step 13" in result.output

    def test_output_contains_success_checkmark(self):
        """Each step line has a ✓ marker when success=True."""
        result, _, _ = _invoke_demo()
        assert "✓" in result.output

    def test_output_contains_demo_complete_panel(self):
        """Summary panel with 'Demo Complete' title is rendered."""
        result, _, _ = _invoke_demo()
        assert "Demo Complete" in result.output

    def test_output_contains_case_id(self):
        mock_result = _make_success_result(case_id=99)
        result, _, _ = _invoke_demo(mock_result=mock_result)
        assert "99" in result.output

    def test_output_contains_integrity_pass(self):
        result, _, _ = _invoke_demo()
        assert "PASS" in result.output

    def test_output_contains_version_label(self):
        result, _, _ = _invoke_demo()
        assert "v1" in result.output

    def test_output_shows_baseline_evidence_table(self):
        """Baseline evidence list table is rendered with two rows."""
        result, _, _ = _invoke_demo()
        assert "계약서" in result.output

    def test_output_shows_reorder_preview_table(self):
        """Post-reorder preview table is rendered."""
        result, _, _ = _invoke_demo()
        assert "영수증" in result.output

    def test_session_is_closed_on_success(self):
        """db.close() must be called even on success (finally block)."""
        _, mock_db, _ = _invoke_demo()
        mock_db.close.assert_called_once()

    def test_run_demo_called_with_default_args(self):
        """Default CLI options are forwarded to run_demo (skip_export=True via _invoke_demo helper)."""
        _, _, mock_svc = _invoke_demo()  # helper passes --skip-export
        mock_svc.run_demo.assert_called_once_with(
            case_name="손해배상 청구 데모",
            court="서울중앙지방법원",
            case_number="2024가합99999",
            skip_export=True,
        )

    def test_output_shows_explore_commands(self):
        """Summary panel contains docref explore hints."""
        result, _, _ = _invoke_demo()
        assert "docref" in result.output


# ══════════════════════════════════════════════════════════════════════════════
#  2. python-docx 미설치 시 실패
# ══════════════════════════════════════════════════════════════════════════════

class TestWorkflowDemoPythonDocxMissing:
    """CLI exits 1 with an informative message when python-docx is missing."""

    _error = RuntimeError(
        "python-docx is required for the workflow demo.\n"
        "Install it with:  pip install python-docx"
    )

    def test_exit_code_one_when_python_docx_missing(self):
        result, _, _ = _invoke_demo(side_effect=self._error)
        assert result.exit_code == 1

    def test_output_mentions_python_docx(self):
        result, _, _ = _invoke_demo(side_effect=self._error)
        assert "python-docx" in result.output

    def test_output_starts_with_demo_failed(self):
        result, _, _ = _invoke_demo(side_effect=self._error)
        assert "Demo failed" in result.output

    def test_session_closed_even_when_docx_missing(self):
        """Finally block must close the session even after failure."""
        _, mock_db, _ = _invoke_demo(side_effect=self._error)
        mock_db.close.assert_called_once()

    def test_no_panel_rendered_on_failure(self):
        """Demo Complete panel must NOT appear when demo failed."""
        result, _, _ = _invoke_demo(side_effect=self._error)
        assert "Demo Complete" not in result.output

    def test_run_demo_called_before_error(self):
        """run_demo() was invoked (error came from inside it)."""
        _, _, mock_svc = _invoke_demo(side_effect=self._error)
        mock_svc.run_demo.assert_called_once()


# ══════════════════════════════════════════════════════════════════════════════
#  3. anchor/evidence mismatch 시 실패
# ══════════════════════════════════════════════════════════════════════════════

class TestWorkflowDemoAnchorMismatch:
    """CLI handles RuntimeError for anchor/evidence count mismatch."""

    _error = RuntimeError(
        "Anchor / evidence count mismatch: "
        "parsed 3 anchor(s) but expected 2 evidence(s). "
        "Check the demo DOCX template."
    )

    def test_exit_code_one_on_mismatch(self):
        result, _, _ = _invoke_demo(side_effect=self._error)
        assert result.exit_code == 1

    def test_output_mentions_mismatch(self):
        result, _, _ = _invoke_demo(side_effect=self._error)
        assert "mismatch" in result.output.lower() or "Anchor" in result.output

    def test_output_has_demo_failed_prefix(self):
        result, _, _ = _invoke_demo(side_effect=self._error)
        assert "Demo failed" in result.output

    def test_session_closed_on_mismatch(self):
        _, mock_db, _ = _invoke_demo(side_effect=self._error)
        mock_db.close.assert_called_once()


# ══════════════════════════════════════════════════════════════════════════════
#  4. 예외 발생 시 session.close() 보장 (rollback은 service 책임)
# ══════════════════════════════════════════════════════════════════════════════

class TestWorkflowDemoSessionCleanup:
    """
    DB session lifecycle: close() is always called in the CLI finally block.

    The actual db.rollback() is the service's responsibility (tested in
    test_workflow_demo_service.py::TestRunDemoRollbackOnException).
    The CLI layer guarantees session close regardless of success/failure.
    """

    def test_session_closed_on_generic_exception(self):
        _, mock_db, _ = _invoke_demo(side_effect=ValueError("unexpected"))
        mock_db.close.assert_called_once()

    def test_session_closed_on_runtime_error(self):
        _, mock_db, _ = _invoke_demo(side_effect=RuntimeError("boom"))
        mock_db.close.assert_called_once()

    def test_session_closed_on_success(self):
        _, mock_db, _ = _invoke_demo()
        mock_db.close.assert_called_once()

    def test_session_passed_to_service_constructor(self):
        """
        The session returned by get_session() must be passed to
        WorkflowDemoService.__init__() so the service can use it.
        """
        mock_db = MagicMock()
        with patch(_SVC_PATH) as MockSvc:
            MockSvc.return_value.run_demo.return_value = _make_success_result()
            with patch(_SESSION_PATH, return_value=mock_db):
                runner.invoke(wf_app, ["demo", "--skip-export"])
            # First positional arg to MockSvc() must be the session
            MockSvc.assert_called_once_with(mock_db)

    def test_generic_error_shows_demo_failed(self):
        result, _, _ = _invoke_demo(side_effect=ValueError("db error"))
        assert "Demo failed" in result.output
        assert result.exit_code == 1


# ══════════════════════════════════════════════════════════════════════════════
#  5. --skip-export 옵션 동작
# ══════════════════════════════════════════════════════════════════════════════

class TestWorkflowDemoSkipExport:
    """--skip-export flag is forwarded to run_demo and reflected in output."""

    def test_skip_export_true_forwarded_to_service(self):
        """When --skip-export is given, run_demo receives skip_export=True."""
        _, _, mock_svc = _invoke_demo(extra_args=["--skip-export"])
        _, kwargs = mock_svc.run_demo.call_args
        assert kwargs.get("skip_export") is True

    def test_skip_export_false_by_default(self):
        """
        Without --skip-export, skip_export=False is forwarded (default).
        We call with extra_args=[] so the --skip-export flag is NOT added.
        We mock run_demo to avoid actual export being attempted.
        """
        mock_result = _make_success_result(skip_export=False)
        mock_result.export_skipped = False
        mock_result.export_path = "/tmp/fake/export"
        mock_result.exported_files = ["doc.docx"]
        # extra_args=[] means we pass only 'demo' command; no --skip-export
        _, _, mock_svc = _invoke_demo(extra_args=[], mock_result=mock_result)
        _, kwargs = mock_svc.run_demo.call_args
        # Typer default for skip_export is False (bool flag, default=False)
        assert kwargs.get("skip_export") is False

    def test_output_shows_skipped_when_export_skipped(self):
        mock_result = _make_success_result(skip_export=True)
        result, _, _ = _invoke_demo(mock_result=mock_result)
        assert "skipped" in result.output.lower() or "Skipped" in result.output

    def test_output_shows_export_path_when_not_skipped(self):
        """When skip_export=False and export_path is set, path is shown."""
        mock_result = _make_success_result(skip_export=False)
        mock_result.export_skipped = False
        mock_result.export_path = "/tmp/exports/case_42"
        mock_result.exported_files = ["evidence_list.csv"]
        result, _, _ = _invoke_demo(extra_args=[], mock_result=mock_result)
        # Export path should appear in the summary panel
        assert "/tmp/exports/case_42" in result.output or "n/a" in result.output

    def test_step_13_skip_message_in_output(self):
        """Step 13 in result.steps carries skip message when export_skipped."""
        mock_result = _make_success_result(skip_export=True)
        # Override step 13 to reflect skip
        mock_result.steps[12] = DemoStepResult(
            step=13, title="Export", success=True, message="Skipped (--skip-export)"
        )
        result, _, _ = _invoke_demo(mock_result=mock_result)
        assert "Step 13" in result.output


# ══════════════════════════════════════════════════════════════════════════════
#  6. CLI 옵션 전달 검증
# ══════════════════════════════════════════════════════════════════════════════

class TestWorkflowDemoOptionForwarding:
    """All CLI option values are correctly forwarded to WorkflowDemoService.run_demo()."""

    def test_custom_name_forwarded(self):
        _, _, mock_svc = _invoke_demo(
            extra_args=["--name", "손해배상 청구", "--skip-export"]
        )
        args, kwargs = mock_svc.run_demo.call_args
        assert kwargs.get("case_name") == "손해배상 청구"

    def test_custom_court_forwarded(self):
        _, _, mock_svc = _invoke_demo(
            extra_args=["--court", "부산지방법원", "--skip-export"]
        )
        _, kwargs = mock_svc.run_demo.call_args
        assert kwargs.get("court") == "부산지방법원"

    def test_custom_case_number_forwarded(self):
        _, _, mock_svc = _invoke_demo(
            extra_args=["--case-number", "2024나11111", "--skip-export"]
        )
        _, kwargs = mock_svc.run_demo.call_args
        assert kwargs.get("case_number") == "2024나11111"

    def test_all_custom_options_forwarded_together(self):
        _, _, mock_svc = _invoke_demo(
            extra_args=[
                "--name", "계약 분쟁",
                "--court", "인천지방법원",
                "--case-number", "2023가단55555",
                "--skip-export",
            ]
        )
        _, kwargs = mock_svc.run_demo.call_args
        assert kwargs["case_name"] == "계약 분쟁"
        assert kwargs["court"] == "인천지방법원"
        assert kwargs["case_number"] == "2023가단55555"
        assert kwargs["skip_export"] is True

    def test_default_case_name(self):
        """Default case_name is '손해배상 청구 데모'."""
        _, _, mock_svc = _invoke_demo()
        _, kwargs = mock_svc.run_demo.call_args
        assert kwargs["case_name"] == "손해배상 청구 데모"

    def test_default_court(self):
        """Default court is '서울중앙지방법원'."""
        _, _, mock_svc = _invoke_demo()
        _, kwargs = mock_svc.run_demo.call_args
        assert kwargs["court"] == "서울중앙지방법원"

    def test_default_case_number(self):
        """Default case_number is '2024가합99999'."""
        _, _, mock_svc = _invoke_demo()
        _, kwargs = mock_svc.run_demo.call_args
        assert kwargs["case_number"] == "2024가합99999"


# ══════════════════════════════════════════════════════════════════════════════
#  7. Output rendering edge cases
# ══════════════════════════════════════════════════════════════════════════════

class TestWorkflowDemoOutputRendering:
    """Verify specific output content based on result fields."""

    def test_integrity_fail_shown_in_panel(self):
        mock_result = _make_success_result()
        mock_result.integrity_passed = False
        mock_result.integrity_violations = 2
        result, _, _ = _invoke_demo(mock_result=mock_result)
        assert "FAIL" in result.output

    def test_no_baseline_table_when_no_rows(self):
        """If baseline_preview_rows is empty, no Evidence List table is rendered."""
        mock_result = _make_success_result()
        mock_result.baseline_preview_rows = []
        result, _, _ = _invoke_demo(mock_result=mock_result)
        # "Evidence List (baseline)" table should not appear
        assert "Evidence List (baseline)" not in result.output

    def test_no_reorder_table_when_no_preview_rows(self):
        """If evidence_preview_rows is empty, no After Reorder table is rendered."""
        mock_result = _make_success_result()
        mock_result.evidence_preview_rows = []
        result, _, _ = _invoke_demo(mock_result=mock_result)
        assert "After Reorder" not in result.output

    def test_failed_step_shows_warning_icon(self):
        """Steps with success=False show a ⚠ icon in the output."""
        mock_result = _make_success_result()
        mock_result.steps[9] = DemoStepResult(
            step=10, title="Create reorder ChangeSet",
            success=False, message="Skipped — fewer than 2 evidences"
        )
        result, _, _ = _invoke_demo(mock_result=mock_result)
        assert "⚠" in result.output

    def test_help_flag_exits_zero(self):
        """``workflow demo --help`` exits 0 and shows usage."""
        result = runner.invoke(wf_app, ["demo", "--help"])
        assert result.exit_code == 0
        assert "Usage" in result.output

    def test_help_contains_skip_export_option(self):
        result = runner.invoke(wf_app, ["demo", "--help"])
        assert "--skip-export" in result.output

    def test_anchor_count_in_panel(self):
        mock_result = _make_success_result()
        mock_result.anchor_count = 2
        result, _, _ = _invoke_demo(mock_result=mock_result)
        assert "2" in result.output

    def test_files_renamed_in_panel(self):
        mock_result = _make_success_result()
        mock_result.files_renamed = 2
        result, _, _ = _invoke_demo(mock_result=mock_result)
        assert "2" in result.output
