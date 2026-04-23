# 자격증 시험 관리 시스템

> 시험 신청 → 입금 확인 → 시험 응시 → 결과 발표 → 자격증 발급까지 End-to-End로 처리하는 웹 서비스

---

## 📌 프로젝트 개요

| 항목 | 내용 |
|------|------|
| 프레임워크 | Next.js 16 (App Router) |
| 인증 / DB | Supabase (Auth + PostgreSQL) |
| 스타일 | Tailwind CSS |
| 언어 | TypeScript |
| 배포 | Vercel (권장) |

---

## 🔄 서비스 흐름 및 상태값

```
[사용자 신청]
     │
     ▼
waiting_payment  ─── 입금 대기 중 (관리자가 입금 확인 후 변경)
     │
     ▼ (관리자: 입금 확인)
approved         ─── 응시 가능 상태
     │
     ▼ (사용자: 시험 응시 완료)
exam_completed   ─── 채점 대기
     │
     ├─▶ passed          ─── 합격 (점수 >= 기준)
     │        │
     │        ▼ (관리자: 자격증 발급)
     │   certificate_ready ─── 자격증 발급 완료
     │
     └─▶ failed          ─── 불합격 (재응시 가능)
```

---

## 📁 폴더 구조

```
exam-certification/
├── src/
│   ├── app/
│   │   ├── (auth)/                  # 인증 레이아웃 그룹
│   │   │   ├── layout.tsx           # 인증 공통 레이아웃 (중앙 카드 UI)
│   │   │   ├── login/page.tsx       # 로그인 페이지
│   │   │   └── signup/page.tsx      # 회원가입 페이지
│   │   │
│   │   ├── (user)/                  # 일반 사용자 레이아웃 그룹
│   │   │   ├── layout.tsx           # 사용자 공통 레이아웃 (Navbar 포함)
│   │   │   ├── dashboard/page.tsx   # 내 현황 대시보드
│   │   │   ├── exam/
│   │   │   │   ├── apply/page.tsx   # 시험 신청 페이지
│   │   │   │   ├── take/page.tsx    # 시험 응시 페이지
│   │   │   │   └── result/page.tsx  # 결과 조회 페이지
│   │   │   └── certificate/
│   │   │       └── page.tsx         # 자격증 다운로드 페이지
│   │   │
│   │   ├── admin/                   # 관리자 영역 (role=admin 만 접근)
│   │   │   ├── layout.tsx           # 관리자 레이아웃
│   │   │   ├── page.tsx             # 관리자 대시보드 (통계)
│   │   │   ├── applications/page.tsx # 신청 관리 (상태 변경)
│   │   │   ├── exams/page.tsx       # 시험 회차 관리
│   │   │   ├── users/page.tsx       # 회원 관리
│   │   │   └── certificates/page.tsx # 자격증 발급 현황
│   │   │
│   │   ├── layout.tsx               # 루트 레이아웃
│   │   └── page.tsx                 # 루트 (역할별 리다이렉트)
│   │
│   ├── components/
│   │   ├── ui/
│   │   │   ├── Navbar.tsx           # 공통 네비게이션 바
│   │   │   ├── StatusBadge.tsx      # 상태값 뱃지 컴포넌트
│   │   │   └── StatusStepper.tsx    # 진행 단계 시각화 컴포넌트
│   │   ├── auth/
│   │   │   └── LoginForm.tsx        # 로그인 폼 (useSearchParams 분리)
│   │   ├── exam/
│   │   │   ├── ExamApplyForm.tsx    # 시험 신청 버튼/폼
│   │   │   └── ExamTakeClient.tsx   # 시험 응시 클라이언트 컴포넌트 (타이머/답안)
│   │   ├── admin/
│   │   │   └── AdminApplicationActions.tsx  # 관리자 신청 상태 변경 버튼
│   │   └── certificate/             # (자격증 PDF 생성 등 추후 구현)
│   │
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts            # 브라우저용 Supabase 클라이언트
│   │   │   ├── server.ts            # 서버용 Supabase 클라이언트
│   │   │   └── middleware.ts        # 미들웨어용 세션 갱신 + 라우팅 보호
│   │   └── utils/
│   │       ├── cn.ts                # Tailwind 클래스 병합 유틸
│   │       └── format.ts            # 날짜/금액/자격증번호 포맷 유틸
│   │
│   ├── hooks/
│   │   └── useExamApplication.ts   # 내 최신 시험 신청 조회 훅
│   │
│   ├── middleware.ts                # Next.js 미들웨어 진입점
│   └── types/
│       └── index.ts                # 모든 타입 정의 (ExamStatus, Profile, Exam 등)
│
├── supabase/
│   └── schema.sql                  # DB 스키마 전체 (RLS 포함)
│
├── public/
│   └── certificates/               # 발급된 자격증 PDF 저장 (또는 Supabase Storage)
│
├── .env.local                      # 환경변수 (git 제외)
├── .env.example                    # 환경변수 예시 (git 포함)
└── README.md
```

