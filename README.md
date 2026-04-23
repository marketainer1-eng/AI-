# DocRef — Document Reference Integrity Management System

법률 문서 작업에서 **본문 증거 번호 · 증거목록 · 파일명 · 실제 저장 파일** 간의  
참조 무결성을 유지하는 CLI 기반 백엔드 시스템.

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
- Typer CLI
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
│   │   ├── routes/                # FastAPI 라우터
│   │   └── schemas/               # Pydantic 요청/응답 스키마
│   ├── cli/
│   │   ├── main.py                # Typer 앱 진입점
│   │   └── commands/              # CLI 명령 그룹
│   ├── parsers/
│   │   └── docx_parser.py         # DOCX placeholder 파서
│   ├── renderers/
│   │   ├── document_renderer.py   # 본문 렌더러
│   │   ├── evidence_list_renderer.py
│   │   └── filename_renderer.py
│   └── storage/
│       └── local_storage.py       # 로컬 파일 저장소
├── alembic/                       # DB 마이그레이션
│   └── versions/
│       └── 0001_initial_schema.py
├── tests/
│   ├── conftest.py                # pytest fixtures (SQLite in-memory)
│   ├── unit/                      # 유닛 테스트
│   └── integration/               # API/E2E 통합 테스트
├── storage/
│   ├── uploads/                   # 업로드 파일 저장 경로
│   └── exports/                   # 내보내기 결과 저장 경로
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
# PostgreSQL이 실행 중이어야 함
psql -U postgres -c "CREATE USER docref WITH PASSWORD 'docref';"
psql -U postgres -c "CREATE DATABASE docref_db OWNER docref;"
```

### 4. Alembic 마이그레이션

```bash
# 첫 마이그레이션 실행
alembic upgrade head

# 마이그레이션 상태 확인
alembic current

# 마이그레이션 히스토리
alembic history
```

### 5. FastAPI 서버 실행

```bash
uvicorn app.main:app --reload --port 8000
```

서버 실행 후 브라우저에서:
- API 문서: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc
- 헬스체크: http://localhost:8000/

---

## CLI 사용법

### 사건(Case) 관리

```bash
# 사건 생성
docref case create "손해배상 청구" --court "서울중앙지방법원" --case-number "2024가합12345"

# 사건 목록
docref case list

# 사건 상세
docref case show 1
```

### 파일 업로드

```bash
# DOCX 파일 업로드 (문서용)
docref file upload 1 ./brief.docx --role document

# 증거 파일 업로드
docref file upload 1 ./contract.pdf --role evidence_attachment

# 파일 목록
docref file list 1
```

### 문서(Document) 관리

```bash
# 문서 등록 (source_file_id = 업로드된 파일 ID)
docref document register 1 2 "2024년 10월 준비서면" --type main_brief

# 플레이스홀더 파싱
docref document parse 1 1

# 문서 목록
docref document list 1
```

### 증거(Evidence) 관리

```bash
# 증거 생성 (갑)
docref evidence create 1 "계약서 사본" --party plaintiff --order 1

# 증거 생성 (을)
docref evidence create 1 "답변서" --party defendant --order 1

# 증거에 파일 첨부
docref evidence create 1 "영수증" --party plaintiff --files "3,4"

# 증거 목록
docref evidence list 1
docref evidence list 1 --party plaintiff
```

### 참조(Reference) 연결

```bash
# DocumentAnchor(id=1)를 Evidence(id=2)에 연결
docref reference link 1 2

# 연결 해제
docref reference unlink 1
```

### 렌더 미리보기

```bash
# 현재 상태로 미리보기
docref render preview 1

# 특정 ChangeSet 기준으로 미리보기
docref render preview 1 --change-set 3
```

### 무결성 검사

```bash
# 무결성 검사 실행
docref integrity check 1

# 검사 히스토리
docref integrity history 1 --limit 5
```

### 변경 집합(ChangeSet) 관리

```bash
# 증거 순서 변경 ChangeSet 생성
# 형식: "evidence_id:new_order,..."
docref change reorder 1 "3:1,1:2,2:3" --description "증거 순서 재배치"

# ChangeSet 미리보기
docref change preview 1

