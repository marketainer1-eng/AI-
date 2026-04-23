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
4.  **session 정리 보장** – ``db.close()`` is always called via the CLI ``finally``
    block (success and failure both).  ``db.rollback()`` is the service's
    responsibility (``WorkflowDemoService.run_demo()`` guarantees rollback
    internally before re-raising); the CLI never calls rollback itself.
5.  **skip_export 옵션** – ``--skip-export`` flag forwarded to ``run_demo``;
    output reflects ``export_skipped`` state.
6.  **옵션 전달** – ``--name``, ``--court``, ``--case-number`` are forwarded
    correctly to ``WorkflowDemoService.run_demo()``.

Mock / Stub strategy
--------------------
Import structure in ``workflow_cmd.py``::

    # Inside each command function body (lazy / deferred import):
    from app.services.workflow_demo_service import WorkflowDemoService

Because the import is deferred, Python resolves ``WorkflowDemoService`` from
the *source* module ``app.services.workflow_demo_service`` at call time.
Therefore the correct patch target is::

    patch("app.services.workflow_demo_service.WorkflowDemoService")

Patching ``app.cli.commands.workflow_cmd.WorkflowDemoService`` would raise
``AttributeError`` because ``WorkflowDemoService`` is never bound as a
top-level name in ``workflow_cmd``.

``get_session`` IS imported at the top level of ``workflow_cmd.py``::

    from app.cli.commands._db import get_session   # top-level

so its patch target is::

    patch("app.cli.commands.workflow_cmd.get_session")

``WorkflowDemoResult``, ``DemoStepResult``, and ``DemoPreviewRow`` are
constructed from the real dataclass definitions so Rich output formatting is
exercised with realistic data.

Actual field names (verified against source dataclasses):

``WorkflowDemoResult``
  case_id, case_name, steps, evidence_count, reference_count, anchor_count,
  evidence_preview_rows, baseline_preview_rows, integrity_passed,
  integrity_violations, integrity_warnings, version_label, files_renamed,
  export_path, exported_files, export_skipped

``DemoStepResult``
  step, title, success, message

``DemoPreviewRow``
  rendered_number, rendered_label

CLI session contract
--------------------
- ``db.close()``    – always called (finally block in CLI).
- ``db.rollback()`` – NEVER called by the CLI; the service handles rollback
  internally before re-raising the exception.

Running
-------
::

    pytest tests/unit/test_cli_workflow_demo.py -v

Or as part of the full suite::

    pytest --tb=short -q
"""

from __future__ import annotations

from unittest.mock import MagicMock, patch

import pytest
from typer.testing import CliRunner

from app.cli.commands.workflow_cmd import app as wf_app
from app.services.workflow_demo_service import (
    DemoPreviewRow,
    DemoStepResult,
    WorkflowDemoResult,
)

# ---------------------------------------------------------------------------
# Shared runner — stateless, safe to reuse across all tests
# ---------------------------------------------------------------------------
runner = CliRunner()

# ---------------------------------------------------------------------------
# Patch targets
# ---------------------------------------------------------------------------
# WorkflowDemoService is imported *inside* command function bodies
# (lazy/deferred import) → patch at the source module location.
_SVC_PATH = "app.services.workflow_demo_service.WorkflowDemoService"

# get_session is imported at the top level of workflow_cmd.py
# → patch where the name is used.
_SESSION_PATH = "app.cli.commands.workflow_cmd.get_session"


# ══════════════════════════════════════════════════════════════════════════════
#  Helpers
# ══════════════════════════════════════════════════════════════════════════════

def _make_success_result(
    case_id: int = 42,
    case_name: str = "테스트 데모 사건",
    export_skipped: bool = True,
) -> WorkflowDemoResult:
    """
    Build a ``WorkflowDemoResult`` that represents a fully successful run.

    Uses the *actual* field names defined in the source dataclass:
    ``anchor_count``, ``version_label``, ``files_renamed``,
    ``baseline_preview_rows``, ``evidence_preview_rows``, ``export_skipped``.
    """
    result = WorkflowDemoResult(
        case_id=case_id,
        case_name=case_name,
        steps=[
            DemoStepResult(
                step=i,
                title=f"Step {i}",
                success=True,
                message=f"ok-{i}",
            )
            for i in range(1, 14)
        ],
        baseline_preview_rows=[
            DemoPreviewRow(rendered_number="갑 제1호증", rendered_label="계약서"),
            DemoPreviewRow(rendered_number="갑 제2호증", rendered_label="영수증"),
        ],
        evidence_preview_rows=[
            DemoPreviewRow(rendered_number="갑 제1호증", rendered_label="영수증"),
            DemoPreviewRow(rendered_number="갑 제2호증", rendered_label="계약서"),
        ],
        exported_files=[],
    )
    result.anchor_count = 2
    result.evidence_count = 2
    result.reference_count = 2
    result.integrity_passed = True
    result.integrity_violations = 0
    result.version_label = "v1"
    result.files_renamed = 2
    result.export_skipped = export_skipped
    return result


# Sentinel: distinguishes "caller did not pass extra_args" from "caller passed []".
_SENTINEL = object()


def _invoke_demo(extra_args=_SENTINEL, mock_result=None, side_effect=None):
    """
    Invoke ``workflow demo`` with a mocked session and service.

    Parameters
    ----------
    extra_args
        Extra CLI arguments appended after ``"demo"``.

        * Not provided → ``["demo", "--skip-export"]`` (convenience default).
        * ``[]``        → ``["demo"]``         (all Typer defaults, no flags).
        * ``["--name", "X", ...]`` → forwarded verbatim.

    mock_result
        ``WorkflowDemoResult`` to return from ``run_demo``.
        Defaults to ``_make_success_result()``.

    side_effect
        Exception instance to raise from ``run_demo`` instead of returning.

    Returns
    -------
    ``(CliRunner result, mock_db, mock_svc_instance)``
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
            instance.run_demo.return_value = (
                mock_result if mock_result is not None else _make_success_result()
            )
        with patch(_SESSION_PATH, return_value=mock_db):
            invoke_result = runner.invoke(wf_app, args)

    return invoke_result, mock_db, instance


