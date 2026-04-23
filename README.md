# DocRef — Document Reference Integrity Management System

법률 문서 작업에서 **본문 증거 번호 · 증거목록 · 파일명 · 실제 저장 파일** 간의  
참조 무결성을 유지하는 CLI + REST API 기반 백엔드 시스템.

---

## 아키텍처 원칙

| 원칙 | 설명 |
|------|------|
| **Canonical data** | `Evidence`, `Reference`, `SourceFile` — source of truth |
| **Projection** | 문서 번호, 증거목록, 파일명은 sort_order에서 계산되는 projection |
| **Commit-only rename** | 파일 rename은 commit 전에 절대 실행하지 않음 |
| **Change-set flow** | reorder → preview → commit 흐름만 허용 |
| **Immutable rollback** | rollback은 기존 데이터를 덮어쓰지 않고 새 ChangeSet을 생성 |

---

## 기술 스택

- Python 3.12
- FastAPI + Uvicorn
- PostgreSQL + SQLAlchemy 2.x + Alembic
- **Typer CLI** (Rich 출력)
- python-docx
- Local file storage

---

## 프로젝트 구조

```
docref/
├── app/
│   ├── main.py                    # FastAPI 앱 진입점
│   ├── core/
│   │   ├── config.py              # 환경 설정
│   │   ├── exceptions.py          # 도메인 예외
│   │   └── logging.py
│   ├── db/
│   │   └── base.py                # SQLAlchemy engine / session
│   ├── models/                    # SQLAlchemy ORM 모델
│   │   ├── case.py
│   │   ├── source_file.py
│   │   ├── document.py            # Document, DocumentAnchor
│   │   ├── evidence.py            # Evidence, EvidenceFileLink
│   │   ├── reference.py
│   │   ├── changeset.py           # ChangeSet, ChangeOperation
│   │   ├── projection.py          # DocumentProjection, EvidenceListProjection, FileRenamePlan
│   │   ├── snapshot.py            # VersionSnapshot
│   │   ├── integrity.py           # IntegrityReport
│   │   └── audit.py               # AuditLog
│   ├── repositories/              # DB 접근 레이어
│   ├── services/                  # 비즈니스 로직
│   ├── api/
│   │   ├── routes/                # FastAPI 라우터 (42 endpoints)
│   │   └── schemas/               # Pydantic 요청/응답 스키마
│   ├── cli/
│   │   ├── main.py                # Typer 앱 진입점
│   │   └── commands/              # CLI 명령 그룹
│   │       ├── case_cmd.py        # case create/list/show/update/audit
│   │       ├── file_cmd.py        # file upload/list/show/role
│   │       ├── document_cmd.py    # document register/parse/list
│   │       ├── evidence_cmd.py    # evidence create/list/show/update/delete/files
│   │       ├── reference_cmd.py   # reference link/unlink/list/show
│   │       ├── render_cmd.py      # render preview
│   │       ├── integrity_cmd.py   # integrity check/history
│   │       ├── change_cmd.py      # change reorder/link-refs/unlink-refs/list/show/preview/commit
│   │       ├── rollback_cmd.py    # rollback run/snapshots
│   │       ├── export_cmd.py      # export run
│   │       └── workflow_cmd.py    # workflow demo/status
│   ├── parsers/
│   │   └── docx_parser.py         # DOCX placeholder 파서
│   ├── renderers/
│   │   ├── document_renderer.py
│   │   ├── evidence_list_renderer.py
│   │   └── filename_renderer.py
│   └── storage/
│       └── local_storage.py
├── alembic/
│   └── versions/
│       └── 0001_initial_schema.py
├── tests/
│   ├── conftest.py                # pytest fixtures (SQLite in-memory)
│   ├── unit/
│   └── integration/
├── storage/
│   ├── uploads/
│   └── exports/
├── pyproject.toml
├── alembic.ini
└── .env.example
```

---

## 설치 및 실행

### 1. 의존성 설치

```bash
python3.12 -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate
pip install -e ".[dev]"
```

### 2. 환경 설정