# ChangeSet 커밋 (파일 rename 실행)
docref change commit 1
docref change commit 1 --force   # 확인 프롬프트 생략
```

### 롤백

```bash
# ChangeSet 1의 VersionSnapshot으로 롤백
docref rollback run 1 1
docref rollback run 1 1 --force
```

### 내보내기

```bash
# 전체 내보내기
docref export run 1

# 선택적 내보내기
docref export run 1 --no-rename-manifest
docref export run 1 --no-document
```

---

## API Endpoints

| Method | Path | 설명 |
|--------|------|------|
| POST | `/cases` | 사건 생성 |
| GET | `/cases` | 사건 목록 |
| GET | `/cases/{case_id}` | 사건 상세 |
| PATCH | `/cases/{case_id}` | 사건 수정 |
| POST | `/cases/{case_id}/files` | 파일 업로드 |
| GET | `/cases/{case_id}/files` | 파일 목록 |
| POST | `/cases/{case_id}/documents` | 문서 등록 |
| GET | `/cases/{case_id}/documents` | 문서 목록 |
| POST | `/cases/{case_id}/documents/{doc_id}/parse-placeholders` | 플레이스홀더 파싱 |
| POST | `/cases/{case_id}/evidences` | 증거 생성 |
| GET | `/cases/{case_id}/evidences` | 증거 목록 |
| GET | `/cases/{case_id}/evidences/{ev_id}` | 증거 상세 |
| PATCH | `/cases/{case_id}/evidences/{ev_id}` | 증거 수정 |
| POST | `/references` | Reference 연결 |
| GET | `/references/{ref_id}` | Reference 조회 |
| DELETE | `/references/{ref_id}` | Reference 해제 |
| POST | `/cases/{case_id}/render-preview` | 전체 미리보기 렌더 |
| GET | `/cases/{case_id}/integrity-check` | 무결성 검사 |
| GET | `/cases/{case_id}/integrity-check/history` | 검사 히스토리 |
| POST | `/cases/{case_id}/changes/reorder` | 순서 변경 ChangeSet 생성 |
| POST | `/changes/{change_set_id}/preview` | ChangeSet 미리보기 |
| POST | `/changes/{change_set_id}/commit` | ChangeSet 커밋 |
| POST | `/cases/{case_id}/rollback` | 롤백 |
| POST | `/cases/{case_id}/export` | 내보내기 |

---

## 테스트 실행

```bash
# 전체 테스트 (SQLite in-memory, PostgreSQL 불필요)
pytest

# 커버리지 포함
pytest --cov=app --cov-report=html

# 특정 테스트만
pytest tests/unit/test_case_service.py -v
pytest tests/unit/test_docx_parser.py -v
pytest tests/integration/test_e2e_flow.py -v

# 마커 기준
pytest -k "test_create_case"
```

---

## 엔티티 관계

```
Case
 ├── SourceFile (업로드 파일, 불변 UUID 파일명)
 ├── Document (DOCX 문서 등록)
 │    └── DocumentAnchor (파싱된 플레이스홀더 {{갑 제N호증}})
 │         └── Reference ──────────────────────────┐
 ├── Evidence (party + sort_order → 번호는 projection)◄─┘
 │    └── EvidenceFileLink → SourceFile
 ├── ChangeSet (reorder 등 변경 묶음)
 │    ├── ChangeOperation (개별 연산)
 │    ├── DocumentProjection (렌더 결과 캐시)
 │    ├── EvidenceListProjection (증거목록 렌더 캐시)
 │    ├── FileRenamePlan (파일명 변경 계획)
 │    └── VersionSnapshot (커밋 시점 상태 스냅샷)
 ├── IntegrityReport (무결성 검사 결과)
 └── AuditLog (변경 이력)
```

---

## MVP 제외 기능

- OCR, LLM, 자동 파일명 생성
- HWP/HWPX 지원
- 이메일/Drive 연동
- 전자소송 업로드 자동화
- 웹 프론트엔드
- 인증/인가

---

## 개발 환경 빠른 실행 (Docker Compose 없이)

```bash
# 1. PostgreSQL 로컬 실행 가정
# 2. 의존성 설치
pip install -e ".[dev]"

# 3. .env 설정
cp .env.example .env

# 4. 마이그레이션
alembic upgrade head

# 5. API 서버
uvicorn app.main:app --reload

# 6. 테스트 (PostgreSQL 불필요 — SQLite in-memory)
pytest
```