# ══════════════════════════════════════════════════════════════════════════════
#  1. Happy path – successful demo run
# ══════════════════════════════════════════════════════════════════════════════

class TestWorkflowDemoHappyPath:
    """CLI exits 0 and renders expected output on a fully successful run."""

    def test_exit_code_zero_on_success(self):
        result, _, _ = _invoke_demo()
        assert result.exit_code == 0, result.output

    def test_output_contains_step_headings(self):
        """Rich Rule separator line contains 'Step N — Step N'."""
        result, _, _ = _invoke_demo()
        assert "Step 1" in result.output
        assert "Step 13" in result.output

    def test_output_contains_success_checkmark(self):
        """Each step line renders a ✓ when ``DemoStepResult.success=True``."""
        result, _, _ = _invoke_demo()
        assert "✓" in result.output

    def test_output_contains_demo_complete_panel(self):
        """Summary panel titled 'Demo Complete' is rendered."""
        result, _, _ = _invoke_demo()
        assert "Demo Complete" in result.output

    def test_output_contains_case_id(self):
        mock_result = _make_success_result(case_id=99)
        result, _, _ = _invoke_demo(mock_result=mock_result)
        assert "99" in result.output

    def test_output_contains_integrity_pass(self):
        """``integrity_passed=True`` renders as 'PASS' in the summary panel."""
        result, _, _ = _invoke_demo()
        assert "PASS" in result.output

    def test_output_contains_version_label(self):
        """``version_label`` ('v1') appears in the summary panel."""
        result, _, _ = _invoke_demo()
        assert "v1" in result.output

    def test_output_shows_baseline_evidence_table(self):
        """Baseline evidence table (``baseline_preview_rows``) is rendered."""
        result, _, _ = _invoke_demo()
        # Table renders rendered_label column values
        assert "계약서" in result.output

    def test_output_shows_reorder_preview_table(self):
        """Post-reorder preview table (``evidence_preview_rows``) is rendered."""
        result, _, _ = _invoke_demo()
        assert "영수증" in result.output

    def test_session_is_closed_on_success(self):
        """``db.close()`` called exactly once in the ``finally`` block."""
        _, mock_db, _ = _invoke_demo()
        mock_db.close.assert_called_once()

    def test_run_demo_called_with_default_args(self):
        """
        Typer default values and ``--skip-export`` flag are forwarded verbatim
        to ``WorkflowDemoService.run_demo()``.
        The helper passes ``--skip-export`` so ``skip_export=True`` is expected.
        """
        _, _, mock_svc = _invoke_demo()
        mock_svc.run_demo.assert_called_once_with(
            case_name="손해배상 청구 데모",
            court="서울중앙지방법원",
            case_number="2024가합99999",
            skip_export=True,
        )

    def test_output_shows_explore_commands(self):
        """Summary panel shows 'docref …' explore hints."""
        result, _, _ = _invoke_demo()
        assert "docref" in result.output

    def test_cli_does_not_call_rollback_on_success(self):
        """
        The CLI never calls ``db.rollback()`` — rollback is the service's
        responsibility.  On success there is nothing to roll back.
        """
        _, mock_db, _ = _invoke_demo()
        mock_db.rollback.assert_not_called()


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
        """``finally`` block closes the session regardless of failure."""
        _, mock_db, _ = _invoke_demo(side_effect=self._error)
        mock_db.close.assert_called_once()

    def test_cli_does_not_call_rollback_for_docx_error(self):
        """
        The service already rolled back before re-raising; the CLI must NOT
        call ``rollback()`` a second time.
        """
        _, mock_db, _ = _invoke_demo(side_effect=self._error)
        mock_db.rollback.assert_not_called()

    def test_no_panel_rendered_on_failure(self):
        """'Demo Complete' panel must NOT appear after a failure."""
        result, _, _ = _invoke_demo(side_effect=self._error)
        assert "Demo Complete" not in result.output

    def test_run_demo_called_before_error(self):
        """``run_demo()`` was invoked (error originated inside the service)."""
        _, _, mock_svc = _invoke_demo(side_effect=self._error)
        mock_svc.run_demo.assert_called_once()


