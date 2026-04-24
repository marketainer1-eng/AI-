'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { ApplicationWithExam, QuestionRow } from '@/types'

interface ExamTakeClientProps {
  application: ApplicationWithExam
  questions: QuestionRow[]
  /** 서버에서 계산한 남은 초 (exam_end_at 기준) */
  initialRemainingSeconds: number
}

// ─── 시간 포맷 ────────────────────────────────────────────────
function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (h > 0) {
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  }
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

// ─── 타이머 경고 임계값 (초) ─────────────────────────────────
const WARN_THRESHOLD  = 300  // 5분 - 경고
const DANGER_THRESHOLD = 60  // 1분 - 위험

// ─── 문제 유형별 선택지 추출 ─────────────────────────────────
function getChoices(q: QuestionRow): string[] {
  if (q.question_type === 'true_false') return ['O', 'X']
  return (q.options as string[] | null) ?? []
}

// ─── 채점: 배점 가중치 기반 점수 계산 ────────────────────────
function calcScore(
  questions: QuestionRow[],
  answers: Record<string, string | null>
): number {
  const totalWeight = questions.reduce((s, q) => s + q.score_weight, 0)
  if (totalWeight === 0) return 0

  const earnedWeight = questions.reduce((s, q) => {
    const given = (answers[q.id] ?? '').trim()
    const correct = String(q.correct_answer ?? '').trim()
    // 대소문자·공백 무시 비교
    return s + (given.toLowerCase() === correct.toLowerCase() ? q.score_weight : 0)
  }, 0)

  return parseFloat(((earnedWeight / totalWeight) * 100).toFixed(2))
}

