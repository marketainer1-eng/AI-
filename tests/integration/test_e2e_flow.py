"""
End-to-end flow test:
  case → evidence → integrity_check → reorder_changeset → commit

Uses SQLite in-memory DB via conftest.py.
File upload is skipped (no real DOCX on disk) — flow tested at service level.
"""

import pytest
from fastapi.testclient import TestClient


class TestE2EFlow:
    def test_case_evidence_integrity_reorder_flow(self, client: TestClient):
        # 1. Create case
        resp = client.post("/cases", json={"name": "E2E 테스트 사건", "court": "서울중앙지방법원"})
        assert resp.status_code == 201
        case_id = resp.json()["id"]

        # 2. Create evidences
        ev1_resp = client.post(
            f"/cases/{case_id}/evidences",
            json={"party": "plaintiff", "label": "계약서 사본", "sort_order": 1},
        )
        assert ev1_resp.status_code == 201
        ev1_id = ev1_resp.json()["id"]

        ev2_resp = client.post(
            f"/cases/{case_id}/evidences",
            json={"party": "plaintiff", "label": "이메일 출력물", "sort_order": 2},
        )
        assert ev2_resp.status_code == 201
        ev2_id = ev2_resp.json()["id"]

        ev3_resp = client.post(
            f"/cases/{case_id}/evidences",
            json={"party": "plaintiff", "label": "영수증", "sort_order": 3},
        )
        assert ev3_resp.status_code == 201
        ev3_id = ev3_resp.json()["id"]

        # 3. Integrity check (should pass — no anchors, no files)
        check_resp = client.get(f"/cases/{case_id}/integrity-check")
        assert check_resp.status_code == 200
        assert check_resp.json()["is_passed"] is True

        # 4. Create reorder changeset (swap ev1 and ev3)
        reorder_resp = client.post(
            f"/cases/{case_id}/changes/reorder",
            json={
                "description": "증거 순서 변경 — 영수증을 1번으로",
                "items": [
                    {"evidence_id": ev3_id, "new_sort_order": 1},
                    {"evidence_id": ev2_id, "new_sort_order": 2},
                    {"evidence_id": ev1_id, "new_sort_order": 3},
                ],
            },
        )
        assert reorder_resp.status_code == 201
        cs_data = reorder_resp.json()
        assert cs_data["status"] == "draft"
        cs_id = cs_data["id"]

        # 5. Preview the changeset
        preview_resp = client.post(f"/changes/{cs_id}/preview")
        assert preview_resp.status_code == 200
        preview_data = preview_resp.json()
        assert preview_data["status"] == "previewed"
        # Verify ev3 (영수증) is now 갑 제1호증
        entries = {e["evidence_id"]: e["rendered_number"] for e in preview_data["evidence_list_preview"]}
        assert entries[ev3_id] == "갑 제1호증"
        assert entries[ev2_id] == "갑 제2호증"
        assert entries[ev1_id] == "갑 제3호증"

        # 6. Commit the changeset
        commit_resp = client.post(f"/changes/{cs_id}/commit")
        assert commit_resp.status_code == 200
        commit_data = commit_resp.json()
        assert commit_data["status"] == "committed"
        assert commit_data["version_label"] == "v1"

        # 7. Verify evidences have new sort_orders
        evs_resp = client.get(f"/cases/{case_id}/evidences?party=plaintiff")
        assert evs_resp.status_code == 200
        items = evs_resp.json()["items"]
        sort_map = {e["id"]: e["sort_order"] for e in items}
        assert sort_map[ev3_id] == 1
        assert sort_map[ev2_id] == 2
        assert sort_map[ev1_id] == 3

        # 8. Render preview after commit
        render_resp = client.post(f"/cases/{case_id}/render-preview", json={})
        assert render_resp.status_code == 200
        render_data = render_resp.json()
        ev_list = {e["evidence_id"]: e["rendered_number"] for e in render_data["evidence_list_preview"]}
        assert ev_list[ev3_id] == "갑 제1호증"

    def test_rollback_flow(self, client: TestClient):
        # 1. Create case + evidences
        case_resp = client.post("/cases", json={"name": "롤백 테스트 사건"})
        case_id = case_resp.json()["id"]

        ev_resp = client.post(
            f"/cases/{case_id}/evidences",
            json={"party": "plaintiff", "label": "증거 A", "sort_order": 1},
        )
        ev_id = ev_resp.json()["id"]

        # 2. Create and commit a changeset (reorder)
        cs_resp = client.post(
            f"/cases/{case_id}/changes/reorder",
            json={"items": [{"evidence_id": ev_id, "new_sort_order": 5}]},
        )
        cs_id = cs_resp.json()["id"]
        client.post(f"/changes/{cs_id}/commit")

        # Sort order should be 5 now
        ev_data = client.get(f"/cases/{case_id}/evidences/{ev_id}").json()
        assert ev_data["sort_order"] == 5

        # 3. Rollback to the committed changeset (which snapshots sort_order=5)
        rollback_resp = client.post(
            f"/cases/{case_id}/rollback",
            json={"target_change_set_id": cs_id},
        )
        assert rollback_resp.status_code == 200
        rollback_data = rollback_resp.json()
        assert rollback_data["status"] == "committed"
        assert rollback_data["rolled_back_from_id"] == cs_id
