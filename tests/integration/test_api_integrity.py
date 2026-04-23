"""
Integration tests for /cases/{case_id}/integrity-check API endpoint.
"""

import pytest
from fastapi.testclient import TestClient


def _create_case(client: TestClient, name: str = "무결성 API 테스트") -> int:
    resp = client.post("/cases", json={"name": name})
    return resp.json()["id"]


class TestIntegrityAPI:
    def test_integrity_check_passes_empty_case(self, client: TestClient):
        case_id = _create_case(client)
        resp = client.get(f"/cases/{case_id}/integrity-check")
        assert resp.status_code == 200
        data = resp.json()
        assert data["result"] == "pass"
        assert data["is_passed"] is True
        assert data["violation_count"] == 0

    def test_integrity_check_case_not_found(self, client: TestClient):
        resp = client.get("/cases/99999/integrity-check")
        assert resp.status_code == 404

    def test_integrity_check_returns_report_id(self, client: TestClient):
        case_id = _create_case(client)
        resp = client.get(f"/cases/{case_id}/integrity-check")
        assert resp.status_code == 200
        data = resp.json()
        assert "id" in data
        assert data["id"] is not None

    def test_integrity_history_empty(self, client: TestClient):
        case_id = _create_case(client)
        resp = client.get(f"/cases/{case_id}/integrity-check/history")
        assert resp.status_code == 200
        assert resp.json() == []

    def test_integrity_history_after_checks(self, client: TestClient):
        case_id = _create_case(client)
        client.get(f"/cases/{case_id}/integrity-check")
        client.get(f"/cases/{case_id}/integrity-check")
        resp = client.get(f"/cases/{case_id}/integrity-check/history")
        assert resp.status_code == 200
        assert len(resp.json()) == 2
