# 자격증 시험 관리 시스템

> 시험 신청 → 입금 확인 → 시험 응시 → 결과 발표 → 자격증 발급까지 원스톱으로 관리하는 웹 서비스

---

## 📋 프로젝트 개요

| 항목 | 내용 |
|------|------|
| **프레임워크** | Next.js 16 (App Router) |
| **언어** | TypeScript |
| **DB / Auth** | Supabase (PostgreSQL + Auth) |
| **스타일링** | Tailwind CSS |
| **배포** | Vercel (권장) |

---

## 🔄 서비스 흐름 (상태값)

```
[시험 신청] → waiting_payment
     ↓ (관리자: 입금 확인)
  approved
     ↓ (사용자: 시험 응시)
  exam_completed
     ↓ (관리자: 점수 입력)
  passed / failed
     ↓ (합격 시, 관리자: 자격증 발급)
  certificate_ready
```

| 상태값 | 설명 |
|--------|------|
| `waiting_payment` | 시험 신청 완료, 입금 대기 중 |
| `approved` | 입금 확인 완료, 응시 가능 |
| `exam_completed` | 시험 응시 완료, 채점 대기 |
| `passed` | 합격 |
| `failed` | 불합격 |
| `certificate_ready` | 자격증 발급 완료 |

---

## 📁 폴더 구조

```
src/
├── app/
│   ├── (auth)/                   # 인증 그룹 (레이아웃 분리)
│   │   ├── layout.tsx            # 인증 공통 레이아웃 (로고 + 카드)
│   │   ├── login/page.tsx        # 로그인 페이지
│   │   └── signup/page.tsx       # 회원가입 페이지
│   │
│   ├── (user)/                   # 일반 사용자 그룹
│   │   ├── layout.tsx            # 사용자 공통 레이아웃 (Navbar)
│   │   ├── dashboard/page.tsx    # 내 현황 (진행 단계 시각화)
│   │   ├── exam/
│   │   │   ├── apply/page.tsx    # 시험 신청 페이지
│   │   │   ├── take/page.tsx     # 시험 응시 페이지 (타이머 포함)
│   │   │   └── result/page.tsx   # 결과 조회 페이지
│   │   └── certificate/page.tsx  # 자격증 다운로드 페이지
│   │
│   ├── admin/                    # 관리자 전용
│   │   ├── layout.tsx            # 관리자 레이아웃 (권한 체크)
│   │   ├── page.tsx              # 관리자 대시보드 (통계)
│   │   ├── applications/page.tsx # 신청 관리 (상태별 필터)
│   │   ├── exams/page.tsx        # 시험 회차 관리
│   │   ├── users/page.tsx        # 회원 관리
│   │   └── certificates/page.tsx # 자격증 발급 현황
│   │
│   ├── layout.tsx                # 루트 레이아웃
│   └── page.tsx                  # 루트 (로그인 여부에 따라 리다이렉트)
│
├── components/
│   ├── ui/
│   │   ├── Navbar.tsx            # 내비게이션 바 (역할별 메뉴)
│   │   ├── StatusBadge.tsx       # 상태값 배지 컴포넌트
│   │   └── StatusStepper.tsx     # 진행 단계 시각화 컴포넌트
│   ├── auth/
│   │   └── LoginForm.tsx         # 로그인 폼 (Suspense 처리)
│   ├── exam/
│   │   ├── ExamApplyForm.tsx     # 시험 신청 버튼/폼
│   │   └── ExamTakeClient.tsx    # 시험 응시 (타이머 + 답안 제출)
│   └── admin/
│       └── AdminApplicationActions.tsx  # 관리자 신청 상태 변경
│
├── lib/
│   ├── supabase/
│   │   ├── client.ts             # 클라이언트용 Supabase 클라이언트
│   │   ├── server.ts             # 서버용 Supabase 클라이언트
│   │   └── middleware.ts         # 미들웨어용 (세션 갱신 + 라우팅 보호)
│   └── utils/
│       ├── cn.ts                 # Tailwind 클래스 병합 유틸
│       └── format.ts             # 날짜/금액 포맷 유틸
│
├── hooks/
│   └── useExamApplication.ts     # 현재 사용자 시험 신청 정보 훅
│
├── middleware.ts                  # Next.js 미들웨어 (라우팅 보호)
└── types/
    └── index.ts                  # 전체 타입 정의 (ExamStatus, Profile, Exam 등)

supabase/
└── schema.sql                    # DB 스키마 (테이블 + RLS + 트리거)
```

---

## 🗄️ 데이터 모델

| 테이블 | 설명 |
|--------|------|
| `profiles` | 사용자 프로필 (role: user/admin) |
| `exams` | 시험 회차 정보 (제목, 날짜, 응시료, 합격 기준) |
| `exam_applications` | 시험 신청 내역 (status 상태값 관리) |
| `exam_questions` | 시험 문제 (선택지, 정답) |
| `exam_answers` | 응시자 답안 |
| `certificates` | 발급된 자격증 (자격증 번호, PDF URL) |

---

## 🚀 시작하기

### 1. 의존성 설치
```bash
npm install
```

### 2. 환경변수 설정
```bash
cp .env.example .env.local
# .env.local 파일에 Supabase URL과 키 입력
```

### 3. Supabase 설정
- Supabase 프로젝트 생성
- `supabase/schema.sql` 실행 (SQL Editor에서)
- 환경변수에 URL과 Anon Key 입력

### 4. 개발 서버 실행
```bash
npm run dev
```

---

## 👤 사용자 역할

| 역할 | 접근 가능 페이지 |
|------|-----------------|
| **일반 사용자** | 로그인/회원가입, 내 현황, 시험 신청, 시험 응시, 결과 조회, 자격증 |
| **관리자** | 위 모든 페이지 + 관리자 전용 (신청관리, 시험관리, 회원관리, 자격증관리) |

> 관리자 설정: Supabase Table Editor에서 `profiles.role` 값을 `admin`으로 변경

---

## 🔐 라우팅 보호

| 경로 | 보호 방식 |
|------|----------|
| `/dashboard`, `/exam/*`, `/certificate` | 로그인 필요 |
| `/admin/*` | 로그인 + `role = admin` 필요 |
| `/login`, `/signup` | 로그인 상태면 `/dashboard`로 리다이렉트 |

---

## ✅ 구현 완료

- [x] 회원가입 / 로그인
- [x] 역할 기반 접근 제어 (미들웨어)
- [x] 시험 신청 페이지
- [x] 시험 응시 페이지 (타이머 + 자동 제출)
- [x] 결과 조회 페이지
- [x] 자격증 다운로드 페이지
- [x] 관리자 대시보드 (통계)
- [x] 관리자 신청 관리 (상태 변경)
- [x] 관리자 회원 관리
- [x] 관리자 시험 관리
- [x] 관리자 자격증 관리
- [x] 진행 단계 시각화 (StatusStepper)
- [x] Supabase RLS 보안 정책

## 🔜 다음 개발 예정

- [ ] 시험 문제 관리 UI (관리자)
- [ ] 이메일 알림 (상태 변경 시)
- [ ] 자격증 PDF 자동 생성
- [ ] 결제 연동 (토스페이먼츠 등)
- [ ] 마이페이지 (프로필 수정)
- [ ] 시험 응시 시 부정행위 방지
