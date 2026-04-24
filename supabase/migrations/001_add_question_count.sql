-- ================================================================
-- Migration: exams 테이블에 question_count 컬럼 추가
-- 실행: Supabase Dashboard → SQL Editor → 붙여넣기 후 Run
-- ================================================================

-- 출제 문제 수 컬럼 추가 (NULL이면 기본값 25문제 사용)
ALTER TABLE public.exams
  ADD COLUMN IF NOT EXISTS question_count INTEGER CHECK (question_count > 0);

COMMENT ON COLUMN public.exams.question_count IS
  '랜덤 출제 문제 수. NULL이면 기본값(25문제) 사용';
