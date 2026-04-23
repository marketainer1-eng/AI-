import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ExamTakeClient from '@/components/exam/ExamTakeClient'
import ExamAccessDenied from '@/components/exam/ExamAccessDenied'
import { checkExamAccess, calcRemainingSeconds } from '@/lib/exam/access'
import type { ApplicationWithExam, QuestionRow } from '@/types'

export default async function ExamTakePage() {
  const supabase = await createClient()

  // ── 인증 ────────────────────────────────────────────────────
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // ── 신청 내역 조회 (approved 또는 exam_completed 포함 전체 최신) ──
  // checkExamAccess 가 상태별로 사유를 구분하므로 상태 필터 없이 조회
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

  // ── 시험 문제 조회 ──────────────────────────────────────────
  const app = application as ApplicationWithExam

  const { data: questions } = await (supabase as any)
    .from('questions')
    .select('*')
    .eq('exam_id', app.exam_id)
    .eq('is_active', true)
    .order('order_num', { ascending: true })

  if (!questions || questions.length === 0) {
    return (
      <ExamAccessDenied
        reason="no_exam_schedule"
        title="시험 문제가 준비되지 않았습니다"
        description="관리자가 문제를 등록 중입니다.\n잠시 후 다시 시도해주세요."
      />
    )
  }

  // ── exam_end_at 기준 남은 초 계산 ──────────────────────────
  const remainingSeconds = calcRemainingSeconds(app, now)

  return (
    <ExamTakeClient
      application={app}
      questions={questions as QuestionRow[]}
      initialRemainingSeconds={remainingSeconds}
    />
  )
}
