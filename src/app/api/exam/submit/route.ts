/**
 * POST /api/exam/submit
 *
 * 시험 제출 + 서버 사이드 자동 채점 API
 *
 * Request Body:
 *   {
 *     applicationId: string
 *     answers: Record<questionId, selectedAnswer | null>
 *   }
 *
 * Response:
 *   {
 *     success: true
 *     score: number          // 0~100 (소수 2자리)
 *     passed: boolean
 *     passingScore: number
 *     totalQuestions: number
 *     correctCount: number
 *     detail: {              // 문제별 채점 상세
 *       questionId: string
 *       questionText: string
 *       questionType: string
 *       selectedAnswer: string | null
 *       correctAnswer: string
 *       isCorrect: boolean
 *       scoreWeight: number
 *       scoreEarned: number
 *       options: string[] | null
 *       explanation: string | null
 *     }[]
 *   }
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient }        from '@supabase/ssr'
import { cookies }                   from 'next/headers'
import type { Database }             from '@/types'

// ─── 서버사이드 응시 가능 여부 검증 ────────────────────────────────
//  submit 요청 시점에도 상태·시간을 재확인합니다.
//  클라이언트 우회 방지 및 시간 종료 후 제출 방지 목적
function verifySubmitEligibility(
  application: {
    status: string
    exam?: {
      exam_start_at?: string | null
      exam_end_at?:   string | null
    } | null
  },
  now: Date
): { ok: true } | { ok: false; status: number; error: string } {

  // ── 상태 검증 ────────────────────────────────────────────────
  if (application.status !== 'approved') {
    if (application.status === 'waiting_payment') {
      return { ok: false, status: 403, error: '입금 확인이 필요합니다. 응시 가능 상태가 아닙니다.' }
    }
    if (
      application.status === 'exam_completed' ||
      application.status === 'passed' ||
      application.status === 'failed' ||
      application.status === 'certificate_ready'
    ) {
      return { ok: false, status: 409, error: '이미 제출된 시험입니다.' }
    }
    return { ok: false, status: 403, error: '시험 응시 가능 상태가 아닙니다.' }
  }

  // ── 시험 시간 검증 ───────────────────────────────────────────
  const startAt = application.exam?.exam_start_at ? new Date(application.exam.exam_start_at) : null
  const endAt   = application.exam?.exam_end_at   ? new Date(application.exam.exam_end_at)   : null

  if (!startAt || !endAt) {
    return { ok: false, status: 400, error: '시험 일정 정보를 찾을 수 없습니다.' }
  }

  if (now.getTime() < startAt.getTime()) {
    return { ok: false, status: 403, error: '아직 시험 시작 전입니다.' }
  }

  // 시험 종료 후 최대 5분(300초)까지는 제출 허용 (자동 제출 등 네트워크 지연 대비)
  const GRACE_MS = 5 * 60 * 1000
  if (now.getTime() > endAt.getTime() + GRACE_MS) {
    return { ok: false, status: 403, error: '시험 시간이 종료되었습니다. 제출이 거부되었습니다.' }
  }

  return { ok: true }
}

// ─── Supabase 서버 클라이언트 헬퍼 ──────────────────────────────
async function makeSupabase() {
  const cookieStore = await cookies()
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll:    () => cookieStore.getAll(),
        setAll: (list) =>
          list.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          ),
      },
    }
  )
}

// ─── 핵심 채점 로직 ───────────────────────────────────────────────
interface QuestionForGrade {
  id: string
  question_text: string
  question_type: string
  options: string[] | null
  correct_answer: string
  explanation: string | null
  score_weight: number
  order_num: number
}

interface AnswerDetail {
  questionId:     string
  questionText:   string
  questionType:   string
  orderNum:       number
  selectedAnswer: string | null
  correctAnswer:  string
  isCorrect:      boolean
  scoreWeight:    number
  scoreEarned:    number
  options:        string[] | null
  explanation:    string | null
}

// ─── correct_answer 인덱스 → 텍스트 변환 헬퍼 ───────────────────────
// DB에 correct_answer는 1-based 인덱스("1","2","3","4") 또는
// O/X, 단답형 텍스트로 저장됩니다.
// 클라이언트는 선택지 텍스트를 그대로 answers에 담아 보냅니다.
// 따라서 객관식의 경우 인덱스를 options 텍스트로 변환해야 합니다.
function resolveCorrectAnswerText(q: QuestionForGrade): string {
  if (q.question_type === 'multiple_choice' && q.options && q.options.length > 0) {
    const idx = parseInt(q.correct_answer, 10)
    if (!isNaN(idx) && idx >= 1 && idx <= q.options.length) {
      return q.options[idx - 1]  // 1-based → 0-based
    }
  }
  // true_false, short_answer 는 그대로
  return q.correct_answer
}

function gradeExam(
  questions: QuestionForGrade[],
  answers: Record<string, string | null>
): {
  score:          number
  correctCount:   number
  totalWeight:    number
  earnedWeight:   number
  detail:         AnswerDetail[]
} {
  let totalWeight  = 0
  let earnedWeight = 0
  let correctCount = 0

  const detail: AnswerDetail[] = questions.map((q) => {
    const selected = answers[q.id] ?? null
    const given    = (selected ?? '').trim().toLowerCase()

    // 정답 텍스트로 변환 (객관식은 인덱스 → 선택지 텍스트)
    const correctAnswerText = resolveCorrectAnswerText(q)
    const correct  = correctAnswerText.trim().toLowerCase()
    const isCorrect = given !== '' && given === correct

    const scoreEarned = isCorrect ? q.score_weight : 0
    totalWeight  += q.score_weight
    earnedWeight += scoreEarned
    if (isCorrect) correctCount++

    return {
      questionId:     q.id,
      questionText:   q.question_text,
      questionType:   q.question_type,
      orderNum:       q.order_num,
      selectedAnswer: selected,
      correctAnswer:  correctAnswerText,   // 텍스트로 반환 (UI 표시용)
      isCorrect,
      scoreWeight:    q.score_weight,
      scoreEarned,
      options:        q.options,
      explanation:    q.explanation,
    }
  })

  // 총점 100점 환산
  const score = totalWeight > 0
    ? parseFloat(((earnedWeight / totalWeight) * 100).toFixed(2))
    : 0

  return { score, correctCount, totalWeight, earnedWeight, detail }
}

// ─── POST 핸들러 ──────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { applicationId, answers } = body as {
      applicationId: string
      answers: Record<string, string | null>
    }

    if (!applicationId || typeof answers !== 'object') {
      return NextResponse.json(
        { error: 'applicationId 와 answers 가 필요합니다.' },
        { status: 400 }
      )
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = await makeSupabase() as any

    // ── 1. 인증 확인 ──────────────────────────────────────────────
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
    }

    // ── 2. 신청 내역 조회 (소유권 + 상태 검증) ─────────────────────
    const { data: application, error: appErr } = await supabase
      .from('exam_applications')
      .select('*, exam:exams(id, passing_score, question_count, exam_start_at, exam_end_at)')
      .eq('id', applicationId)
      .eq('user_id', user.id)   // 반드시 본인 신청건만
      .maybeSingle()

    if (appErr || !application) {
      return NextResponse.json(
        { error: '신청 내역을 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // ── 상태 + 시험 시간 이중 검증 (서버사이드) ─────────────────
    const now = new Date()
    const eligibility = verifySubmitEligibility(application, now)
    if (!eligibility.ok) {
      return NextResponse.json(
        { error: eligibility.error },
        { status: eligibility.status }
      )
    }

    // ── 3. memo에서 출제된 문제 ID 순서 복원 ──────────────────────
    let questionIds: string[] | null = null
    if (application.memo) {
      try {
        const memo = JSON.parse(application.memo)
        if (Array.isArray(memo.selectedQuestionIds)) {
          questionIds = memo.selectedQuestionIds as string[]
        }
      } catch { /* memo 파싱 실패 시 전체 문제 사용 */ }
    }

    // ── 4. 문제 조회 ──────────────────────────────────────────────
    let questionsQuery = supabase
      .from('questions')
      .select('id, question_text, question_type, options, correct_answer, explanation, score_weight, order_num')
      .eq('exam_id', application.exam_id)
      .eq('is_active', true)

    if (questionIds && questionIds.length > 0) {
      // memo에 저장된 특정 문제만 조회
      questionsQuery = questionsQuery.in('id', questionIds)
    }

    const { data: allQuestions, error: qErr } = await questionsQuery

    if (qErr || !allQuestions || allQuestions.length === 0) {
      return NextResponse.json(
        { error: '시험 문제를 불러올 수 없습니다.' },
        { status: 500 }
      )
    }

    // memo 순서대로 정렬 (없으면 order_num 기준)
    const questions: QuestionForGrade[] = questionIds
      ? (questionIds
          .map((id: string) => allQuestions.find((q: QuestionForGrade) => q.id === id))
          .filter(Boolean) as QuestionForGrade[])
      : (allQuestions as QuestionForGrade[]).sort(
          (a: QuestionForGrade, b: QuestionForGrade) => a.order_num - b.order_num
        )

    // ── 5. 서버 사이드 채점 ────────────────────────────────────────
    const { score, correctCount, totalWeight, detail } = gradeExam(questions, answers)
    // 합격 기준: exam.passing_score 우선, 없으면 기본값 70점
    const passingScore = application.exam?.passing_score ?? 70
    const passed = score >= passingScore
    // 즉시 합격/불합격 판정 상태
    const finalStatus = passed ? 'passed' : 'failed'

    const nowIso = now.toISOString()

    // ── 6. submissions 테이블에 답안 + 채점 결과 저장 ──────────────
    const submissionRows = detail.map((d) => ({
      application_id:  applicationId,
      question_id:     d.questionId,
      selected_answer: d.selectedAnswer,
      is_correct:      d.isCorrect,
      score_earned:    d.scoreEarned,
      answered_at:     nowIso,
    }))

    const { error: subErr } = await supabase
      .from('submissions')
      .upsert(submissionRows, { onConflict: 'application_id,question_id' })

    if (subErr) {
      console.error('[submit] submissions upsert error:', subErr)
      // 답안 저장 실패해도 채점 결과는 반환 (best-effort)
    }

    // ── 7. exam_applications 상태 업데이트 ─────────────────────────
    // exam_completed 를 거치지 않고 passed / failed 로 즉시 전환
    const { error: updateErr } = await supabase
      .from('exam_applications')
      .update({
        status:             finalStatus,   // 'passed' | 'failed'
        score,
        exam_started_at:    application.exam_started_at ?? nowIso,
        exam_submitted_at:  nowIso,
        result_notified_at: nowIso,        // 즉시 판정이므로 동시 기록
      })
      .eq('id', applicationId)

    if (updateErr) {
      console.error('[submit] application update error:', updateErr)
      return NextResponse.json(
        { error: '채점 결과 저장 중 오류가 발생했습니다.' },
        { status: 500 }
      )
    }

    // ── 8. 응답 반환 ──────────────────────────────────────────────
    return NextResponse.json({
      success:        true,
      score,
      passed,
      passingScore,
      totalQuestions: questions.length,
      correctCount,
      totalWeight,
      detail: detail.sort((a, b) => a.orderNum - b.orderNum),
    })

  } catch (err) {
    console.error('[submit] unexpected error:', err)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