```bash
cp .env.example .env
# .env 파일에서 DATABASE_URL 수정
```

`.env` 예시:
```
DATABASE_URL=postgresql://docref:docref@localhost:5432/docref_db
UPLOAD_DIR=./storage/uploads
EXPORT_DIR=./storage/exports
```

### 3. PostgreSQL 데이터베이스 준비

```bash
psql -U postgres -c "CREATE USER docref WITH PASSWORD 'docref';"
psql -U postgres -c "CREATE DATABASE docref_db OWNER docref;"
```

### 4. Alembic 마이그레이션

```bash
alembic upgrade head
alembic current          # 현재 버전 확인
alembic history          # 히스토리 확인
```

### 5. FastAPI 서버 실행

```bash
uvicorn app.main:app --reload --port 8000
```

- API 문서: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc
- 헬스체크: http://localhost:8000/

---

## CLI 전체 참조

### 빠른 시작 — 완전 자동 데모

```bash
# 11단계를 자동으로 순차 실행하는 데모 (DB만 준비되면 즉시 실행 가능)
docref workflow demo

# 옵션 지정
docref workflow demo \
    --name   "계약 분쟁 사건" \
    --court  "서울중앙지방법원" \
    --case-number "2024가합12345" \
    --skip-export          # export 단계 생략

# 특정 사건의 현재 워크플로우 상태 요약
docref workflow status 1
```

---

### Step 1 — 사건(Case) 관리

```bash
# ① 사건 생성
docref case create "손해배상 청구" \
    --court       "서울중앙지방법원" \
    --case-number "2024가합12345" \
    --description "2024년 계약 분쟁 사건"
# → Case created: id=1 name='손해배상 청구'

# ② 사건 목록 (페이지네이션 지원)
docref case list
docref case list --limit 10 --skip 0

# ③ 사건 상세 조회
docref case show 1

# ④ 사건 정보 수정 (변경하고 싶은 필드만 전달)
docref case update 1 --status closed
docref case update 1 --name "수정된 사건명" --court "부산지방법원"

# ⑤ 감사 로그 조회
docref case audit 1
docref case audit 1 --limit 5
docref case audit 1 --action evidence_created
```

---

### Step 2 — 파일 업로드 (File)

```bash
# ① DOCX 파일 업로드 (준비서면 — role=document)
docref file upload 1 ./brief.docx --role document
# → File uploaded: file_id=1 stored='uuid-abc.docx'

# ② 증거 파일 업로드 (role=evidence_attachment)
docref file upload 1 ./contract.pdf    --role evidence_attachment
docref file upload 1 ./receipt.pdf     --role evidence_attachment

# ③ 파일 목록
docref file list 1

# ④ 파일 상세 조회 (case_id, file_id)
docref file show 1 2

# ⑤ 파일 역할 변경
docref file role 1 2 document
docref file role 1 3 evidence_attachment
```

---

### Step 3 — 문서(Document) 등록 및 파싱

```bash
# ① DOCX 파일을 Document로 등록 (source_file_id = 업로드된 파일 ID)
docref document register 1 1 "2024년 10월 준비서면" --type main_brief
# → Document registered: doc_id=1 title='2024년 10월 준비서면'

# ② 플레이스홀더 파싱 — {{갑 제N호증}} 패턴 추출 → DocumentAnchor 생성
docref document parse 1 1
# → Parsed: 2 anchor(s) found
# ┌───────────┬────────────────────┬──────────┬──────────┐
# │ ID        │ Placeholder        │ Para #   │ Status   │
# ├───────────┼────────────────────┼──────────┼──────────┤
# │ 1         │ {{갑 제1호증}}      │ 3        │ unlinked │
# │ 2         │ {{갑 제2호증}}      │ 4        │ unlinked │
# └───────────┴────────────────────┴──────────┴──────────┘

# ③ 문서 목록
docref document list 1
```

---

### Step 4 — 증거(Evidence) 관리

