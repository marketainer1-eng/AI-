"""
Integration tests for /cases/{case_id}/evidences API endpoints.
"""

import pytest
from fastapi.testclient import TestClient


def _create_case(client: TestClient, name: str = "증거 테스트 사건") -> int:
    resp = client.post("/cases", json={"name": name})
    assert resp.status_code == 201
    return resp.json()["id"]


class TestEvidencesAPI:
    def test_create_evidence(self, client: TestClient):
        case_id = _create_case(client)
        resp = client.post(
            f"/cases/{case_id}/evidences",
            json={"party": "plaintiff", "label": "계약서 사본", "sort_order": 0},
        )
        assert resp.status_code == 201
        data = resp.json()
        assert data["id"] is not None
        assert data["party"] == "plaintiff"
        assert data["label"] == "계약서 사본"
        assert data["is_active"] is True

    def test_create_evidence_case_not_found(self, client: TestClient):
        resp = client.post(
            "/cases/99999/evidences",
            json={"party": "plaintiff", "label": "없는 사건 증거", "sort_order": 1},
        )
        assert resp.status_code == 404

    def test_list_evidences_empty(self, client: TestClient):
        case_id = _create_case(client)
        resp = client.get(f"/cases/{case_id}/evidences")
        assert resp.status_code == 200
        assert resp.json()["total"] == 0

    def test_list_evidences(self, client: TestClient):
        case_id = _create_case(client)
        client.post(f"/cases/{case_id}/evidences", json={"party": "plaintiff", "label": "A", "sort_order": 1})
        client.post(f"/cases/{case_id}/evidences", json={"party": "plaintiff", "label": "B", "sort_order": 2})
        resp = client.get(f"/cases/{case_id}/evidences")
        assert resp.status_code == 200
        assert resp.json()["total"] == 2

    def test_list_evidences_filter_by_party(self, client: TestClient):
        case_id = _create_case(client)
        client.post(f"/cases/{case_id}/evidences", json={"party": "plaintiff", "label": "갑 증거", "sort_order": 1})
        client.post(f"/cases/{case_id}/evidences", json={"party": "defendant", "label": "을 증거", "sort_order": 1})
        resp = client.get(f"/cases/{case_id}/evidences?party=plaintiff")
        assert resp.status_code == 200
        data = resp.json()
        assert data["total"] == 1
        assert data["items"][0]["party"] == "plaintiff"

    def test_get_evidence(self, client: TestClient):
        case_id = _create_case(client)
        create_resp = client.post(
            f"/cases/{case_id}/evidences",
            json={"party": "plaintiff", "label": "조회 증거", "sort_order": 1},
        )
        ev_id = create_resp.json()["id"]
        resp = client.get(f"/cases/{case_id}/evidences/{ev_id}")
        assert resp.status_code == 200
        assert resp.json()["id"] == ev_id

    def test_get_evidence_not_found(self, client: TestClient):
        case_id = _create_case(client)
        resp = client.get(f"/cases/{case_id}/evidences/99999")
        assert resp.status_code == 404

    def test_update_evidence_label(self, client: TestClient):
        case_id = _create_case(client)
        create_resp = client.post(
            f"/cases/{case_id}/evidences",
            json={"party": "plaintiff", "label": "원래", "sort_order": 1},
        )
        ev_id = create_resp.json()["id"]
        resp = client.patch(f"/cases/{case_id}/evidences/{ev_id}", json={"label": "바뀐 레이블"})
        assert resp.status_code == 200
        assert resp.json()["label"] == "바뀐 레이블"

    def test_create_evidence_invalid_party(self, client: TestClient):
        case_id = _create_case(client)
        resp = client.post(
            f"/cases/{case_id}/evidences",
            json={"party": "invalid_party", "label": "잘못된 party", "sort_order": 1},
        )
        assert resp.status_code == 422