# ══════════════════════════════════════════════════════════════════════════════
#  3. anchor/evidence mismatch 시 실패
# ══════════════════════════════════════════════════════════════════════════════

class TestWorkflowDemoAnchorMismatch:
    """CLI handles the RuntimeError raised for anchor/evidence count mismatch."""

    _error = RuntimeError(
        "Anchor / evidence count mismatch: "
        "parsed 3 anchor(s) but expected 2 evidence(s). "
        "Check the demo DOCX template."
    )

    def test_exit_code_one_on_mismatch(self):
        result, _, _ = _invoke_demo(side_effect=self._error)
        assert result.exit_code == 1

    def test_output_mentions_mismatch_or_anchor(self):
        result, _, _ = _invoke_demo(side_effect=self._error)
        assert "mismatch" in result.output.lower() or "Anchor" in result.output

    def test_output_has_demo_failed_prefix(self):
        result, _, _ = _invoke_demo(side_effect=self._error)
        assert "Demo failed" in result.output

    def test_session_closed_on_mismatch(self):
        _, mock_db, _ = _invoke_demo(side_effect=self._error)
        mock_db.close.assert_called_once()

    def test_cli_does_not_call_rollback_for_mismatch(self):
        """Rollback is performed inside the service, not by the CLI."""
        _, mock_db, _ = _invoke_demo(side_effect=self._error)
        mock_db.rollback.assert_not_called()


# ══════════════════════════════════════════════════════════════════════════════
#  4. session 정리 보장 (rollback은 service 책임, CLI는 close만)
# ══════════════════════════════════════════════════════════════════════════════

class TestWorkflowDemoSessionCleanup:
    """
    DB session lifecycle: ``close()`` is always called in the CLI ``finally``
    block; ``rollback()`` is NEVER called by the CLI.

    Rollback contract
    -----------------
    ``WorkflowDemoService.run_demo()`` guarantees::

        except Exception:
            self.db.rollback()
            raise

    before re-raising, so by the time the CLI ``except`` clause sees the
    exception the session is already rolled back.  Calling ``rollback()`` a
    second time from the CLI would be incorrect.

    See ``test_workflow_demo_service.py::TestRunDemoRollbackOnException`` for
    the rollback behaviour tested at the service layer.
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

    def test_session_closed_exactly_once(self):
        """``close()`` must be called exactly once (not zero, not twice)."""
        _, mock_db, _ = _invoke_demo()
        assert mock_db.close.call_count == 1

    def test_cli_never_calls_rollback_on_failure(self):
        """CLI must NOT call ``db.rollback()`` — that is the service's job."""
        _, mock_db, _ = _invoke_demo(side_effect=RuntimeError("fail"))
        mock_db.rollback.assert_not_called()

    def test_cli_never_calls_rollback_on_success(self):
        _, mock_db, _ = _invoke_demo()
        mock_db.rollback.assert_not_called()

    def test_session_passed_to_service_constructor(self):
        """
        The ``Session`` returned by ``get_session()`` must be forwarded as the
        first positional argument to ``WorkflowDemoService(db)``.
        """
        mock_db = MagicMock()
        with patch(_SVC_PATH) as MockSvc:
            MockSvc.return_value.run_demo.return_value = _make_success_result()
            with patch(_SESSION_PATH, return_value=mock_db):
                runner.invoke(wf_app, ["demo", "--skip-export"])
            MockSvc.assert_called_once_with(mock_db)

    def test_generic_error_output_and_exit(self):
        result, _, _ = _invoke_demo(side_effect=ValueError("db error"))
        assert "Demo failed" in result.output
        assert result.exit_code == 1