```bash
# ① 갑 제1호증 — 계약서 사본 (파일 첨부 포함)
docref evidence create 1 "계약서 사본" \
    --party plaintiff \
    --order 1 \
    --files "2"

# ② 갑 제2호증 — 영수증
docref evidence create 1 "영수증" \
    --party plaintiff \
    --order 2 \
    --files "3"

# ③ 을 제1호증 — 답변서
docref evidence create 1 "답변서" \
    --party defendant \
    --order 1

# ④ 증거 목록 (전체 / 원고별 / 피고별)
docref evidence list 1
docref evidence list 1 --party plaintiff
docref evidence list 1 --party defendant

# ⑤ 증거 상세 조회
docref evidence show 1 2

# ⑥ 증거 수정
docref evidence update 1 2 --label "수정된 계약서"
docref evidence update 1 2 --order 3
docref evidence update 1 2 --inactive     # 비활성화
docref evidence update 1 2 --active       # 다시 활성화

# ⑦ 증거 첨부 파일 목록
docref evidence files 1 2

# ⑧ 증거 소프트 삭제
docref evidence delete 1 2
docref evidence delete 1 2 --force        # 확인 생략
```

---

### Step 5 — 참조(Reference) 연결

```bash
# ① DocumentAnchor → Evidence 연결 (anchor_id evidence_id)
docref reference link 1 1     # anchor 1 → evidence 1 (갑 제1호증)
docref reference link 2 2     # anchor 2 → evidence 2 (갑 제2호증)
docref reference link 1 1 --note "갑 제1호증 기재 계약서"

# ② 참조 해제 (anchor 상태 → unlinked)
docref reference unlink 1
docref reference unlink 1 --force

# ③ 참조 목록 (사건 전체 / 특정 증거별)
docref reference list 1                   # 사건 1의 모든 활성 참조
docref reference list 1 --evidence 2      # 증거 2에 대한 참조만

# ④ 참조 상세 조회
docref reference show 1
```

---

### Step 6 — 렌더 미리보기

```bash
# ① 현재 상태 전체 미리보기 (증거목록 + 파일 rename 계획 + 본문)
docref render preview 1

# ② 특정 ChangeSet 기준으로 미리보기
docref render preview 1 --change-set 3

# ③ 본문 단락 표시 생략
docref render preview 1 --no-document
```

출력 예시:
```
Evidence List Preview — Case 1
┌─────────────────┬────────────────────────┐
│ Rendered Number │ Label                  │
├─────────────────┼────────────────────────┤
│ 갑 제1호증       │ 계약서 사본             │
│ 갑 제2호증       │ 영수증                  │
└─────────────────┴────────────────────────┘

File Rename Preview
┌─────────────────────┬───┬───────────────────────────────┐
│ Current Filename    │ → │ Planned Filename               │
├─────────────────────┼───┼───────────────────────────────┤
│ uuid-abc.docx       │ → │ 갑제1호증_계약서사본.docx        │
└─────────────────────┴───┴───────────────────────────────┘
```

---

### Step 7 — 무결성 검사 (Integrity Check)

```bash
# ① 무결성 검사 실행
docref integrity check 1
# → ✓ PASS — All integrity checks passed.

# ② 상세 출력 (위반 사항 + 경고 표시)
docref integrity check 1 --verbose

# ③ 검사 히스토리
docref integrity history 1
docref integrity history 1 --limit 5
```

검사 항목:
| 검사 | 설명 |
|------|------|
| `UNLINKED_ANCHOR` | Reference 없는 DocumentAnchor |
| `REFERENCE_TO_INACTIVE_EVIDENCE` | 비활성 Evidence를 가리키는 Reference |
| `MISSING_SOURCE_FILE_RECORD` | DB에 존재하지 않는 SourceFile 참조 |
| `MISSING_FILE_ON_DISK` | 디스크에 파일이 없는 경우 |
| `DUPLICATE_SORT_ORDER` | 동일 party에 중복 sort_order |

---

### Step 8 — 변경 집합(ChangeSet) 관리

#### 8-A. 증거 순서 재배치 (reorder)

