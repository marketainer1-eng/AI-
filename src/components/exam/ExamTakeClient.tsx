'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { ApplicationWithExam, QuestionRow } from '@/types'

interface ExamTakeClientProps {
  application: ApplicationWithExam
  questions: QuestionRow[]          // 선택된 N문제 (순서 고정)
  initialRemainingSeconds: number
  totalQuestionCount: number        // 전체 문제 풀 수 (정보 표시용)
  selectedCount: number             // 실제 출제 수
}

// ─── 시간 포맷 ────────────────────────────────────────────────
function formatTime(sec: number): string {
  const h = Math.floor(sec / 3600)
  const m = Math.floor((sec % 3600) / 60)
  const s = sec % 60
  if (h > 0)
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

// ─── 배점 가중치 기반 채점 ────────────────────────────────────
function calcScore(
  questions: QuestionRow[],
  answers: Record<string, string | null>
): number {
  const totalW = questions.reduce((s, q) => s + q.score_weight, 0)
  if (totalW === 0) return 0
  const earnedW = questions.reduce((s, q) => {
    const given   = (answers[q.id] ?? '').trim().toLowerCase()
    const correct = String(q.correct_answer ?? '').trim().toLowerCase()
    return s + (given === correct ? q.score_weight : 0)
  }, 0)
  return parseFloat(((earnedW / totalW) * 100).toFixed(2))
}

// ─── 선택지 추출 ─────────────────────────────────────────────
function getChoices(q: QuestionRow): string[] {
  if (q.question_type === 'true_false') return ['O', 'X']
  return (q.options as string[] | null) ?? []
}

const WARN_SEC   = 300  // 5분
const DANGER_SEC = 60   // 1분
const PER_PAGE   = 5    // 페이지당 문제 수

// ─── 유형 뱃지 ───────────────────────────────────────────────
const TYPE_META: Record<string, { label: string; cls: string }> = {
  multiple_choice: { label: '객관식', cls: 'bg-blue-100 text-blue-700' },
  true_false:      { label: 'O / X', cls: 'bg-orange-100 text-orange-700' },
  short_answer:    { label: '단답형', cls: 'bg-teal-100 text-teal-700' },
}

export default function ExamTakeClient({
  application,
  questions,
  initialRemainingSeconds,
  totalQuestionCount,
  selectedCount,
}: ExamTakeClientProps) {
  const router = useRouter()

  const [answers,     setAnswers]     = useState<Record<string, string | null>>({})
  const [timeLeft,    setTimeLeft]    = useState(initialRemainingSeconds)
  const [submitting,  setSubmitting]  = useState(false)
  const [submitted,   setSubmitted]   = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [page,        setPage]        = useState(0)
  const submitRef = useRef(false)

  const totalPages    = Math.ceil(questions.length / PER_PAGE)
  const pagedQs       = questions.slice(page * PER_PAGE, (page + 1) * PER_PAGE)
  const answeredCount = Object.values(answers).filter(v => v !== null && v !== '').length
  const unanswered    = questions.length - answeredCount
  const progress      = questions.length > 0 ? (answeredCount / questions.length) * 100 : 0

  // ── 제출 ────────────────────────────────────────────────────
  const handleSubmit = useCallback(async (auto = false) => {
    if (submitRef.current) return
    submitRef.current = true
    setSubmitting(true)
    setShowConfirm(false)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = createClient() as any
    try {
      // 1. 답안 저장
      const rows = questions.map(q => ({
        application_id:  application.id,
        question_id:     q.id,
        selected_answer: answers[q.id] ?? null,
      }))
      await supabase
        .from('submissions')
        .upsert(rows, { onConflict: 'application_id,question_id' })

      // 2. 자동 채점 (배점 가중치 기반)
      const score = calcScore(questions, answers)

      // 3. 신청 상태 업데이트
      await supabase
        .from('exam_applications')
        .update({
          status:           'exam_completed',
          score,
          exam_started_at:  application.exam_started_at ?? new Date().toISOString(),
          exam_submitted_at: new Date().toISOString(),
        })
        .eq('id', application.id)

      setSubmitted(true)
      setTimeout(() => { router.push('/exam/result'); router.refresh() }, 2500)
    } catch {
      submitRef.current = false
      setSubmitting(false)
    }
  }, [answers, application, questions, router])

  // ── 타이머 ──────────────────────────────────────────────────
  useEffect(() => {
    if (submitted || submitting) return
    if (timeLeft <= 0) { handleSubmit(true); return }
    const end = Date.now() + timeLeft * 1000
    const id = setInterval(() => {
      const rem = Math.max(0, Math.ceil((end - Date.now()) / 1000))
      setTimeLeft(rem)
      if (rem === 0) { clearInterval(id); handleSubmit(true) }
    }, 500)
    return () => clearInterval(id)
  }, [submitted, submitting]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── 페이지 이동 헬퍼 ────────────────────────────────────────
  const goPage = (n: number) => { setPage(n); window.scrollTo({ top: 0, behavior: 'smooth' }) }

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
          <p className="text-gray-500 text-sm">결과 조회 페이지로 이동합니다...</p>
          <div className="mt-4 flex justify-center">
            <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
          </div>
        </div>
      </div>
    )
  }

  // ── 타이머 색상 ──────────────────────────────────────────────
  const timerCls =
    timeLeft <= DANGER_SEC ? 'text-red-600 animate-pulse font-mono font-black' :
    timeLeft <= WARN_SEC   ? 'text-orange-500 font-mono font-bold' :
                             'text-gray-900 font-mono font-bold'

  return (
    <div className="max-w-3xl mx-auto pb-20">

      {/* ═══ 상단 고정 헤더 ═══ */}
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-gray-200 shadow-sm
                      -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 mb-6">
        <div className="max-w-3xl mx-auto py-3">
          <div className="flex items-center justify-between gap-4">

            {/* 시험명 + 진행 바 */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h1 className="font-bold text-gray-900 text-sm truncate">
                  {application.exam?.title}
                </h1>
                <span className="shrink-0 text-[10px] px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 font-medium">
                  {selectedCount}문제 출제 / 전체 {totalQuestionCount}문항 중
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${progress}%`,
                      background: progress === 100
                        ? 'linear-gradient(90deg,#22c55e,#16a34a)'
                        : 'linear-gradient(90deg,#6366f1,#818cf8)',
                    }}
                  />
                </div>
                <span className="text-xs text-gray-500 shrink-0 tabular-nums font-medium">
                  {answeredCount} / {questions.length}
                </span>
              </div>
            </div>

            {/* 타이머 */}
            <div className="shrink-0 text-right">
              <div className={`text-2xl tabular-nums leading-none ${timerCls}`}>
                ⏱ {formatTime(timeLeft)}
              </div>
              {timeLeft <= WARN_SEC && (
                <p className={`text-[10px] mt-0.5 font-medium ${
                  timeLeft <= DANGER_SEC ? 'text-red-500' : 'text-orange-400'
                }`}>
                  {timeLeft <= DANGER_SEC ? '⚠️ 곧 종료!' : '시간이 얼마 남지 않았습니다'}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ═══ 문제 목록 ═══ */}
      <div className="space-y-6">
        {pagedQs.map((q, relIdx) => {
          const absIdx    = page * PER_PAGE + relIdx
          const choices   = getChoices(q)
          const curAns    = answers[q.id] ?? null
          const answered  = curAns !== null && curAns !== ''
          const typeMeta  = TYPE_META[q.question_type] ?? { label: q.question_type, cls: 'bg-gray-100 text-gray-600' }
          const isTF      = q.question_type === 'true_false'
          const isShort   = q.question_type === 'short_answer'

          return (
            <article
              key={q.id}
              id={`q-${q.id}`}
              className={`bg-white rounded-2xl shadow-sm border-2 transition-all duration-200 overflow-hidden ${
                answered ? 'border-indigo-300' : 'border-gray-100 hover:border-gray-200'
              }`}
            >
              {/* 문제 헤더 */}
              <div className={`px-6 py-4 border-b ${answered ? 'bg-indigo-50 border-indigo-100' : 'bg-gray-50 border-gray-100'}`}>
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    {/* 문제 번호 */}
                    <span className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-black shrink-0 ${
                      answered ? 'bg-indigo-600 text-white' : 'bg-white border-2 border-gray-200 text-gray-600'
                    }`}>
                      {absIdx + 1}
                    </span>
                    {/* 유형 뱃지 */}
                    <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-semibold ${typeMeta.cls}`}>
                      {typeMeta.label}
                    </span>
                    {/* 배점 */}
                    <span className="text-xs text-gray-400">{q.score_weight}점</span>
                  </div>
                  {/* 답변 완료 표시 */}
                  {answered && (
                    <span className="flex items-center gap-1 text-xs text-indigo-600 font-semibold shrink-0">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      답변 완료
                    </span>
                  )}
                </div>
              </div>

              <div className="px-6 py-5">
                {/* 문제 텍스트 */}
                <p className="text-gray-900 font-semibold text-[15px] leading-relaxed mb-5 whitespace-pre-wrap">
                  {q.question_text}
                </p>

                {/* ── 객관식 선택지 ── */}
                {!isTF && !isShort && choices.length > 0 && (
                  <div className="space-y-2.5">
                    {choices.map((option, oi) => {
                      const selected = curAns === option
                      return (
                        <label
                          key={oi}
                          className={`group flex items-center gap-3.5 px-4 py-3.5 rounded-xl border-2 cursor-pointer
                                      select-none transition-all duration-150 ${
                            selected
                              ? 'border-indigo-500 bg-indigo-50 shadow-sm'
                              : 'border-gray-100 bg-gray-50 hover:border-indigo-200 hover:bg-indigo-50/30'
                          }`}
                        >
                          {/* 번호 원 */}
                          <span className={`shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold
                                           transition-colors ${
                            selected
                              ? 'bg-indigo-600 text-white'
                              : 'bg-white border border-gray-200 text-gray-500 group-hover:border-indigo-300'
                          }`}>
                            {oi + 1}
                          </span>

                          {/* 보기 텍스트 */}
                          <span className={`flex-1 text-sm leading-relaxed ${
                            selected ? 'text-indigo-900 font-semibold' : 'text-gray-700'
                          }`}>
                            {option}
                          </span>

                          {/* 선택 아이콘 */}
                          {selected && (
                            <svg className="w-5 h-5 text-indigo-500 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                          )}

                          <input
                            type="radio"
                            name={q.id}
                            value={option}
                            checked={selected}
                            onChange={() => setAnswers(prev => ({ ...prev, [q.id]: option }))}
                            className="sr-only"
                          />
                        </label>
                      )
                    })}
                  </div>
                )}

                {/* ── O / X 선택지 ── */}
                {isTF && (
                  <div className="flex gap-3">
                    {['O', 'X'].map(v => {
                      const selected = curAns === v
                      return (
                        <label
                          key={v}
                          className={`flex-1 flex flex-col items-center justify-center py-6 rounded-2xl border-2 cursor-pointer
                                      select-none transition-all duration-150 ${
                            selected
                              ? v === 'O'
                                ? 'border-blue-500 bg-blue-50 shadow-sm'
                                : 'border-red-500 bg-red-50 shadow-sm'
                              : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          <span className={`text-5xl font-black leading-none mb-1 ${
                            selected
                              ? v === 'O' ? 'text-blue-600' : 'text-red-500'
                              : 'text-gray-300'
                          }`}>
                            {v}
                          </span>
                          <span className={`text-xs font-medium ${
                            selected
                              ? v === 'O' ? 'text-blue-500' : 'text-red-400'
                              : 'text-gray-400'
                          }`}>
                            {v === 'O' ? '맞다' : '틀리다'}
                          </span>
                          <input
                            type="radio"
                            name={q.id}
                            value={v}
                            checked={selected}
                            onChange={() => setAnswers(prev => ({ ...prev, [q.id]: v }))}
                            className="sr-only"
                          />
                        </label>
                      )
                    })}
                  </div>
                )}

                {/* ── 단답형 입력 ── */}
                {isShort && (
                  <div>
                    <input
                      type="text"
                      value={curAns ?? ''}
                      onChange={e =>
                        setAnswers(prev => ({ ...prev, [q.id]: e.target.value || null }))
                      }
                      placeholder="답을 입력하세요"
                      className={`w-full px-4 py-3.5 rounded-xl border-2 text-sm font-medium
                                  focus:outline-none focus:ring-2 focus:ring-indigo-300 transition-colors ${
                        answered
                          ? 'border-indigo-300 bg-indigo-50 text-indigo-900'
                          : 'border-gray-200 bg-gray-50 text-gray-800 hover:border-gray-300'
                      }`}
                    />
                    <p className="text-xs text-gray-400 mt-2">
                      💡 대소문자를 구분하지 않습니다.
                    </p>
                  </div>
                )}

                {/* 미답변 안내 */}
                {!answered && (
                  <p className="mt-4 text-xs text-gray-400 flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    아직 답변하지 않았습니다.
                  </p>
                )}
              </div>
            </article>
          )
        })}
      </div>

      {/* ═══ 페이지네이션 ═══ */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-1.5 mt-8">
          <button
            onClick={() => goPage(Math.max(0, page - 1))}
            disabled={page === 0}
            className="px-3 py-2 text-sm text-gray-600 bg-white border border-gray-200 rounded-lg
                       disabled:opacity-40 hover:bg-gray-50 transition-colors"
          >
            ← 이전
          </button>

          <div className="flex gap-1">
            {Array.from({ length: totalPages }, (_, i) => {
              // 답변 완료 여부 계산 (해당 페이지)
              const pageQs  = questions.slice(i * PER_PAGE, (i + 1) * PER_PAGE)
              const allDone = pageQs.every(q => answers[q.id] !== undefined && answers[q.id] !== null && answers[q.id] !== '')
              const someDone = pageQs.some(q => answers[q.id] !== undefined && answers[q.id] !== null && answers[q.id] !== '')

              return (
                <button
                  key={i}
                  onClick={() => goPage(i)}
                  className={`w-9 h-9 text-xs rounded-lg transition-all font-semibold relative ${
                    i === page
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : allDone
                      ? 'bg-green-100 text-green-700 hover:bg-green-200'
                      : someDone
                      ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                      : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                  title={`${i * PER_PAGE + 1}~${Math.min((i + 1) * PER_PAGE, questions.length)}번`}
                >
                  {i + 1}
                  {allDone && i !== page && (
                    <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border border-white" />
                  )}
                </button>
              )
            })}
          </div>

          <button
            onClick={() => goPage(Math.min(totalPages - 1, page + 1))}
            disabled={page === totalPages - 1}
            className="px-3 py-2 text-sm text-gray-600 bg-white border border-gray-200 rounded-lg
                       disabled:opacity-40 hover:bg-gray-50 transition-colors"
          >
            다음 →
          </button>
        </div>
      )}

      {/* ═══ 답변 현황 + 제출 패널 ═══ */}
      <div className="mt-8 bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {/* 헤더 */}
        <div className="px-5 py-4 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-sm font-bold text-gray-800">답변 현황</h2>
          <div className="flex items-center gap-3 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-sm bg-indigo-500 inline-block" /> 완료
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-sm bg-gray-200 inline-block" /> 미답변
            </span>
          </div>
        </div>

        <div className="px-5 py-4">
          {/* 문제 번호 그리드 */}
          <div className="flex flex-wrap gap-1.5 mb-5">
            {questions.map((q, idx) => {
              const ans      = answers[q.id]
              const done     = ans !== undefined && ans !== null && ans !== ''
              const pageOfQ  = Math.floor(idx / PER_PAGE)
              const isCurrent = pageOfQ === page
              return (
                <button
                  key={q.id}
                  onClick={() => goPage(pageOfQ)}
                  title={`Q${idx + 1}${done ? ' ✓' : ''}`}
                  className={`w-8 h-8 text-xs font-semibold rounded-lg transition-all ${
                    done
                      ? 'bg-indigo-500 text-white hover:bg-indigo-600'
                      : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                  } ${isCurrent ? 'ring-2 ring-offset-1 ring-indigo-400' : ''}`}
                >
                  {idx + 1}
                </button>
              )
            })}
          </div>

          {/* 통계 + 제출 버튼 */}
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-4 text-sm">
                <span className="text-gray-500">
                  완료{' '}
                  <strong className="text-indigo-600 text-base">{answeredCount}</strong>
                  <span className="text-gray-400"> / {questions.length}</span>
                </span>
                {unanswered > 0 && (
                  <span className="text-orange-500 font-medium text-xs">
                    {unanswered}개 미답변
                  </span>
                )}
              </div>
              <div className="text-xs text-gray-400">
                합격 기준: {application.exam?.passing_score}점 이상
              </div>
            </div>

            <button
              onClick={() => setShowConfirm(true)}
              disabled={submitting}
              className="px-7 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400
                         text-white text-sm font-bold rounded-xl transition-colors shadow-sm
                         flex items-center gap-2"
            >
              {submitting ? (
                <>
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  제출 중...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M5 13l4 4L19 7" />
                  </svg>
                  시험 제출
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ═══ 제출 확인 모달 ═══ */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-7 animate-in fade-in zoom-in-95 duration-200">
            <div className="text-center mb-6">
              <div className="text-5xl mb-4">📝</div>
              <h2 className="text-xl font-bold text-gray-900">시험을 제출하시겠습니까?</h2>
              <p className="text-sm text-gray-500 mt-1">제출 후에는 수정이 불가합니다.</p>
            </div>

            {/* 미답변 경고 */}
            {unanswered > 0 && (
              <div className="mb-4 p-3.5 bg-orange-50 border border-orange-200 rounded-xl text-center">
                <p className="text-sm text-orange-700">
                  ⚠️ <strong>{unanswered}개</strong> 문제에 답변하지 않았습니다.
                </p>
                <p className="text-xs text-orange-500 mt-0.5">
                  미답변 문제는 오답 처리됩니다.
                </p>
              </div>
            )}

            {/* 요약 */}
            <div className="bg-gray-50 rounded-xl p-4 mb-6 space-y-2.5 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">출제 문제</span>
                <span className="font-semibold">{questions.length}문제</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">답변 완료</span>
                <span className={`font-semibold ${answeredCount === questions.length ? 'text-green-600' : 'text-orange-500'}`}>
                  {answeredCount} / {questions.length}
                </span>
              </div>
              <div className="flex justify-between border-t border-gray-200 pt-2.5">
                <span className="text-gray-500">남은 시간</span>
                <span className={`font-mono font-bold ${timeLeft <= DANGER_SEC ? 'text-red-600' : 'text-gray-800'}`}>
                  {formatTime(timeLeft)}
                </span>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 py-3 text-sm font-semibold text-gray-700 bg-gray-100
                           hover:bg-gray-200 rounded-xl transition-colors"
              >
                계속 풀기
              </button>
              <button
                onClick={() => handleSubmit(false)}
                disabled={submitting}
                className="flex-1 py-3 text-sm font-bold text-white bg-indigo-600
                           hover:bg-indigo-700 disabled:opacity-50 rounded-xl transition-colors"
              >
                {submitting ? '제출 중...' : '최종 제출'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