export default function ExamTakeClient({
  application,
  questions,
  initialRemainingSeconds,
}: ExamTakeClientProps) {
  const router = useRouter()

  // answers: questionId → 선택한 실제 텍스트 (객관식·OX) 또는 직접 입력 (단답형)
  const [answers, setAnswers] = useState<Record<string, string | null>>({})
  const [timeLeft, setTimeLeft] = useState(initialRemainingSeconds)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false)
  const [currentPage, setCurrentPage] = useState(0)
  const submitCalledRef = useRef(false)

  const QUESTIONS_PER_PAGE = 5
  const totalPages = Math.ceil(questions.length / QUESTIONS_PER_PAGE)
  const pagedQuestions = questions.slice(
    currentPage * QUESTIONS_PER_PAGE,
    (currentPage + 1) * QUESTIONS_PER_PAGE
  )

  // ── 제출 처리 ────────────────────────────────────────────────
  const handleSubmit = useCallback(async (isAutoSubmit = false) => {
    if (submitCalledRef.current) return
    submitCalledRef.current = true
    setSubmitting(true)
    setShowSubmitConfirm(false)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = createClient() as any

    try {
      // 1. 답안 저장 (실제 선택/입력 텍스트 저장)
      const submissionRows = questions.map((q) => ({
        application_id: application.id,
        question_id: q.id,
        selected_answer: answers[q.id] ?? null,
      }))
      await supabase
        .from('submissions')
        .upsert(submissionRows, { onConflict: 'application_id,question_id' })

      // 2. 자동 채점 (배점 가중치 반영)
      const score = calcScore(questions, answers)

      // 3. 상태 업데이트 (exam_completed: 관리자가 최종 확인 후 passed/failed 처리)
      await supabase
        .from('exam_applications')
        .update({
          status: 'exam_completed',
          score,
          exam_started_at:   application.exam_started_at ?? new Date().toISOString(),
          exam_submitted_at: new Date().toISOString(),
        })
        .eq('id', application.id)

      setSubmitted(true)
      setTimeout(() => {
        router.push('/exam/result')
        router.refresh()
      }, 2500)
    } catch {
      submitCalledRef.current = false
      setSubmitting(false)
    }
  }, [answers, application, questions, router])

  // ── 타이머 ────────────────────────────────────────────────────
  useEffect(() => {
    if (submitted || submitting) return
    if (timeLeft <= 0) {
      handleSubmit(true)
      return
    }
    const endAt = Date.now() + timeLeft * 1000
    const id = setInterval(() => {
      const remaining = Math.max(0, Math.ceil((endAt - Date.now()) / 1000))
      setTimeLeft(remaining)
      if (remaining === 0) {
        clearInterval(id)
        handleSubmit(true)
      }
    }, 500)
    return () => clearInterval(id)
  }, [submitted, submitting]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── 타이머 색상 ──────────────────────────────────────────────
  const timerClass =
    timeLeft <= DANGER_THRESHOLD
      ? 'text-red-600 animate-pulse'
      : timeLeft <= WARN_THRESHOLD
      ? 'text-orange-500'
      : 'text-gray-900'

  // ── 제출 완료 화면 ───────────────────────────────────────────
  if (submitted) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-5">
            <svg className="w-10 h-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">시험 제출 완료!</h1>
          <p className="text-gray-500">결과 조회 페이지로 이동합니다...</p>
          <div className="mt-4 flex justify-center">
            <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
          </div>
        </div>
      </div>
    )
  }

  const answeredCount = Object.values(answers).filter((v) => v !== null && v !== '').length
  const unansweredCount = questions.length - answeredCount
  const progressPercent = questions.length > 0 ? (answeredCount / questions.length) * 100 : 0

  return (
    <div className="max-w-3xl mx-auto pb-16">

      {/* ── 상단 고정 헤더 ── */}
      <div className="sticky top-0 z-20 bg-white border-b border-gray-200 shadow-sm -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 mb-6">
        <div className="max-w-3xl mx-auto py-3 flex items-center justify-between gap-4">
          <div className="min-w-0 flex-1">
            <h1 className="font-bold text-gray-900 text-sm truncate">
              {application.exam?.title}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-500 rounded-full transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <span className="text-xs text-gray-400 shrink-0 tabular-nums">
                {answeredCount}/{questions.length}
              </span>
            </div>
          </div>
          <div className="shrink-0 flex flex-col items-end">
            <div className={`text-2xl font-mono font-bold tabular-nums ${timerClass}`}>
              ⏱ {formatTime(timeLeft)}
            </div>
            {timeLeft <= WARN_THRESHOLD && (
              <span className="text-[10px] text-orange-500 font-medium">
                {timeLeft <= DANGER_THRESHOLD ? '⚠️ 곧 종료!' : '시간이 얼마 남지 않았습니다'}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── 문제 목록 ── */}
      <div className="space-y-5">
        {pagedQuestions.map((q, relIdx) => {
          const absIdx = currentPage * QUESTIONS_PER_PAGE + relIdx
          const currentAnswer = answers[q.id] ?? null
          const isAnswered = currentAnswer !== null && currentAnswer !== ''
          const choices = getChoices(q)

          return (
            <article
              key={q.id}
              id={`q-${q.id}`}
              className={`bg-white rounded-xl border p-6 transition-colors ${
                isAnswered ? 'border-indigo-200' : 'border-gray-200'
              }`}
            >
              {/* 문제 번호 + 유형 뱃지 + 배점 */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 text-xs font-bold">
                    Q{absIdx + 1}
                  </span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                    q.question_type === 'multiple_choice' ? 'bg-blue-100 text-blue-600' :
                    q.question_type === 'true_false'      ? 'bg-orange-100 text-orange-600' :
                                                            'bg-teal-100 text-teal-600'
                  }`}>
                    {q.question_type === 'multiple_choice' ? '객관식' :
                     q.question_type === 'true_false'      ? 'O/X' : '단답형'}
                  </span>
                </div>
                <span className="text-xs text-gray-400">{q.score_weight}점</span>
              </div>

              {/* 문제 텍스트 */}
              <p className="text-gray-900 font-medium leading-relaxed mb-4 whitespace-pre-wrap">
                {q.question_text}
              </p>

              {/* ── 객관식 / O×X 선택지 ── */}
              {(q.question_type === 'multiple_choice' || q.question_type === 'true_false') && (
                <div className={`gap-2 ${q.question_type === 'true_false' ? 'flex' : 'space-y-2'}`}>
                  {choices.map((option, optIdx) => {
                    // value = 실제 보기 텍스트 (정답 비교에 직접 사용)
                    const selected = currentAnswer === option
                    return (
                      <label
                        key={optIdx}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer border-2 transition-all select-none ${
                          q.question_type === 'true_false' ? 'flex-1 justify-center' : ''
                        } ${
                          selected
                            ? 'border-indigo-500 bg-indigo-50 shadow-sm'
                            : 'border-gray-100 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {/* 커스텀 라디오 */}
                        <span
                          className={`shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                            selected ? 'border-indigo-500 bg-indigo-500' : 'border-gray-300'
                          }`}
                        >
                          {selected && <span className="w-2 h-2 rounded-full bg-white" />}
                        </span>

                        {/* 번호 뱃지 (객관식만) */}
                        {q.question_type === 'multiple_choice' && (
                          <span
                            className={`shrink-0 w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold ${
                              selected ? 'bg-indigo-500 text-white' : 'bg-gray-100 text-gray-500'
                            }`}
                          >
                            {optIdx + 1}
                          </span>
                        )}

                        <span className={`text-sm font-medium ${
                          q.question_type === 'true_false' ? 'text-lg' : ''
                        } ${selected ? 'text-indigo-900' : 'text-gray-700'}`}>
                          {option}
                        </span>

                        <input
                          type="radio"
                          name={q.id}
                          value={option}
                          checked={selected}
                          onChange={() =>
                            setAnswers((prev) => ({ ...prev, [q.id]: option }))
                          }
                          className="sr-only"
                        />
                      </label>
                    )
                  })}
                </div>
              )}

              {/* ── 단답형 입력 ── */}
              {q.question_type === 'short_answer' && (
                <div>
                  <input
                    type="text"
                    value={currentAnswer ?? ''}
                    onChange={(e) =>
                      setAnswers((prev) => ({
                        ...prev,
                        [q.id]: e.target.value || null,
                      }))
                    }
                    placeholder="답을 입력하세요"
                    className={`w-full px-4 py-3 rounded-xl border-2 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-300 ${
                      isAnswered
                        ? 'border-indigo-300 bg-indigo-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  />
                  <p className="text-xs text-gray-400 mt-1.5">
                    💡 정확한 답을 입력하세요. 대소문자는 구분하지 않습니다.
                  </p>
                </div>
              )}

              {/* 미답변 표시 */}
              {!isAnswered && (
                <p className="mt-2.5 text-xs text-gray-400">아직 답변하지 않았습니다.</p>
              )}
            </article>
          )
        })}
      </div>

      {/* ── 페이지네이션 ── */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-8">
          <button
            onClick={() => { setCurrentPage((p) => Math.max(0, p - 1)); window.scrollTo(0, 0) }}
            disabled={currentPage === 0}
            className="px-3 py-1.5 text-sm text-gray-600 bg-white border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50 transition-colors"
          >
            ← 이전
          </button>
          {Array.from({ length: totalPages }).map((_, i) => (
            <button
              key={i}
              onClick={() => { setCurrentPage(i); window.scrollTo(0, 0) }}
              className={`w-8 h-8 text-sm rounded-lg transition-colors font-medium ${
                i === currentPage
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {i + 1}
            </button>
          ))}
          <button
            onClick={() => { setCurrentPage((p) => Math.min(totalPages - 1, p + 1)); window.scrollTo(0, 0) }}
            disabled={currentPage === totalPages - 1}
            className="px-3 py-1.5 text-sm text-gray-600 bg-white border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50 transition-colors"
          >
            다음 →
          </button>
        </div>
      )}

      {/* ── 답변 현황 & 제출 ── */}
      <div className="mt-8 bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="text-sm font-semibold text-gray-700 mb-3">답변 현황</h2>

        {/* 문제 번호 그리드 (클릭 시 해당 페이지로 이동) */}
        <div className="flex flex-wrap gap-1.5 mb-5">
          {questions.map((q, idx) => {
            const ans = answers[q.id]
            const isAnswered = ans !== undefined && ans !== null && ans !== ''
            const pageOfQ = Math.floor(idx / QUESTIONS_PER_PAGE)
            return (
              <button
                key={q.id}
                onClick={() => { setCurrentPage(pageOfQ); window.scrollTo(0, 0) }}
                className={`w-8 h-8 text-xs font-medium rounded-md transition-colors ${
                  isAnswered
                    ? 'bg-indigo-500 text-white'
                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                }`}
                title={`Q${idx + 1} ${isAnswered ? '(답변 완료)' : '(미답변)'}`}
              >
                {idx + 1}
              </button>
            )
          })}
        </div>

        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-500">
            <span className="font-semibold text-indigo-600">{answeredCount}</span>
            /{questions.length} 문제 완료
            {unansweredCount > 0 && (
              <span className="ml-2 text-orange-500">({unansweredCount}개 미답변)</span>
            )}
          </div>

          <button
            onClick={() => setShowSubmitConfirm(true)}
            disabled={submitting}
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm"
          >
            {submitting ? '제출 중...' : '시험 제출'}
          </button>
        </div>
      </div>

      {/* ── 제출 확인 모달 ── */}
      {showSubmitConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-7">
            <div className="text-center mb-5">
              <div className="text-4xl mb-3">📝</div>
              <h2 className="text-lg font-bold text-gray-900">시험을 제출하시겠습니까?</h2>
              <p className="text-sm text-gray-500 mt-1">제출 후에는 수정이 불가합니다.</p>
            </div>

            {unansweredCount > 0 && (
              <div className="mb-4 p-3 bg-orange-50 border border-orange-100 rounded-xl text-sm text-orange-700 text-center">
                ⚠️ <strong>{unansweredCount}개</strong> 문제에 아직 답변하지 않았습니다.
              </div>
            )}

            <div className="bg-gray-50 rounded-xl p-3 mb-5 text-sm space-y-1.5">
              <div className="flex justify-between">
                <span className="text-gray-500">답변 완료</span>
                <span className="font-semibold">{answeredCount} / {questions.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">남은 시간</span>
                <span className={`font-mono font-semibold ${timeLeft <= DANGER_THRESHOLD ? 'text-red-600' : 'text-gray-700'}`}>
                  {formatTime(timeLeft)}
                </span>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowSubmitConfirm(false)}
                className="flex-1 py-2.5 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
              >
                계속 풀기
              </button>
              <button
                onClick={() => handleSubmit(false)}
                disabled={submitting}
                className="flex-1 py-2.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-xl transition-colors"
              >
                {submitting ? '제출 중...' : '제출하기'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