```bash
# ① 증거 순서 변경 ChangeSet 생성 (DRAFT 상태)
# 형식: "evidence_id:new_sort_order,..."
docref change reorder 1 "2:1,1:2" \
    --description "증거 순서 교환: 영수증을 1번으로"
# → ChangeSet created: id=1 status=draft

# ② 미리보기 (변경 후 증거목록 + 파일 rename 계획)
docref change preview 1

# ③ 커밋 (DB 업데이트 + 파일 rename 실행)
docref change commit 1
docref change commit 1 --force    # 확인 프롬프트 생략
# → Committed! version=v1 files_renamed=2
```

#### 8-B. 참조 연결 ChangeSet (link-refs)

```bash
# anchor_id:evidence_id 형식으로 여러 링크를 한 번에 생성
docref change link-refs 1 "1:2,3:4" \
    --description "참조 연결 일괄 처리"
docref change preview 2
docref change commit 2
```

#### 8-C. 참조 해제 ChangeSet (unlink-refs)

```bash
# 쉼표로 구분된 Reference ID들을 일괄 해제
docref change unlink-refs 1 "1,2" \
    --description "참조 해제 일괄 처리"
docref change preview 3
docref change commit 3
```

#### 8-D. ChangeSet 조회

```bash
# 사건의 모든 ChangeSet 목록
docref change list 1
docref change list 1 --limit 5

# ChangeSet 상세 (operations 포함)
docref change show 1 2
```

---

### Step 9 — 롤백 (Rollback)

```bash
# ① 버전 스냅샷 목록 확인
docref rollback snapshots 1
docref rollback snapshots 1 --limit 5

# ② 특정 ChangeSet의 스냅샷으로 롤백 (새 �back ChangeSet 생성)
docref rollback run 1 1        # case 1을 ChangeSet 1 시점으로 복원
docref rollback run 1 1 --force
# → Rollback complete
#   New ChangeSet ID: 4
#   Version Label:    v3
#   Message: Rolled back to snapshot at changeset 1
```

롤백은 **기존 데이터를 덮어쓰지 않고** 새로운 rollback ChangeSet을 생성합니다.

---

### Step 10 — 내보내기 (Export)

```bash
# ① 전체 내보내기 (무결성 검사 자동 실행 후 진행)
docref export run 1
# → Export complete → ./storage/exports/case_1_20241015_143022/
#   📄 rendered_brief.docx
#   📄 evidence_list.docx
#   📄 file_rename_manifest.json

# ② 선택적 내보내기
docref export run 1 --no-rename-manifest   # manifest 제외
docref export run 1 --no-document          # 본문 DOCX 제외
docref export run 1 --no-evidence-list     # 증거목록 제외
```

`file_rename_manifest.json` 예시:
```json
[
  {
    "source_file_id": 2,
    "current_filename": "uuid-abc.pdf",
    "planned_filename": "갑제1호증_계약서사본.pdf"
  }
]
```

---

### 워크플로우 헬퍼 명령

```bash
# 11단계 전체를 자동 실행 (데모용)
docref workflow demo
docref workflow demo --name "테스트 사건" --skip-export

# 사건의 현재 상태 요약 (파일 수, 증거 수, 참조 수, 무결성 결과 등)
docref workflow status 1
```

`docref workflow demo` 는 다음을 순서대로 실행합니다:
1. 사건 생성
2. DOCX 파일 업로드 (role=document)
3. 증거 첨부 파일 2개 업로드 (role=evidence_attachment)
4. 문서 등록
5. 플레이스홀더 파싱 (DocumentAnchor 추출)
6. Evidence 2건 생성 (갑 제1·2호증)
7. DocumentAnchor → Evidence 참조 연결
8. 렌더 미리보기
9. 무결성 검사
10. 순서 교환 ChangeSet 생성 + 미리보기
11. ChangeSet 커밋
12. (선택) 내보내기

---

### 전체 수동 워크플로우 예제 (copy & paste)

