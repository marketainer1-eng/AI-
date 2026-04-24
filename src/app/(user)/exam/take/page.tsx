import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ExamTakeClient from '@/components/exam/ExamTakeClient'
import ExamAccessDenied from '@/components/exam/ExamAccessDenied'
import { checkExamAccess, calcRemainingSeconds } from '@/lib/exam/access'
import {
  selectQuestions,
  parseMemo,
  stringifyMemo,
  restoreQuestionsFromMemo,
} from '@/lib/exam/selectQuestions'
import type { ApplicationWithExam, QuestionRow } from '@/types'

// 출제 문제 수 기본값 (exam.question_count가 null이면 이 값 사용)
const DEFAULT_QUESTION_COUNT = 25

export default async function ExamTakePage() {
  const supabase = await createClient()

  // ── 인증 ────────────────────────────────────────────────────
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // ── 신청 내역 조회 ───────────────────────────────────────────
  const { data: application } = await (supabase as any)
    .from('exam_applications')
    .select('*, exam:exams(*)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  const now = new Date()

  // ── 접근 제한 판정 ──────────────────────────────────────────
  const access = checkExamAccess(
    (application as ApplicationWithExam | null) ?? null,
    now
  )

  if (!access.granted) {
    return (
      <ExamAccessDenied
        reason={access.reason}
        title={access.title}
        description={access.description}
        msUntilStart={access.msUntilStart}
      />
    )
  }

  const app = application as ApplicationWithExam

  // ── 전체 문제 풀 조회 ───────────────────────────────────────
  const { data: allQuestions } = await (supabase as any)
    .from('questions')
    .select('*')
    .eq('exam_id', app.exam_id)
    .eq('is_active', true)
    .order('order_num', { ascending: true })

  if (!allQuestions || allQuestions.length === 0) {
    return (
      <ExamAccessDenied
        reason="no_exam_schedule"
        title="시험 문제가 준비되지 않았습니다"
        description="관리자가 문제를 등록 중입니다.\n잠시 후 다시 시도해주세요."
      />
    )
  }

  // ── 출제 문제 결정 ──────────────────────────────────────────
  // exam.question_count가 설정되어 있으면 해당 수만큼 출제,
  // 없으면 기본값(DEFAULT_QUESTION_COUNT)을 사용
  const QUESTION_COUNT = app.exam?.question_count ?? DEFAULT_QUESTION_COUNT

  // memo에 이미 선택된 문제가 있으면 그대로 복원 (새로고침해도 동일)
  // 없으면 랜덤 선택 후 memo에 저장
  let selectedQuestions: QuestionRow[]

  const existingMemo = parseMemo(app.memo)

  if (existingMemo && existingMemo.selectedQuestionIds.length > 0) {
    // ✅ 재진입: memo에서 동일 문제 순서 복원
    selectedQuestions = restoreQuestionsFromMemo(
      allQuestions as QuestionRow[],
      existingMemo
    )

    // 복원 실패 시 (문제 삭제 등) 재선택
    if (selectedQuestions.length === 0) {
      selectedQuestions = selectQuestions(
        allQuestions as QuestionRow[],
        app.id,
        QUESTION_COUNT
      )
      await (supabase as any)
        .from('exam_applications')
        .update({ memo: stringifyMemo(selectedQuestions.map((q) => q.id)) })
        .eq('id', app.id)
    }
  } else {
    // ✅ 첫 진입: 랜덤 선택 후 memo 저장
    selectedQuestions = selectQuestions(
      allQuestions as QuestionRow[],
      app.id,
      QUESTION_COUNT
    )
    await (supabase as any)
      .from('exam_applications')
      .update({ memo: stringifyMemo(selectedQuestions.map((q) => q.id)) })
      .eq('id', app.id)
  }

  // ── 남은 시간 계산 ──────────────────────────────────────────
  const remainingSeconds = calcRemainingSeconds(app, now)

  return (
    <ExamTakeClient
      application={app}
      questions={selectedQuestions}
      initialRemainingSeconds={remainingSeconds}
      totalQuestionCount={allQuestions.length}
      selectedCount={selectedQuestions.length}
    />
  )
}
