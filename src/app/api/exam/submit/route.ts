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
    const correct  = String(q.correct_answer ?? '').trim().toLowerCase()
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
      correctAnswer:  q.correct_answer,
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
      .select('*, exam:exams(id, passing_score, question_count)')
      .eq('id', applicationId)
      .eq('user_id', user.id)   // 반드시 본인 신청건만
      .maybeSingle()

    if (appErr || !application) {
      return NextResponse.json(
        { error: '신청 내역을 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 이미 제출된 경우 중복 제출 방지
    if (application.status !== 'approved') {
      return NextResponse.json(
        { error: '이미 제출된 시험이거나 응시 가능 상태가 아닙니다.' },
        { status: 409 }
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
    const passingScore = application.exam?.passing_score ?? 60
    const passed = score >= passingScore

    const now = new Date().toISOString()

    // ── 6. submissions 테이블에 답안 + 채점 결과 저장 ──────────────
    const submissionRows = detail.map((d) => ({
      application_id:  applicationId,
      question_id:     d.questionId,
      selected_answer: d.selectedAnswer,
      is_correct:      d.isCorrect,
      score_earned:    d.scoreEarned,
      answered_at:     now,
    }))

    const { error: subErr } = await supabase
      .from('submissions')
      .upsert(submissionRows, { onConflict: 'application_id,question_id' })

    if (subErr) {
      console.error('[submit] submissions upsert error:', subErr)
      // 답안 저장 실패해도 채점 결과는 반환 (best-effort)
    }

    // ── 7. exam_applications 상태 업데이트 ────────────────────────
    const { error: updateErr } = await supabase
      .from('exam_applications')
      .update({
        status:            'exam_completed',
        score,
        exam_started_at:   application.exam_started_at ?? now,
        exam_submitted_at: now,
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