```bash
# ────────────────────────────────────────────────
# 1. 사건 생성
# ────────────────────────────────────────────────
docref case create "손해배상 청구" \
    --court "서울중앙지방법원" \
    --case-number "2024가합12345"

# ────────────────────────────────────────────────
# 2. 파일 업로드
# ────────────────────────────────────────────────
docref file upload 1 ./brief.docx         --role document
docref file upload 1 ./contract.pdf       --role evidence_attachment
docref file upload 1 ./receipt.pdf        --role evidence_attachment
docref file list 1

# ────────────────────────────────────────────────
# 3. 문서 등록 + 파싱 (file_id=1 은 DOCX)
# ────────────────────────────────────────────────
docref document register 1 1 "2024년 10월 준비서면" --type main_brief
docref document parse 1 1           # → anchor_id: 1, 2 출력됨

# ────────────────────────────────────────────────
# 4. 증거 생성 (파일 첨부)
# ────────────────────────────────────────────────
docref evidence create 1 "계약서 사본" --party plaintiff --order 1 --files "2"
docref evidence create 1 "영수증"     --party plaintiff --order 2 --files "3"
docref evidence list 1

# ────────────────────────────────────────────────
# 5. 참조 연결 (anchor → evidence)
# ────────────────────────────────────────────────
docref reference link 1 1     # anchor 1 → evidence 1
docref reference link 2 2     # anchor 2 → evidence 2
docref reference list 1

# ────────────────────────────────────────────────
# 6. 렌더 미리보기
# ────────────────────────────────────────────────
docref render preview 1

# ────────────────────────────────────────────────
# 7. 무결성 검사
# ────────────────────────────────────────────────
docref integrity check 1 --verbose

# ────────────────────────────────────────────────
# 8. 순서 변경: 영수증(id=2)을 1번으로, 계약서(id=1)를 2번으로
# ────────────────────────────────────────────────
docref change reorder 1 "2:1,1:2" --description "순서 교환"
docref change preview 1            # change_set_id = 1
docref change commit 1 --force

# ────────────────────────────────────────────────
# 9. 커밋 후 상태 확인
# ────────────────────────────────────────────────
docref render preview 1
docref integrity check 1
docref rollback snapshots 1

# ────────────────────────────────────────────────
# 10. 롤백 (ChangeSet 1의 스냅샷으로 복원)
# ────────────────────────────────────────────────
docref rollback run 1 1 --force

# ────────────────────────────────────────────────
# 11. 내보내기
# ────────────────────────────────────────────────
docref export run 1

# 워크플로우 상태 요약
docref workflow status 1
```

---

## API Endpoints (42개)

### Cases
| Method | Path | 설명 |
|--------|------|------|
| POST | `/cases` | 사건 생성 |
| GET | `/cases` | 사건 목록 (페이지네이션) |
| GET | `/cases/{case_id}` | 사건 상세 |
| PATCH | `/cases/{case_id}` | 사건 수정 |
| GET | `/cases/{case_id}/audit-logs` | 감사 로그 조회 |

### Files
| Method | Path | 설명 |
|--------|------|------|
| POST | `/cases/{case_id}/files` | 파일 업로드 |
| GET | `/cases/{case_id}/files` | 파일 목록 |
| GET | `/cases/{case_id}/files/{file_id}` | 파일 상세 |
| PATCH | `/cases/{case_id}/files/{file_id}/role` | 파일 역할 수정 |

### Documents
| Method | Path | 설명 |
|--------|------|------|
| POST | `/cases/{case_id}/documents` | 문서 등록 |
| GET | `/cases/{case_id}/documents` | 문서 목록 |
| GET | `/cases/{case_id}/documents/{doc_id}` | 문서 상세 |
| POST | `/cases/{case_id}/documents/{doc_id}/parse-placeholders` | 플레이스홀더 파싱 |
| GET | `/cases/{case_id}/documents/{doc_id}/anchors` | Anchor 목록 |

