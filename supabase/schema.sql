-- ============================================================
-- 자격증 시험 관리 시스템 - Supabase 데이터베이스 스키마
-- ============================================================

-- 1. profiles 테이블 (사용자 프로필)
CREATE TABLE IF NOT EXISTS public.profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email       TEXT NOT NULL UNIQUE,
  full_name   TEXT NOT NULL,
  phone       TEXT,
  role        TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. exams 테이블 (시험 회차 정보)
CREATE TABLE IF NOT EXISTS public.exams (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title            TEXT NOT NULL,
  description      TEXT,
  exam_date        DATE NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 60,
  passing_score    INTEGER NOT NULL DEFAULT 60,
  fee              INTEGER NOT NULL DEFAULT 50000,
  is_active        BOOLEAN NOT NULL DEFAULT true,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. exam_applications 테이블 (시험 신청)
CREATE TABLE IF NOT EXISTS public.exam_applications (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  exam_id               UUID NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
  status                TEXT NOT NULL DEFAULT 'waiting_payment'
                          CHECK (status IN (
                            'waiting_payment',
                            'approved',
                            'exam_completed',
                            'passed',
                            'failed',
                            'certificate_ready'
                          )),
  score                 INTEGER,
  payment_confirmed_at  TIMESTAMPTZ,
  exam_completed_at     TIMESTAMPTZ,
  result_released_at    TIMESTAMPTZ,
  certificate_issued_at TIMESTAMPTZ,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, exam_id)  -- 동일 시험 중복 신청 방지
);

-- 4. exam_questions 테이블 (시험 문제)
CREATE TABLE IF NOT EXISTS public.exam_questions (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id        UUID NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
  question_text  TEXT NOT NULL,
  options        JSONB NOT NULL,         -- ["①...", "②...", "③...", "④..."]
  correct_answer INTEGER NOT NULL,       -- 정답 인덱스 (0-based)
  order_num      INTEGER NOT NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. exam_answers 테이블 (응시자 답안)
CREATE TABLE IF NOT EXISTS public.exam_answers (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id   UUID NOT NULL REFERENCES public.exam_applications(id) ON DELETE CASCADE,
  question_id      UUID NOT NULL REFERENCES public.exam_questions(id) ON DELETE CASCADE,
  selected_answer  INTEGER,              -- 선택한 답 인덱스 (null = 미답변)
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (application_id, question_id)
);

-- 6. certificates 테이블 (발급된 자격증)
CREATE TABLE IF NOT EXISTS public.certificates (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id      UUID NOT NULL REFERENCES public.exam_applications(id) ON DELETE CASCADE,
  user_id             UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  certificate_number  TEXT NOT NULL UNIQUE,
  pdf_url             TEXT,
  issued_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 인덱스
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_exam_applications_user_id ON public.exam_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_exam_applications_exam_id ON public.exam_applications(exam_id);
CREATE INDEX IF NOT EXISTS idx_exam_applications_status  ON public.exam_applications(status);
CREATE INDEX IF NOT EXISTS idx_exam_questions_exam_id    ON public.exam_questions(exam_id);
CREATE INDEX IF NOT EXISTS idx_exam_answers_app_id       ON public.exam_answers(application_id);
CREATE INDEX IF NOT EXISTS idx_certificates_user_id      ON public.certificates(user_id);

-- ============================================================
-- updated_at 자동 갱신 트리거
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_exam_applications_updated_at
  BEFORE UPDATE ON public.exam_applications
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================
-- 신규 사용자 프로필 자동 생성 트리거
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, phone)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.raw_user_meta_data->>'phone'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- Row Level Security (RLS) 정책
-- ============================================================
ALTER TABLE public.profiles            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exams               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_applications   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_questions      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_answers        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificates        ENABLE ROW LEVEL SECURITY;

-- profiles: 본인 프로필 조회/수정, 관리자 전체 조회
CREATE POLICY "profiles: 본인 조회"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id OR EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
  ));

CREATE POLICY "profiles: 본인 수정"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- exams: 모든 인증 사용자 조회, 관리자만 생성/수정
CREATE POLICY "exams: 인증 사용자 조회"
  ON public.exams FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "exams: 관리자 생성"
  ON public.exams FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
  ));

CREATE POLICY "exams: 관리자 수정"
  ON public.exams FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
  ));

-- exam_applications: 본인 신청 조회/생성, 관리자 전체 접근
CREATE POLICY "applications: 본인 조회"
  ON public.exam_applications FOR SELECT
  USING (user_id = auth.uid() OR EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
  ));

CREATE POLICY "applications: 본인 생성"
  ON public.exam_applications FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "applications: 관리자 수정"
  ON public.exam_applications FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
  ));

-- exam_questions: 응시 가능 상태인 사용자 조회, 관리자 전체 접근
CREATE POLICY "questions: 응시자 조회"
  ON public.exam_questions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.exam_applications
      WHERE user_id = auth.uid()
        AND exam_id = exam_questions.exam_id
        AND status = 'approved'
    )
    OR EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- exam_answers: 본인 답안 조회/생성, 관리자 전체 접근
CREATE POLICY "answers: 본인 조회"
  ON public.exam_answers FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.exam_applications
    WHERE id = exam_answers.application_id AND user_id = auth.uid()
  ) OR EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
  ));

CREATE POLICY "answers: 본인 생성"
  ON public.exam_answers FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.exam_applications
    WHERE id = exam_answers.application_id AND user_id = auth.uid()
  ));

-- certificates: 본인 자격증 조회, 관리자 전체 접근
CREATE POLICY "certificates: 본인 조회"
  ON public.certificates FOR SELECT
  USING (user_id = auth.uid() OR EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
  ));

-- ============================================================
-- 샘플 데이터
-- ============================================================
INSERT INTO public.exams (title, description, exam_date, duration_minutes, passing_score, fee)
VALUES
  ('2024년 1회 정보처리 자격증 시험', '기초 정보처리 능력 검정 시험입니다.', '2024-06-15', 60, 60, 50000),
  ('2024년 2회 정보처리 자격증 시험', '기초 정보처리 능력 검정 시험입니다.', '2024-09-21', 60, 60, 50000),
  ('2024년 3회 정보처리 자격증 시험', '기초 정보처리 능력 검정 시험입니다.', '2024-12-07', 60, 60, 50000)
ON CONFLICT DO NOTHING;