---

## 🗃️ 데이터 모델

### 테이블 관계
```
auth.users (Supabase)
    │
    └──▶ profiles          (id = auth.users.id)
              │
              └──▶ exam_applications ──▶ exams
                        │
                        ├──▶ exam_answers ──▶ exam_questions
                        │
                        └──▶ certificates
```

### 핵심 테이블

| 테이블 | 설명 |
|--------|------|
| `profiles` | 사용자 프로필 (role: user/admin) |
| `exams` | 시험 회차 정보 (시험일, 응시료, 합격기준) |
| `exam_applications` | 시험 신청 + **상태값 관리** |
| `exam_questions` | 시험 문제 (선택지 JSONB, 정답 인덱스) |
| `exam_answers` | 응시자 답안 저장 |
| `certificates` | 발급된 자격증 (자격증 번호, PDF URL) |

---

## 🔐 접근 권한 매트릭스

| 경로 | 비로그인 | 일반 사용자 | 관리자 |
|------|---------|------------|--------|
| `/login`, `/signup` | ✅ | 리다이렉트 | 리다이렉트 |
| `/dashboard` | 리다이렉트 | ✅ | ✅ |
| `/exam/apply` | 리다이렉트 | ✅ | ✅ |
| `/exam/take` | 리다이렉트 | ✅ (approved만) | ✅ |
| `/exam/result` | 리다이렉트 | ✅ | ✅ |
| `/certificate` | 리다이렉트 | ✅ | ✅ |
| `/admin/*` | 리다이렉트 | 리다이렉트 | ✅ |

---

## ⚙️ 환경 설정

### 1. Supabase 프로젝트 생성
1. [supabase.com](https://supabase.com) 에서 새 프로젝트 생성
2. `supabase/schema.sql` 파일을 **SQL Editor**에서 전체 실행
3. Project Settings → API에서 URL과 키 복사

### 2. 환경변수 설정
```bash
cp .env.example .env.local
# .env.local 파일 편집
```

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 3. 개발 서버 실행
```bash
npm install
npm run dev
# http://localhost:3000 접속
```

### 4. 관리자 계정 설정
Supabase Dashboard → Table Editor → `profiles` 테이블에서
원하는 사용자의 `role` 값을 `admin`으로 변경

---

## 🚀 배포 (Vercel)

```bash
# Vercel CLI
vercel
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel env add SUPABASE_SERVICE_ROLE_KEY
vercel --prod
```

---

## 🛣️ 향후 개발 예정 기능

- [ ] 시험 문제 관리 UI (관리자 - 문제 등록/수정/삭제)
- [ ] 자격증 PDF 자동 생성 (puppeteer 또는 react-pdf)
- [ ] 이메일 알림 (입금 확인, 결과 발표 시 Supabase Edge Function)
- [ ] 모바일 네비게이션 (햄버거 메뉴)
- [ ] 시험 응시 이탈 방지 (beforeunload 이벤트)
- [ ] 재응시 제한 설정
- [ ] 결제 연동 (토스페이먼츠, 카카오페이)
- [ ] 다중 자격증 종류 지원