### Evidences
| Method | Path | 설명 |
|--------|------|------|
| POST | `/cases/{case_id}/evidences` | 증거 생성 |
| GET | `/cases/{case_id}/evidences` | 증거 목록 |
| GET | `/cases/{case_id}/evidences/{ev_id}` | 증거 상세 |
| PATCH | `/cases/{case_id}/evidences/{ev_id}` | 증거 수정 |
| DELETE | `/cases/{case_id}/evidences/{ev_id}` | 증거 소프트 삭제 |
| GET | `/cases/{case_id}/evidences/{ev_id}/references` | 증거별 참조 목록 |
| POST | `/cases/{case_id}/evidences/{ev_id}/files` | 파일 링크 추가 |
| DELETE | `/cases/{case_id}/evidences/{ev_id}/files/{link_id}` | 파일 링크 삭제 |

### References
| Method | Path | 설명 |
|--------|------|------|
| POST | `/references` | 참조 연결 |
| GET | `/references/{ref_id}` | 참조 상세 |
| DELETE | `/references/{ref_id}` | 참조 해제 |

### Render
| Method | Path | 설명 |
|--------|------|------|
| POST | `/cases/{case_id}/render-preview` | 전체 미리보기 렌더 |

### Change Sets
| Method | Path | 설명 |
|--------|------|------|
| GET | `/cases/{case_id}/changes` | ChangeSet 목록 |
| GET | `/cases/{case_id}/changes/{cs_id}` | ChangeSet 상세 |
| POST | `/cases/{case_id}/changes/reorder` | 순서 변경 ChangeSet |
| POST | `/cases/{case_id}/changes/link-references` | 참조 연결 ChangeSet |
| POST | `/cases/{case_id}/changes/unlink-references` | 참조 해제 ChangeSet |
| POST | `/changes/{cs_id}/preview` | ChangeSet 미리보기 |
| POST | `/changes/{cs_id}/commit` | ChangeSet 커밋 |

### Rollback & Snapshots
| Method | Path | 설명 |
|--------|------|------|
| POST | `/cases/{case_id}/rollback` | 롤백 |
| GET | `/cases/{case_id}/snapshots` | 버전 스냅샷 목록 |

### Integrity
| Method | Path | 설명 |
|--------|------|------|
| GET | `/cases/{case_id}/integrity-check` | 무결성 검사 실행 |
| GET | `/cases/{case_id}/integrity-check/history` | 검사 히스토리 |

### Export
| Method | Path | 설명 |
|--------|------|------|
| POST | `/cases/{case_id}/export` | 내보내기 |

---

## 테스트 실행

```bash
# 전체 테스트 (SQLite in-memory, PostgreSQL 불필요)
pytest

# 커버리지 포함
pytest --cov=app --cov-report=term-missing

# HTML 커버리지 리포트
pytest --cov=app --cov-report=html

# 단위 테스트만
pytest tests/unit/ -v

# 통합 테스트만
pytest tests/integration/ -v

# 특정 시나리오
pytest tests/unit/test_change_service.py -v       # 핵심 ChangeSet 흐름
pytest tests/integration/test_e2e_flow.py -v      # 엔드투엔드 시나리오
pytest -k "rollback"                              # 롤백 관련 테스트만
pytest -k "integrity"                             # 무결성 검사 관련

# 현재 결과 (2024-04-23 기준)
# ✅ 187 passed, 0 failed  |  커버리지 83%
```

### 테스트 계층 구조