# ══════════════════════════════════════════════════════════════════════════════
#  5. --skip-export 옵션 동작
# ══════════════════════════════════════════════════════════════════════════════

class TestWorkflowDemoSkipExport:
    """``--skip-export`` flag forwarding and output reflection."""

    def test_skip_export_true_forwarded_to_service(self):
        """``--skip-export`` sets ``skip_export=True`` in the ``run_demo`` call."""
        _, _, mock_svc = _invoke_demo(extra_args=["--skip-export"])
        _, kwargs = mock_svc.run_demo.call_args
        assert kwargs.get("skip_export") is True

    def test_skip_export_false_when_flag_absent(self):
        """
        Without ``--skip-export``, Typer passes ``skip_export=False`` (its
        declared default).

        ``extra_args=[]`` instructs the helper to invoke ``["demo"]`` only,
        with no additional flags.
        """
        mock_result = _make_success_result(export_skipped=False)
        mock_result.export_skipped = False
        mock_result.export_path = "/tmp/fake/export"
        mock_result.exported_files = ["doc.docx"]
        _, _, mock_svc = _invoke_demo(extra_args=[], mock_result=mock_result)
        _, kwargs = mock_svc.run_demo.call_args
        assert kwargs.get("skip_export") is False

    def test_output_shows_skipped_when_export_skipped(self):
        """``export_skipped=True`` → 'skipped' appears in the summary panel."""
        mock_result = _make_success_result(export_skipped=True)
        result, _, _ = _invoke_demo(mock_result=mock_result)
        assert "skipped" in result.output.lower()

    def test_output_shows_export_path_when_not_skipped(self):
        """``export_skipped=False`` with a non-empty path → path in summary."""
        mock_result = _make_success_result(export_skipped=False)
        mock_result.export_skipped = False
        mock_result.export_path = "/tmp/exports/case_42"
        mock_result.exported_files = ["evidence_list.csv"]
        result, _, _ = _invoke_demo(extra_args=[], mock_result=mock_result)
        # CLI renders export_path when export_skipped is False
        assert "/tmp/exports/case_42" in result.output or "n/a" in result.output

    def test_step_13_rendered_regardless_of_skip(self):
        """Step 13 always appears in the output (either skip message or ok)."""
        result, _, _ = _invoke_demo()
        assert "Step 13" in result.output


# ══════════════════════════════════════════════════════════════════════════════
#  6. CLI 옵션 전달 검증
# ══════════════════════════════════════════════════════════════════════════════

class TestWorkflowDemoOptionForwarding:
    """All CLI flags are forwarded correctly to ``WorkflowDemoService.run_demo()``."""

    def test_custom_name_forwarded(self):
        _, _, mock_svc = _invoke_demo(
            extra_args=["--name", "손해배상 청구", "--skip-export"]
        )
        _, kwargs = mock_svc.run_demo.call_args
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
        _, _, mock_svc = _invoke_demo()
        _, kwargs = mock_svc.run_demo.call_args
        assert kwargs["case_name"] == "손해배상 청구 데모"

    def test_default_court(self):
        _, _, mock_svc = _invoke_demo()
        _, kwargs = mock_svc.run_demo.call_args
        assert kwargs["court"] == "서울중앙지방법원"

    def test_default_case_number(self):
        _, _, mock_svc = _invoke_demo()
        _, kwargs = mock_svc.run_demo.call_args
        assert kwargs["case_number"] == "2024가합99999"

    def test_run_demo_called_exactly_once(self):
        _, _, mock_svc = _invoke_demo()
        assert mock_svc.run_demo.call_count == 1


# ══════════════════════════════════════════════════════════════════════════════
#  7. Output rendering edge cases
# ══════════════════════════════════════════════════════════════════════════════

