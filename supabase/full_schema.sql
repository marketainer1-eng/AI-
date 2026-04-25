-- ================================================================
-- 자격증 시험 관리 시스템 — Supabase 스키마
-- 실행 순서: Supabase Dashboard → SQL Editor → 전체 붙여넣기 후 Run
-- ================================================================

-- ----------------------------------------------------------------
-- 0. 확장 모듈
-- ----------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "pgcrypto";   -- gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS "unaccent";   -- 한글 검색 보조

-- ================================================================
-- 1. users
--    Supabase auth.users 와 1:1 연결되는 공개 프로필 테이블
-- ================================================================
CREATE TABLE IF NOT EXISTS public.users (
  id            UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email         TEXT        NOT NULL UNIQUE,
  full_name     TEXT        NOT NULL DEFAULT '',
  phone         TEXT,
  role          TEXT        NOT NULL DEFAULT 'user'
                              CHECK (role IN ('user', 'admin')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE  public.users             IS '서비스 사용자 프로필 (auth.users 확장)';
COMMENT ON COLUMN public.users.role        IS 'user | admin';
COMMENT ON COLUMN public.users.phone       IS '010-XXXX-XXXX 형식 권장';

-- ================================================================
-- 2. exams
--    시험 회차 정보 — 일정, 결과 발표일, 자격증 발급 예정일 포함
-- ================================================================
CREATE TABLE IF NOT EXISTS public.exams (
  id                    UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  title                 TEXT        NOT NULL,
  description           TEXT,
  -- 일정
  registration_start_at TIMESTAMPTZ NOT NULL,               -- 접수 시작
  registration_end_at   TIMESTAMPTZ NOT NULL,               -- 접수 마감
  exam_start_at         TIMESTAMPTZ NOT NULL,               -- 시험 시작
  exam_end_at           TIMESTAMPTZ NOT NULL,               -- 시험 종료
  result_released_at    TIMESTAMPTZ,                        -- 결과 발표일시 (NULL=미정)
  certificate_issued_at TIMESTAMPTZ,                        -- 자격증 발급 예정일시 (NULL=미정)
  -- 설정
  duration_minutes      INTEGER     NOT NULL DEFAULT 60     CHECK (duration_minutes > 0),
  passing_score         INTEGER     NOT NULL DEFAULT 60     CHECK (passing_score BETWEEN 0 AND 100),
  fee                   INTEGER     NOT NULL DEFAULT 50000  CHECK (fee >= 0),
  max_applicants        INTEGER                             CHECK (max_applicants > 0), -- NULL=제한없음
  question_count        INTEGER                             CHECK (question_count > 0),  -- NULL=25문제(기본값)
  is_active             BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- 제약
  CONSTRAINT chk_exam_dates CHECK (
    registration_start_at < registration_end_at AND
    registration_end_at   < exam_start_at       AND
    exam_start_at         < exam_end_at
  )
);

COMMENT ON TABLE  public.exams                     IS '시험 회차 마스터';
COMMENT ON COLUMN public.exams.result_released_at  IS '결과 발표 일시 — NULL 이면 미발표';
COMMENT ON COLUMN public.exams.certificate_issued_at IS '자격증 발급 예정 일시 — NULL 이면 미정';
COMMENT ON COLUMN public.exams.max_applicants      IS '최대 접수 인원 — NULL 이면 제한 없음';

-- ================================================================
-- 3. exam_applications
--    시험 신청 + 상태 흐름 관리
-- ================================================================
CREATE TYPE public.application_status AS ENUM (
  'waiting_payment',   -- 신청 완료, 입금 대기
  'approved',          -- 입금 확인, 응시 가능
  'exam_completed',    -- 시험 제출 완료, 채점 대기
  'passed',            -- 합격
  'failed',            -- 불합격
  'certificate_ready'  -- 자격증 발급 완료
);

CREATE TABLE IF NOT EXISTS public.exam_applications (
  id                    UUID                       PRIMARY KEY DEFAULT gen_random_uuid(),
  -- 관계
  user_id               UUID                       NOT NULL REFERENCES public.users(id)  ON DELETE CASCADE,
  exam_id               UUID                       NOT NULL REFERENCES public.exams(id)  ON DELETE RESTRICT,
  -- 상태
  status                public.application_status  NOT NULL DEFAULT 'waiting_payment',
  -- 점수
  score                 NUMERIC(5,2)               CHECK (score BETWEEN 0 AND 100),
  -- 이력 타임스탬프
  payment_confirmed_at  TIMESTAMPTZ,   -- 입금 확인 처리 시각
  exam_started_at       TIMESTAMPTZ,   -- 실제 응시 시작 시각
  exam_submitted_at     TIMESTAMPTZ,   -- 제출 시각
  result_notified_at    TIMESTAMPTZ,   -- 결과 통보 시각
  certificate_issued_at TIMESTAMPTZ,   -- 자격증 실제 발급 시각
  -- 메타
  memo                  TEXT,          -- 관리자 메모
  created_at            TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  -- 동일 시험 중복 신청 방지
  UNIQUE (user_id, exam_id)
);

COMMENT ON TABLE  public.exam_applications                    IS '시험 신청 및 상태 흐름';
COMMENT ON COLUMN public.exam_applications.status            IS 'application_status ENUM — 상태 흐름 참고';
COMMENT ON COLUMN public.exam_applications.score             IS '취득 점수 (0.00 ~ 100.00)';
COMMENT ON COLUMN public.exam_applications.memo              IS '관리자 전용 메모';

-- ================================================================
-- 4. questions
--    시험별 문제 — 객관식(선택지 JSONB), 주관식 모두 지원
-- ================================================================
CREATE TYPE public.question_type AS ENUM (
  'multiple_choice',  -- 객관식
  'true_false',       -- O/X
  'short_answer'      -- 단답형 (향후 확장)
);

CREATE TABLE IF NOT EXISTS public.questions (
  id             UUID                   PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id        UUID                   NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
  -- 문제 내용
  question_type  public.question_type   NOT NULL DEFAULT 'multiple_choice',
  question_text  TEXT                   NOT NULL,
  -- 객관식: ["선택지1","선택지2","선택지3","선택지4"]
  -- O/X    : ["O","X"]
  -- 단답형 : NULL
  options        JSONB,
  correct_answer TEXT                   NOT NULL,  -- 객관식: "0"~"3" (인덱스), O/X: "O"/"X", 단답: 정답 문자열
  explanation    TEXT,                             -- 해설 (선택)
  score_weight   NUMERIC(4,2)           NOT NULL DEFAULT 1.0 CHECK (score_weight > 0),
  order_num      INTEGER                NOT NULL DEFAULT 0,
  is_active      BOOLEAN                NOT NULL DEFAULT TRUE,
  created_at     TIMESTAMPTZ            NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE  public.questions               IS '시험 문제 마스터';
COMMENT ON COLUMN public.questions.options       IS '객관식 선택지 배열 (JSONB) — 단답형은 NULL';
COMMENT ON COLUMN public.questions.correct_answer IS '정답: 객관식=인덱스문자열("0"~), O/X="O"/"X", 단답=정답텍스트';
COMMENT ON COLUMN public.questions.score_weight  IS '배점 가중치 (기본 1.0)';

-- ================================================================
-- 5. submissions
--    응시자 제출 답안 — 문항별 1건
-- ================================================================
CREATE TABLE IF NOT EXISTS public.submissions (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  -- 관계
  application_id  UUID        NOT NULL REFERENCES public.exam_applications(id) ON DELETE CASCADE,
  question_id     UUID        NOT NULL REFERENCES public.questions(id)          ON DELETE CASCADE,
  -- 답안
  selected_answer TEXT,                    -- NULL = 미답변
  is_correct      BOOLEAN,                 -- NULL = 채점 전
  score_earned    NUMERIC(5,2),            -- 실제 획득 점수
  -- 메타
  answered_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- 같은 신청에서 같은 문제는 1건만
  UNIQUE (application_id, question_id)
);

COMMENT ON TABLE  public.submissions                  IS '응시자 문항별 제출 답안';
COMMENT ON COLUMN public.submissions.selected_answer  IS '선택한 답 — NULL 이면 미답변';
COMMENT ON COLUMN public.submissions.is_correct       IS 'NULL = 채점 전 / TRUE = 정답 / FALSE = 오답';
COMMENT ON COLUMN public.submissions.score_earned     IS '해당 문항에서 획득한 점수';

-- ================================================================
-- 6. certificates
--    합격자 자격증 — 자격증 번호, 발급일, 파일 URL
-- ================================================================
CREATE TABLE IF NOT EXISTS public.certificates (
  id                 UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  -- 관계
  application_id     UUID        NOT NULL UNIQUE REFERENCES public.exam_applications(id) ON DELETE RESTRICT,
  user_id            UUID        NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
  -- 자격증 정보
  certificate_number TEXT        NOT NULL UNIQUE,  -- 예: CERT-2024-000001
  issued_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at         TIMESTAMPTZ,                  -- NULL = 영구 유효
  pdf_url            TEXT,                         -- Supabase Storage URL
  pdf_storage_path   TEXT,                         -- Storage 내부 경로 (삭제 시 사용)
  -- 메타
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE  public.certificates                   IS '발급된 자격증';
COMMENT ON COLUMN public.certificates.certificate_number IS 'CERT-YYYY-NNNNNN 형식 고유번호';
COMMENT ON COLUMN public.certificates.expires_at        IS '만료일 — NULL 이면 영구 유효';
COMMENT ON COLUMN public.certificates.pdf_storage_path  IS 'Supabase Storage 내부 경로';

-- ================================================================
-- 인덱스 — 자주 사용되는 조회 패턴 최적화
-- ================================================================
-- exam_applications
CREATE INDEX IF NOT EXISTS idx_applications_user_id  ON public.exam_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_applications_exam_id  ON public.exam_applications(exam_id);
CREATE INDEX IF NOT EXISTS idx_applications_status   ON public.exam_applications(status);
-- questions
CREATE INDEX IF NOT EXISTS idx_questions_exam_id     ON public.questions(exam_id);
CREATE INDEX IF NOT EXISTS idx_questions_order       ON public.questions(exam_id, order_num);
-- submissions
CREATE INDEX IF NOT EXISTS idx_submissions_app_id    ON public.submissions(application_id);
CREATE INDEX IF NOT EXISTS idx_submissions_question  ON public.submissions(question_id);
-- certificates
CREATE INDEX IF NOT EXISTS idx_certificates_user_id  ON public.certificates(user_id);
CREATE INDEX IF NOT EXISTS idx_certificates_app_id   ON public.certificates(application_id);

-- ================================================================
-- 트리거 — updated_at 자동 갱신
-- ================================================================
CREATE OR REPLACE FUNCTION public.fn_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();

CREATE OR REPLACE TRIGGER trg_exams_updated_at
  BEFORE UPDATE ON public.exams
  FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();

CREATE OR REPLACE TRIGGER trg_applications_updated_at
  BEFORE UPDATE ON public.exam_applications
  FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();

-- ================================================================
-- 트리거 — auth.users 신규 가입 시 public.users 자동 생성
-- ================================================================
CREATE OR REPLACE FUNCTION public.fn_handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, phone)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.raw_user_meta_data->>'phone'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- 기존 트리거 있으면 교체
DROP TRIGGER IF EXISTS trg_on_auth_user_created ON auth.users;
CREATE TRIGGER trg_on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.fn_handle_new_user();

-- ================================================================
-- 트리거 — 자격증 번호 자동 채번 (CERT-YYYY-NNNNNN)
-- ================================================================
CREATE SEQUENCE IF NOT EXISTS public.seq_certificate_number START 1;

CREATE OR REPLACE FUNCTION public.fn_generate_certificate_number()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.certificate_number IS NULL OR NEW.certificate_number = '' THEN
    NEW.certificate_number :=
      'CERT-' || TO_CHAR(NOW(), 'YYYY') || '-' ||
      LPAD(NEXTVAL('public.seq_certificate_number')::TEXT, 6, '0');
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER trg_certificate_number
  BEFORE INSERT ON public.certificates
  FOR EACH ROW EXECUTE FUNCTION public.fn_generate_certificate_number();

-- ================================================================
-- RLS (Row Level Security)
-- ================================================================
ALTER TABLE public.users               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exams               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_applications   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submissions         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificates        ENABLE ROW LEVEL SECURITY;

-- ── 관리자 판별 함수 (반복 서브쿼리 대신 재사용) ───────────────
CREATE OR REPLACE FUNCTION public.fn_is_admin()
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- ── users ─────────────────────────────────────────────────────
-- 본인 조회 + 관리자 전체 조회
CREATE POLICY "users: 본인 또는 관리자 조회"
  ON public.users FOR SELECT
  USING (id = auth.uid() OR public.fn_is_admin());

-- 본인 정보만 수정
CREATE POLICY "users: 본인 수정"
  ON public.users FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- ── exams ─────────────────────────────────────────────────────
-- 인증된 사용자 전체 조회 (is_active 여부 무관 — 필터는 앱 레이어)
CREATE POLICY "exams: 인증 사용자 조회"
  ON public.exams FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "exams: 관리자 생성"
  ON public.exams FOR INSERT
  WITH CHECK (public.fn_is_admin());

CREATE POLICY "exams: 관리자 수정"
  ON public.exams FOR UPDATE
  USING (public.fn_is_admin());

CREATE POLICY "exams: 관리자 삭제"
  ON public.exams FOR DELETE
  USING (public.fn_is_admin());

-- ── exam_applications ─────────────────────────────────────────
CREATE POLICY "applications: 본인 또는 관리자 조회"
  ON public.exam_applications FOR SELECT
  USING (user_id = auth.uid() OR public.fn_is_admin());

CREATE POLICY "applications: 본인 생성"
  ON public.exam_applications FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- 상태 변경은 관리자만 (앱 레이어에서 추가 검증)
CREATE POLICY "applications: 관리자 수정"
  ON public.exam_applications FOR UPDATE
  USING (public.fn_is_admin());

-- 본인 응시 시작/제출 시각 기록을 위해 본인 UPDATE 허용 (status 제외)
CREATE POLICY "applications: 본인 응시 기록"
  ON public.exam_applications FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (
    user_id = auth.uid() AND
    -- 상태(status)는 변경 불가 — 관리자 정책과 분리
    status = OLD.status
  );

-- ── questions ─────────────────────────────────────────────────
-- 응시 가능(approved) 상태 본인, 또는 관리자
CREATE POLICY "questions: 응시자 또는 관리자 조회"
  ON public.questions FOR SELECT
  USING (
    public.fn_is_admin()
    OR EXISTS (
      SELECT 1 FROM public.exam_applications
      WHERE user_id = auth.uid()
        AND exam_id = questions.exam_id
        AND status  = 'approved'
    )
  );

CREATE POLICY "questions: 관리자 CUD"
  ON public.questions FOR ALL
  USING (public.fn_is_admin())
  WITH CHECK (public.fn_is_admin());

-- ── submissions ───────────────────────────────────────────────
CREATE POLICY "submissions: 본인 또는 관리자 조회"
  ON public.submissions FOR SELECT
  USING (
    public.fn_is_admin()
    OR EXISTS (
      SELECT 1 FROM public.exam_applications
      WHERE id = submissions.application_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "submissions: 본인 생성·수정"
  ON public.submissions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.exam_applications
      WHERE id = submissions.application_id
        AND user_id = auth.uid()
        AND status  = 'approved'
    )
  );

CREATE POLICY "submissions: 본인 수정"
  ON public.submissions FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.exam_applications
      WHERE id = submissions.application_id
        AND user_id = auth.uid()
        AND status  = 'approved'
    )
  );

-- ── certificates ──────────────────────────────────────────────
CREATE POLICY "certificates: 본인 또는 관리자 조회"
  ON public.certificates FOR SELECT
  USING (user_id = auth.uid() OR public.fn_is_admin());

CREATE POLICY "certificates: 관리자 생성"
  ON public.certificates FOR INSERT
  WITH CHECK (public.fn_is_admin());

CREATE POLICY "certificates: 관리자 수정"
  ON public.certificates FOR UPDATE
  USING (public.fn_is_admin());

-- ================================================================
-- 뷰 — 자주 사용하는 조인을 뷰로 제공
-- ================================================================

-- 신청 + 사용자 + 시험 통합 뷰 (관리자용)
CREATE OR REPLACE VIEW public.v_applications_detail AS
SELECT
  ea.id                    AS application_id,
  ea.status,
  ea.score,
  ea.payment_confirmed_at,
  ea.exam_started_at,
  ea.exam_submitted_at,
  ea.result_notified_at,
  ea.certificate_issued_at AS app_certificate_issued_at,
  ea.memo,
  ea.created_at            AS applied_at,
  -- 사용자
  u.id                     AS user_id,
  u.email,
  u.full_name,
  u.phone,
  -- 시험
  e.id                     AS exam_id,
  e.title                  AS exam_title,
  e.exam_start_at,
  e.exam_end_at,
  e.result_released_at,
  e.certificate_issued_at  AS exam_certificate_issued_at,
  e.passing_score,
  e.fee,
  -- 자격증
  c.certificate_number,
  c.issued_at              AS cert_issued_at,
  c.pdf_url
FROM public.exam_applications ea
JOIN public.users              u  ON u.id  = ea.user_id
JOIN public.exams              e  ON e.id  = ea.exam_id
LEFT JOIN public.certificates  c  ON c.application_id = ea.id;

-- ================================================================
-- 샘플 데이터 (개발·테스트용)
-- ================================================================
INSERT INTO public.exams (
  title, description,
  registration_start_at, registration_end_at,
  exam_start_at, exam_end_at,
  result_released_at, certificate_issued_at,
  duration_minutes, passing_score, fee, max_applicants
) VALUES
(
  '2025년 1회 정보처리 자격증 시험',
  '기초 정보처리 능력 검정 시험입니다. 총 20문항, 60분.',
  '2025-05-01 00:00:00+09', '2025-05-20 23:59:59+09',
  '2025-06-07 10:00:00+09', '2025-06-07 11:00:00+09',
  '2025-06-21 10:00:00+09', '2025-07-01 10:00:00+09',
  60, 60, 50000, 200
),
(
  '2025년 2회 정보처리 자격증 시험',
  '기초 정보처리 능력 검정 시험입니다. 총 20문항, 60분.',
  '2025-08-01 00:00:00+09', '2025-08-20 23:59:59+09',
  '2025-09-06 10:00:00+09', '2025-09-06 11:00:00+09',
  '2025-09-20 10:00:00+09', '2025-10-01 10:00:00+09',
  60, 60, 50000, 200
)
ON CONFLICT DO NOTHING;

-- ================================================================
-- Migration: exams 테이블에 question_count 컬럼 추가
-- 실행: Supabase Dashboard → SQL Editor → 붙여넣기 후 Run
-- ================================================================

-- 출제 문제 수 컬럼 추가 (NULL이면 기본값 25문제 사용)
ALTER TABLE public.exams
  ADD COLUMN IF NOT EXISTS question_count INTEGER CHECK (question_count > 0);

COMMENT ON COLUMN public.exams.question_count IS
  '랜덤 출제 문제 수. NULL이면 기본값(25문제) 사용';
