"""
Integration tests for /cases API endpoints.
Uses FastAPI TestClient + SQLite in-memory DB.
"""

import pytest
from fastapi.testclient import TestClient


class TestCasesAPI:
    def test_create_case(self, client: TestClient):
        resp = client.post("/cases", json={"name": "API 테스트 사건"})
        assert resp.status_code == 201
        data = resp.json()
        assert data["id"] is not None
        assert data["name"] == "API 테스트 사건"
        assert data["status"] == "active"

    def test_create_case_with_all_fields(self, client: TestClient):
        resp = client.post(
            "/cases",
            json={
                "name": "손해배상 청구",
                "court": "서울중앙지방법원",
                "case_number": "2024가합12345",
                "description": "계약 위반 손해배상",
            },
        )
        assert resp.status_code == 201
        data = resp.json()
        assert data["court"] == "서울중앙지방법원"
        assert data["case_number"] == "2024가합12345"

    def test_list_cases_empty(self, client: TestClient):
        resp = client.get("/cases")
        assert resp.status_code == 200
        data = resp.json()
        assert data["items"] == []
        assert data["total"] == 0

    def test_list_cases_after_create(self, client: TestClient):
        client.post("/cases", json={"name": "사건 1"})
        client.post("/cases", json={"name": "사건 2"})
        resp = client.get("/cases")
        assert resp.status_code == 200
        assert resp.json()["total"] == 2

    def test_get_case_found(self, client: TestClient):
        create_resp = client.post("/cases", json={"name": "조회 사건"})
        case_id = create_resp.json()["id"]
        resp = client.get(f"/cases/{case_id}")
        assert resp.status_code == 200
        assert resp.json()["id"] == case_id

    def test_get_case_not_found(self, client: TestClient):
        resp = client.get("/cases/99999")
        assert resp.status_code == 404

    def test_update_case(self, client: TestClient):
        create_resp = client.post("/cases", json={"name": "수정 전 사건"})
        case_id = create_resp.json()["id"]
        resp = client.patch(f"/cases/{case_id}", json={"name": "수정 후 사건"})
        assert resp.status_code == 200
        assert resp.json()["name"] == "수정 후 사건"

    def test_create_case_missing_name(self, client: TestClient):
        resp = client.post("/cases", json={})
        assert resp.status_code == 422

    def test_health_check(self, client: TestClient):
        resp = client.get("/")
        assert resp.status_code == 200
        assert resp.json()["status"] == "ok"