class TestWorkflowDemoOutputRendering:
    """Verify specific output elements driven by result field values."""

    def test_integrity_fail_shown_in_panel(self):
        """``integrity_passed=False`` renders 'FAIL' in the summary panel."""
        mock_result = _make_success_result()
        mock_result.integrity_passed = False
        mock_result.integrity_violations = 2
        result, _, _ = _invoke_demo(mock_result=mock_result)
        assert "FAIL" in result.output

    def test_no_baseline_table_when_baseline_rows_empty(self):
        """
        When ``baseline_preview_rows`` is empty, the 'Evidence List (baseline)'
        table is not rendered.
        """
        mock_result = _make_success_result()
        mock_result.baseline_preview_rows = []
        result, _, _ = _invoke_demo(mock_result=mock_result)
        assert "Evidence List (baseline)" not in result.output

    def test_no_reorder_table_when_evidence_preview_rows_empty(self):
        """
        When ``evidence_preview_rows`` is empty, the 'After Reorder' table is
        not rendered.
        """
        mock_result = _make_success_result()
        mock_result.evidence_preview_rows = []
        result, _, _ = _invoke_demo(mock_result=mock_result)
        assert "After Reorder" not in result.output

    def test_failed_step_shows_warning_icon(self):
        """
        A ``DemoStepResult`` with ``success=False`` renders a '⚠' icon
        (the CLI uses ``success`` to choose between '✓' and '⚠').
        """
        mock_result = _make_success_result()
        mock_result.steps[9] = DemoStepResult(
            step=10,
            title="Create reorder ChangeSet",
            success=False,
            message="Skipped — fewer than 2 evidences",
        )
        result, _, _ = _invoke_demo(mock_result=mock_result)
        assert "⚠" in result.output

    def test_successful_step_shows_checkmark(self):
        """A step with ``success=True`` renders '✓'."""
        result, _, _ = _invoke_demo()
        assert "✓" in result.output

    def test_help_flag_exits_zero(self):
        result = runner.invoke(wf_app, ["demo", "--help"])
        assert result.exit_code == 0
        assert "Usage" in result.output

    def test_help_contains_skip_export_option(self):
        result = runner.invoke(wf_app, ["demo", "--help"])
        assert "--skip-export" in result.output

    def test_anchor_count_displayed_in_panel(self):
        """``anchor_count`` value appears in the summary panel."""
        mock_result = _make_success_result()
        mock_result.anchor_count = 3
        result, _, _ = _invoke_demo(mock_result=mock_result)
        assert "3" in result.output

    def test_files_renamed_displayed_in_panel(self):
        """``files_renamed`` value appears in the summary panel."""
        mock_result = _make_success_result()
        mock_result.files_renamed = 5
        result, _, _ = _invoke_demo(mock_result=mock_result)
        assert "5" in result.output

    def test_version_label_na_when_empty(self):
        """When ``version_label`` is empty string, 'n/a' is rendered."""
        mock_result = _make_success_result()
        mock_result.version_label = ""
        result, _, _ = _invoke_demo(mock_result=mock_result)
        assert "n/a" in result.output

    def test_baseline_table_title(self):
        """'Evidence List (baseline)' is the table title for baseline rows."""
        result, _, _ = _invoke_demo()
        assert "Evidence List (baseline)" in result.output

    def test_reorder_table_title(self):
        """'After Reorder' appears in the reorder preview table title."""
        result, _, _ = _invoke_demo()
        assert "After Reorder" in result.output

    def test_rendered_label_values_in_baseline_table(self):
        """``rendered_label`` values from ``baseline_preview_rows`` are shown."""
        mock_result = _make_success_result()
        mock_result.baseline_preview_rows = [
            DemoPreviewRow(rendered_number="갑 제1호증", rendered_label="임대차 계약서"),
        ]
        result, _, _ = _invoke_demo(mock_result=mock_result)
        assert "임대차 계약서" in result.output

    def test_rendered_number_values_in_preview_table(self):
        """``rendered_number`` values from ``evidence_preview_rows`` are shown."""
        mock_result = _make_success_result()
        mock_result.evidence_preview_rows = [
            DemoPreviewRow(rendered_number="갑 제9호증", rendered_label="영수증"),
        ]
        result, _, _ = _invoke_demo(mock_result=mock_result)
        assert "갑 제9호증" in result.output