| 파일 | 테스트 수 | 핵심 시나리오 |
|------|-----------|--------------|
| `unit/test_change_service.py` | 39 | Happy path, 무결성 위반 차단, 커밋 전 rename 금지, rollback 신규 버전 |
| `unit/test_case_service.py` | 8 | Case CRUD, 상태 전환 |
| `unit/test_evidence_service.py` | 12 | 증거 번호 계산, sort_order |
| `unit/test_integrity_service.py` | 7 | UNLINKED_ANCHOR, MISSING_FILE_ON_DISK |
| `unit/test_reference_service.py` | 8 | Reference 생성/비활성화/supersede |
| `unit/test_file_service.py` | 10 | 파일 업로드, 해시 중복 방지 |
| `unit/test_document_service.py` | 11 | 문서 등록, 플레이스홀더 파싱 |
| `unit/test_audit_service.py` | 8 | 감사 로그 필터링, 페이지네이션 |
| `unit/test_renderers.py` | 8 | 문서/파일명 렌더러 |
| `unit/test_storage.py` | 9 | 파일 저장/해시/rename |
| `unit/test_docx_parser.py` | 6 | DOCX 파싱, 플레이스홀더 추출 |
| `integration/test_e2e_flow.py` | 2 | 전체 워크플로, 롤백 흐름 |
| `integration/test_api_cases.py` | 9 | REST 엔드포인트 |
| `integration/test_api_evidences.py` | 8 | 증거 API |
| `integration/test_api_files.py` | 10 | 파일 업로드 API |
| `integration/test_api_documents.py` | 14 | 문서 등록/파싱 API |
| `integration/test_api_integrity.py` | 5 | 무결성 검사 API |

### 4대 핵심 검증 항목

```
1. Happy path          → TestCommitChangeset  (sort_order 반영, v1 버전 생성)
2. 무결성 위반 차단     → TestIntegrityBlocksCommit  (UNLINKED_ANCHOR 시 IntegrityViolationError)
3. 커밋 전 rename 금지  → TestRenameBeforeCommitProhibited  (FileRenamePlan.status='planned' 유지)
4. 롤백 신규 버전 생성  → TestRollback  (새 ChangeSet ID, 스냅샷 복원)
```

---

## 엔티티 관계

```
Case
 ├── SourceFile (업로드 파일, 불변 UUID 파일명)
 ├── Document (DOCX 문서 등록)
 │    └── DocumentAnchor (파싱된 플레이스홀더 {{갑 제N호증}})
 │         └── Reference ──────────────────────────────────┐
 ├── Evidence (party + sort_order → 번호는 projection)  ◄──┘
 │    └── EvidenceFileLink → SourceFile
 ├── ChangeSet (reorder / link / unlink 변경 묶음)
 │    ├── ChangeOperation (개별 연산)
 │    ├── DocumentProjection (렌더 결과 캐시)
 │    ├── EvidenceListProjection (증거목록 렌더 캐시)
 │    ├── FileRenamePlan (파일명 변경 계획)
 │    └── VersionSnapshot (커밋 시점 상태 스냅샷)
 ├── IntegrityReport (무결성 검사 결과)
 └── AuditLog (변경 이력)
```

---

## 설계 결정

### Change-Set 흐름
```
DRAFT → (preview) → DRAFT/PREVIEWED → (commit) → COMMITTED
                                    ↘ (discard) → DISCARDED
```
- 모든 변경(순서 변경, 참조 연결/해제)은 **ChangeSet**으로 묶어 커밋 시에만 반영
- 커밋 전에 파일 rename은 절대 실행하지 않음
- 롤백은 기존 ChangeSet을 덮어쓰지 않고 새 rollback ChangeSet을 생성

### 번호 계산 방식
증거 번호는 `sort_order`에서 실시간으로 계산되는 **projection**:
- `sort_order=1`, `party=plaintiff` → **갑 제1호증**
- `sort_order=2`, `party=defendant` → **을 제2호증**

파일명 역시 `{party_label}{sort_order}_{label}.{ext}` 형식으로 계산됨.

---

## MVP 제외 기능

- OCR, LLM, 자동 파일명 생성
- HWP/HWPX 지원
- 이메일/Drive 연동
- 전자소송 업로드 자동화
- 웹 프론트엔드
- 인증/인가

---

## 개발 환경 빠른 실행

```bash
# 1. 의존성 설치
pip install -e ".[dev]"

# 2. .env 설정
cp .env.example .env

# 3. 마이그레이션 (PostgreSQL)
alembic upgrade head

# 4. API 서버
uvicorn app.main:app --reload

# 5. 테스트 (PostgreSQL 불필요 — SQLite in-memory)
pytest

# 6. CLI 데모 (DB 준비 후)
docref workflow demo
```

---

*This file is maintained by the `genspark_ai_developer` branch.*
