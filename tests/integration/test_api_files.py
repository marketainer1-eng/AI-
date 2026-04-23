"""
Integration tests for file-related API endpoints.

Endpoints covered
-----------------
POST   /cases/{case_id}/files            – upload a file
GET    /cases/{case_id}/files            – list files
GET    /cases/{case_id}/files/{file_id}  – get file detail
PATCH  /cases/{case_id}/files/{file_id}/role – update file role

Scenarios
---------
Happy path
  - upload returns 201 with id, original_filename, role
  - list returns items + total
  - get returns the specific file
  - role update returns 200 with new role

Edge / failure
  - upload to non-existent case → 404
  - get non-existent file → 404
  - list on non-existent case → 404
  - role update with invalid role → 422
"""

from __future__ import annotations

import io
from fastapi.testclient import TestClient


# ── helpers ───────────────────────────────────────────────────────────────────

def _create_case(client: TestClient, name: str = "파일 테스트 사건") -> int:
    resp = client.post("/cases", json={"name": name})
    assert resp.status_code == 201
    return resp.json()["id"]


def _upload(
    client: TestClient,
    case_id: int,
    filename: str = "brief.docx",
    content: bytes = b"fake docx content",
    role: str = "document",
) -> dict:
    resp = client.post(
        f"/cases/{case_id}/files",
        params={"role": role},
        files={"file": (filename, io.BytesIO(content), "application/octet-stream")},
    )
    return resp


# ══════════════════════════════════════════════════════════════════════════════

class TestFileUpload:
    def test_upload_returns_201(self, client: TestClient):
        case_id = _create_case(client)
        resp = _upload(client, case_id)
        assert resp.status_code == 201

    def test_upload_response_fields(self, client: TestClient):
        case_id = _create_case(client)
        resp = _upload(client, case_id, filename="contract.pdf", role="evidence_attachment")
        data = resp.json()
        assert data["id"] is not None
        assert data["original_filename"] == "contract.pdf"
        assert data["role"] == "evidence_attachment"
        assert data["case_id"] == case_id

    def test_upload_multiple_files(self, client: TestClient):
        case_id = _create_case(client)
        # Different content bytes → different SHA-256 hashes → no DuplicateFileError
        _upload(client, case_id, filename="a.pdf", content=b"content-for-file-a-unique")
        _upload(client, case_id, filename="b.pdf", content=b"content-for-file-b-unique")
        resp = client.get(f"/cases/{case_id}/files")
        assert resp.json()["total"] == 2

    def test_upload_case_not_found(self, client: TestClient):
        resp = _upload(client, 99999)
        assert resp.status_code == 404

    def test_upload_stores_file_size(self, client: TestClient):
        content = b"abcdef"
        case_id = _create_case(client)
        resp = _upload(client, case_id, content=content)
        data = resp.json()
        assert data["file_size_bytes"] == len(content)

    def test_upload_default_role_is_unknown(self, client: TestClient):
        case_id = _create_case(client)
        resp = client.post(
            f"/cases/{case_id}/files",
            files={"file": ("f.pdf", io.BytesIO(b"data"), "application/pdf")},
        )
        # No role param supplied → should default to 'unknown'
        assert resp.status_code == 201
        assert resp.json()["role"] == "unknown"


class TestFileList:
    def test_list_empty(self, client: TestClient):
        case_id = _create_case(client)
        resp = client.get(f"/cases/{case_id}/files")
        assert resp.status_code == 200
        data = resp.json()
        assert data["total"] == 0
        assert data["items"] == []

    def test_list_returns_all_files(self, client: TestClient):
        case_id = _create_case(client)
        # Different content bytes → different SHA-256 hashes → no DuplicateFileError
        _upload(client, case_id, filename="a.docx", content=b"docx-content-unique-aaa", role="document")
        _upload(client, case_id, filename="b.pdf", content=b"pdf-content-unique-bbb", role="evidence_attachment")
        resp = client.get(f"/cases/{case_id}/files")
        assert resp.status_code == 200
        assert resp.json()["total"] == 2

    def test_list_case_not_found(self, client: TestClient):
        resp = client.get("/cases/99999/files")
        assert resp.status_code == 404


class TestFileGet:
    def test_get_file_detail(self, client: TestClient):
        case_id = _create_case(client)
        up = _upload(client, case_id, filename="detail.docx").json()
        resp = client.get(f"/cases/{case_id}/files/{up['id']}")
        assert resp.status_code == 200
        data = resp.json()
        assert data["id"] == up["id"]
        assert data["original_filename"] == "detail.docx"

    def test_get_file_not_found(self, client: TestClient):
        case_id = _create_case(client)
        resp = client.get(f"/cases/{case_id}/files/99999")
        assert resp.status_code == 404

    def test_get_file_wrong_case(self, client: TestClient):
        case_id = _create_case(client)
        other_case = _create_case(client, name="다른 사건")
        up = _upload(client, case_id).json()
        resp = client.get(f"/cases/{other_case}/files/{up['id']}")
        assert resp.status_code == 404


class TestFileRoleUpdate:
    def test_update_role_returns_200(self, client: TestClient):
        case_id = _create_case(client)
        up = _upload(client, case_id, role="unknown").json()
        resp = client.patch(
            f"/cases/{case_id}/files/{up['id']}/role",
            json={"role": "document"},
        )
        assert resp.status_code == 200
        assert resp.json()["role"] == "document"

    def test_update_role_invalid_value(self, client: TestClient):
        case_id = _create_case(client)
        up = _upload(client, case_id).json()
        resp = client.patch(
            f"/cases/{case_id}/files/{up['id']}/role",
            json={"role": "invalid_role"},
        )
        assert resp.status_code == 422

    def test_update_role_not_found(self, client: TestClient):
        case_id = _create_case(client)
        resp = client.patch(
            f"/cases/{case_id}/files/99999/role",
            json={"role": "document"},
        )
        assert resp.status_code == 404
