import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ExamTakeClient    from '@/components/exam/ExamTakeClient'
import ExamAccessDenied  from '@/components/exam/ExamAccessDenied'
import { checkExamAccess, calcRemainingSeconds } from '@/lib/exam/access'
import {
  selectQuestions,
  parseMemo,
  stringifyMemo,
  restoreQuestionsFromMemo,
} from '@/lib/exam/selectQuestions'
import type { ApplicationWithExam, QuestionRow } from '@/types'

// 출제 문제 수 기본값 (exam.question_count 가 null 이면 사용)
const DEFAULT_QUESTION_COUNT = 25

// 항상 최신 상태로 렌더링 (캐시 금지)
export const dynamic = 'force-dynamic'

export default async function ExamTakePage() {
  const supabase = await createClient()

  // ── 인증 ────────────────────────────────────────────────────
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // ── 신청 내역 조회 (exam 정보 포함) ─────────────────────────
  const { data: application } = await (supabase as any)
    .from('exam_applications')
    .select('*, exam:exams(*)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  const now = new Date()

  // ── 접근 제한 판정 (상태 + 시간) ────────────────────────────
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
        examStartAt={access.examStartAt}
        examEndAt={access.examEndAt}
        examStartAtFormatted={access.examStartAtFormatted}
        examEndAtFormatted={access.examEndAtFormatted}
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

  // ── 출제 문제 수 결정 ────────────────────────────────────────
  const QUESTION_COUNT = app.exam?.question_count ?? DEFAULT_QUESTION_COUNT

  // ── 출제 문제 복원 또는 신규 선택 ───────────────────────────
  let selectedQuestions: QuestionRow[]
  const existingMemo = parseMemo(app.memo)

  if (existingMemo && existingMemo.selectedQuestionIds.length > 0) {
    // 재진입: memo 에서 동일 순서 복원
    selectedQuestions = restoreQuestionsFromMemo(
      allQuestions as QuestionRow[],
      existingMemo
    )
    // 복원 실패 시 재선택 후 반드시 memo 재저장
    if (selectedQuestions.length === 0) {
      selectedQuestions = selectQuestions(allQuestions as QuestionRow[], app.id, QUESTION_COUNT)
      const newMemo = stringifyMemo(selectedQuestions.map(q => q.id))
      const { error: memoErr } = await (supabase as any)
        .from('exam_applications')
        .update({ memo: newMemo })
        .eq('id', app.id)
      if (memoErr) {
        console.error('[take] memo 재저장 실패:', memoErr)
      }
    }
  } else {
    // 첫 진입: 랜덤 선택 후 memo 저장 (재시도 포함)
    selectedQuestions = selectQuestions(allQuestions as QuestionRow[], app.id, QUESTION_COUNT)
    const newMemo = stringifyMemo(selectedQuestions.map(q => q.id))
    const { error: memoErr } = await (supabase as any)
      .from('exam_applications')
      .update({ memo: newMemo })
      .eq('id', app.id)
    if (memoErr) {
      // 저장 실패 시 1회 재시도
      console.error('[take] memo 저장 실패, 재시도:', memoErr)
      await (supabase as any)
        .from('exam_applications')
        .update({ memo: newMemo })
        .eq('id', app.id)
    }
  }

  // ── 남은 시간 계산 ──────────────────────────────────────────
  const remainingSeconds = calcRemainingSeconds(app, now)

  // ── 시험 종료 시각 (클라이언트 실시간 감지용) ────────────────
  const examEndAt = app.exam?.exam_end_at ?? new Date(Date.now() + remainingSeconds * 1000).toISOString()

  return (
    <ExamTakeClient
      application={app}
      questions={selectedQuestions}
      initialRemainingSeconds={remainingSeconds}
      totalQuestionCount={allQuestions.length}
      selectedCount={selectedQuestions.length}
      examEndAt={examEndAt}
    />
  )
}
