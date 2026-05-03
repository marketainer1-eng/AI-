'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import type { ApplicationWithExam, QuestionRow } from '@/types'

interface ExamTakeClientProps {
  application: ApplicationWithExam
  questions: QuestionRow[]          // 선택된 N문제 (순서 고정)
  initialRemainingSeconds: number
  totalQuestionCount: number        // 전체 문제 풀 수 (정보 표시용)
  selectedCount: number             // 실제 출제 수
  /** 시험 종료 시각 ISO 문자열 — 응시 중 실시간 시험 시간 만료 감지용 */
  examEndAt: string
}

// ─── 채점 결과 타입 (API 응답) ────────────────────────────────
interface GradeDetail {
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

interface GradeResult {
  success:        boolean
  score:          number
  passed:         boolean
  passingScore:   number
  totalQuestions: number
  correctCount:   number
  totalWeight:    number
  detail:         GradeDetail[]
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
  examEndAt,
}: ExamTakeClientProps) {
  const router = useRouter()

  const [answers,          setAnswers]          = useState<Record<string, string | null>>({})
  const [timeLeft,         setTimeLeft]         = useState(initialRemainingSeconds)
  const [submitting,       setSubmitting]       = useState(false)
  const [showConfirm,      setShowConfirm]      = useState(false)
  const [page,             setPage]             = useState(0)
  /** 시험 종료 시각 초과로 강제 제출된 경우 */
  const [examTimeExpired,  setExamTimeExpired]  = useState(false)

  // ─── 채점 결과 상태 ────────────────────────────────────────
  const [gradeResult, setGradeResult] = useState<GradeResult | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const submitRef = useRef(false)

  const totalPages    = Math.ceil(questions.length / PER_PAGE)
  const pagedQs       = questions.slice(page * PER_PAGE, (page + 1) * PER_PAGE)
  const answeredCount = Object.values(answers).filter(v => v !== null && v !== '').length
  const unanswered    = questions.length - answeredCount
  const progress      = questions.length > 0 ? (answeredCount / questions.length) * 100 : 0

  // ── 서버 API 채점 제출 ──────────────────────────────────────
  const handleSubmit = useCallback(async (auto = false) => {
    if (submitRef.current) return
    submitRef.current = true
    setSubmitting(true)
    setShowConfirm(false)
    setSubmitError(null)

    try {
      const res = await fetch('/api/exam/submit', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          applicationId: application.id,
          answers,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setSubmitError(data.error ?? '제출 중 오류가 발생했습니다.')
        submitRef.current = false
        setSubmitting(false)
        return
      }

      // 채점 결과 화면으로 전환
      setGradeResult(data as GradeResult)
      setSubmitting(false)

    } catch {
      setSubmitError('네트워크 오류가 발생했습니다. 다시 시도해주세요.')
      submitRef.current = false
      setSubmitting(false)
    }
  }, [answers, application.id])

  // ── 타이머 (duration 기반) ──────────────────────────────────
  useEffect(() => {
    if (gradeResult || submitting) return
    if (timeLeft <= 0) { handleSubmit(true); return }
    const end = Date.now() + timeLeft * 1000
    const id = setInterval(() => {
      const rem = Math.max(0, Math.ceil((end - Date.now()) / 1000))
      setTimeLeft(rem)
      if (rem === 0) { clearInterval(id); handleSubmit(true) }
    }, 500)
    return () => clearInterval(id)
  }, [gradeResult, submitting]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── 시험 종료 시각(exam_end_at) 실시간 감지 ──────────────────
  // duration 타이머와 별개로, 서버의 exam_end_at 을 직접 체크하여
  // 종료 시각이 지나면 즉시 강제 제출합니다.
  useEffect(() => {
    if (gradeResult || submitting) return

    const endTs = new Date(examEndAt).getTime()

    function checkExamEnd() {
      if (Date.now() >= endTs) {
        setExamTimeExpired(true)
        handleSubmit(true)
      }
    }

    // 이미 종료된 경우 즉시 처리
    checkExamEnd()

    // 매 5초마다 체크 (타이머와 별도 주기)
    const id = setInterval(checkExamEnd, 5000)
    return () => clearInterval(id)
  }, [examEndAt, gradeResult, submitting]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── 페이지 이동 헬퍼 ────────────────────────────────────────
  const goPage = (n: number) => { setPage(n); window.scrollTo({ top: 0, behavior: 'smooth' }) }

  // ════════════════════════════════════════════════════════════
  // 채점 결과 화면
  // ════════════════════════════════════════════════════════════
  if (gradeResult) {
    return (
      <GradeResultView
        result={gradeResult}
        examTitle={application.exam?.title ?? '시험'}
        onGoResult={async () => {
          // 세션 쿠키를 강제로 갱신한 뒤 결과 페이지로 이동
          // (제출 직후 미들웨어가 세션을 인식 못하는 문제 방지)
          try {
            await fetch('/api/auth/session-refresh', { method: 'POST', credentials: 'include' })
          } catch { /* 실패해도 이동은 시도 */ }
          window.location.href = '/exam/result'
        }}
      />
    )
  }

  // ─── 타이머 색상 ──────────────────────────────────────────
  const timerCls =
    timeLeft <= DANGER_SEC ? 'text-red-600 animate-pulse font-mono font-black' :
    timeLeft <= WARN_SEC   ? 'text-orange-500 font-mono font-bold' :
                             'text-gray-900 font-mono font-bold'

  return (
    <div className="max-w-3xl mx-auto pb-20">

      {/* ═══ 시험 종료 시각 초과 경고 배너 ═══ */}
      {examTimeExpired && (
        <div className="mb-4 p-4 bg-red-600 text-white rounded-xl text-sm font-semibold flex items-center gap-2 animate-pulse">
          <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          </svg>
          시험 종료 시각이 지나 자동 제출 중입니다...
        </div>
      )}

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
                  {selectedCount}문제 / 전체 {totalQuestionCount}문항
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

      {/* ═══ 오류 배너 ═══ */}
      {submitError && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 flex items-start gap-2">
          <svg className="w-4 h-4 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span>{submitError}</span>
          <button
            onClick={() => { submitRef.current = false; setSubmitError(null) }}
            className="ml-auto text-red-400 hover:text-red-600"
          >
            ✕
          </button>
        </div>
      )}

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
                    <span className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-black shrink-0 ${
                      answered ? 'bg-indigo-600 text-white' : 'bg-white border-2 border-gray-200 text-gray-600'
                    }`}>
                      {absIdx + 1}
                    </span>
                    <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-semibold ${typeMeta.cls}`}>
                      {typeMeta.label}
                    </span>
                    <span className="text-xs text-gray-400">{q.score_weight}점</span>
                  </div>
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
                <p className="text-gray-900 font-semibold text-[15px] leading-relaxed mb-5 whitespace-pre-wrap">
                  {q.question_text}
                </p>

                {/* ── 객관식 ── */}
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
                          <span className={`shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold
                                           transition-colors ${
                            selected
                              ? 'bg-indigo-600 text-white'
                              : 'bg-white border border-gray-200 text-gray-500 group-hover:border-indigo-300'
                          }`}>
                            {oi + 1}
                          </span>
                          <span className={`flex-1 text-sm leading-relaxed ${
                            selected ? 'text-indigo-900 font-semibold' : 'text-gray-700'
                          }`}>
                            {option}
                          </span>
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

                {/* ── O / X ── */}
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
                          }`}>{v}</span>
                          <span className={`text-xs font-medium ${
                            selected
                              ? v === 'O' ? 'text-blue-500' : 'text-red-400'
                              : 'text-gray-400'
                          }`}>{v === 'O' ? '맞다' : '틀리다'}</span>
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

                {/* ── 단답형 ── */}
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
                    <p className="text-xs text-gray-400 mt-2">💡 대소문자를 구분하지 않습니다.</p>
                  </div>
                )}

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
              const pageQs   = questions.slice(i * PER_PAGE, (i + 1) * PER_PAGE)
              const allDone  = pageQs.every(q => answers[q.id] !== undefined && answers[q.id] !== null && answers[q.id] !== '')
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
                  채점 중...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
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
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-7">
            <div className="text-center mb-6">
              <div className="text-5xl mb-4">📝</div>
              <h2 className="text-xl font-bold text-gray-900">시험을 제출하시겠습니까?</h2>
              <p className="text-sm text-gray-500 mt-1">제출 후에는 수정이 불가합니다.</p>
            </div>
            {unanswered > 0 && (
              <div className="mb-4 p-3.5 bg-orange-50 border border-orange-200 rounded-xl text-center">
                <p className="text-sm text-orange-700">
                  ⚠️ <strong>{unanswered}개</strong> 문제에 답변하지 않았습니다.
                </p>
                <p className="text-xs text-orange-500 mt-0.5">미답변 문제는 오답 처리됩니다.</p>
              </div>
            )}
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
                {submitting ? '채점 중...' : '최종 제출'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ════════════════════════════════════════════════════════════════
// 채점 결과 화면 컴포넌트
// ════════════════════════════════════════════════════════════════
function GradeResultView({
  result,
  examTitle,
  onGoResult,
}: {
  result: GradeResult
  examTitle: string
  onGoResult: () => void
}) {
  const [showDetail, setShowDetail]     = useState(false)
  const [filterMode, setFilterMode]     = useState<'all' | 'wrong' | 'correct'>('all')
  const [reviewPage, setReviewPage]     = useState(0)
  const REVIEW_PER_PAGE = 5

  const filtered = result.detail.filter((d) => {
    if (filterMode === 'wrong')   return !d.isCorrect
    if (filterMode === 'correct') return d.isCorrect
    return true
  })
  const reviewTotalPages = Math.ceil(filtered.length / REVIEW_PER_PAGE)
  const pagedReview = filtered.slice(reviewPage * REVIEW_PER_PAGE, (reviewPage + 1) * REVIEW_PER_PAGE)

  const barWidth = Math.min(100, Math.max(0, result.score))
  const wrongCount = result.totalQuestions - result.correctCount

  return (
    <div className="max-w-3xl mx-auto pb-20 space-y-6">

      {/* ── 결과 헤더 카드 ── */}
      <div className={`bg-white rounded-2xl overflow-hidden shadow-sm border-2 ${
        result.passed ? 'border-green-200' : 'border-red-200'
      }`}>
        {/* 컬러 띠 */}
        <div className={`h-2 ${
          result.passed
            ? 'bg-gradient-to-r from-green-400 to-emerald-500'
            : 'bg-gradient-to-r from-red-400 to-rose-500'
        }`} />

        <div className="p-6 sm:p-8">
          {/* 헤더 */}
          <div className="flex items-start justify-between mb-6">
            <div>
              <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-1">시험 완료</p>
              <h1 className="text-xl font-bold text-gray-900">{examTitle}</h1>
            </div>
            <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold ${
              result.passed
                ? 'bg-green-100 text-green-700'
                : 'bg-red-100 text-red-600'
            }`}>
              {result.passed ? '🎉 합격' : '😔 불합격'}
            </span>
          </div>

          {/* 점수 섹션 */}
          <div className={`rounded-2xl p-6 mb-6 ${
            result.passed
              ? 'bg-gradient-to-br from-green-50 to-emerald-50 border border-green-100'
              : 'bg-gradient-to-br from-red-50 to-rose-50 border border-red-100'
          }`}>
            <div className="flex items-end justify-between mb-4">
              <div>
                <p className={`text-xs font-semibold uppercase tracking-wider mb-1 ${
                  result.passed ? 'text-green-500' : 'text-red-400'
                }`}>최종 점수</p>
                <div className="flex items-end gap-1">
                  <span className={`text-6xl font-extrabold tabular-nums leading-none ${
                    result.passed ? 'text-green-700' : 'text-red-600'
                  }`}>
                    {result.score}
                  </span>
                  <span className={`text-xl font-bold mb-1 ${
                    result.passed ? 'text-green-500' : 'text-red-400'
                  }`}>점</span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-400 mb-0.5">합격 기준</p>
                <p className="text-lg font-bold text-gray-600">
                  {result.passingScore}<span className="text-sm font-medium">점 이상</span>
                </p>
              </div>
            </div>

            {/* 점수 바 */}
            <div className="space-y-1.5">
              <div className="relative h-3 bg-white/60 rounded-full overflow-hidden">
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-gray-400/60 z-10"
                  style={{ left: `${result.passingScore}%` }}
                />
                <div
                  className={`h-full rounded-full transition-all duration-700 ${
                    result.passed ? 'bg-green-500' : 'bg-red-400'
                  }`}
                  style={{ width: `${barWidth}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-gray-400">
                <span>0점</span>
                <span className="text-gray-500">합격선 {result.passingScore}점</span>
                <span>100점</span>
              </div>
            </div>

            <p className={`mt-3 text-xs font-medium text-center ${
              result.passed ? 'text-green-600' : 'text-red-500'
            }`}>
              {result.passed
                ? `합격 기준(${result.passingScore}점)을 ${(result.score - result.passingScore).toFixed(1)}점 초과 달성했습니다.`
                : `합격 기준(${result.passingScore}점)까지 ${(result.passingScore - result.score).toFixed(1)}점 부족합니다.`}
            </p>
          </div>

          {/* 통계 그리드 */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            <StatCell
              label="총 문항"
              value={`${result.totalQuestions}문제`}
              cls="bg-gray-50"
              valCls="text-gray-800"
            />
            <StatCell
              label="정답"
              value={`${result.correctCount}개`}
              cls="bg-green-50"
              valCls="text-green-700"
            />
            <StatCell
              label="오답"
              value={`${wrongCount}개`}
              cls="bg-red-50"
              valCls="text-red-600"
            />
          </div>

          {/* 액션 버튼 */}
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => { setShowDetail(!showDetail); setReviewPage(0) }}
              className={`flex-1 py-3 text-sm font-semibold rounded-xl transition-colors border ${
                showDetail
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'bg-white text-indigo-600 border-indigo-300 hover:bg-indigo-50'
              }`}
            >
              {showDetail ? '▲ 채점 결과 닫기' : '📋 문제별 채점 결과 보기'}
            </button>
            <button
              onClick={onGoResult}
              className="flex-1 py-3 text-sm font-semibold text-white bg-indigo-600
                         hover:bg-indigo-700 rounded-xl transition-colors"
            >
              결과 페이지 이동 →
            </button>
          </div>
        </div>
      </div>

      {/* ── 문제별 채점 결과 (상세 리뷰) ── */}
      {showDetail && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          {/* 리뷰 헤더 */}
          <div className="px-5 py-4 bg-gray-50 border-b border-gray-100">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-sm font-bold text-gray-800">문제별 채점 결과</h2>
              {/* 필터 */}
              <div className="flex gap-1.5">
                {([
                  { key: 'all',     label: `전체 ${result.totalQuestions}` },
                  { key: 'correct', label: `정답 ${result.correctCount}` },
                  { key: 'wrong',   label: `오답 ${wrongCount}` },
                ] as const).map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => { setFilterMode(key); setReviewPage(0) }}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                      filterMode === key
                        ? key === 'correct'
                          ? 'bg-green-500 text-white'
                          : key === 'wrong'
                          ? 'bg-red-500 text-white'
                          : 'bg-indigo-600 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 문제 리스트 */}
          <div className="divide-y divide-gray-100">
            {pagedReview.map((d) => (
              <ReviewItem key={d.questionId} detail={d} />
            ))}
            {pagedReview.length === 0 && (
              <div className="py-10 text-center text-sm text-gray-400">
                해당하는 문제가 없습니다.
              </div>
            )}
          </div>

          {/* 리뷰 페이지네이션 */}
          {reviewTotalPages > 1 && (
            <div className="flex justify-center gap-1.5 px-5 py-4 border-t border-gray-100">
              <button
                onClick={() => setReviewPage(Math.max(0, reviewPage - 1))}
                disabled={reviewPage === 0}
                className="px-3 py-1.5 text-xs text-gray-600 bg-white border border-gray-200
                           rounded-lg disabled:opacity-40 hover:bg-gray-50"
              >
                ← 이전
              </button>
              {Array.from({ length: reviewTotalPages }, (_, i) => (
                <button
                  key={i}
                  onClick={() => setReviewPage(i)}
                  className={`w-8 h-8 text-xs font-semibold rounded-lg ${
                    i === reviewPage
                      ? 'bg-indigo-600 text-white'
                      : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
              <button
                onClick={() => setReviewPage(Math.min(reviewTotalPages - 1, reviewPage + 1))}
                disabled={reviewPage === reviewTotalPages - 1}
                className="px-3 py-1.5 text-xs text-gray-600 bg-white border border-gray-200
                           rounded-lg disabled:opacity-40 hover:bg-gray-50"
              >
                다음 →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── 통계 셀 ─────────────────────────────────────────────────
function StatCell({
  label, value, cls, valCls,
}: { label: string; value: string; cls: string; valCls: string }) {
  return (
    <div className={`${cls} rounded-xl px-4 py-3 text-center`}>
      <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider mb-1">{label}</p>
      <p className={`text-lg font-bold ${valCls}`}>{value}</p>
    </div>
  )
}

// ─── 개별 문제 리뷰 아이템 ────────────────────────────────────
function ReviewItem({ detail: d }: { detail: GradeDetail }) {
  const [open, setOpen] = useState(false)

  const TYPE_LABEL: Record<string, string> = {
    multiple_choice: '객관식',
    true_false:      'O/X',
    short_answer:    '단답형',
  }

  return (
    <div className={`px-5 py-4 ${d.isCorrect ? 'bg-white' : 'bg-red-50/40'}`}>
      {/* 문제 요약 행 */}
      <div className="flex items-start gap-3">
        {/* 정오 아이콘 */}
        <div className={`shrink-0 mt-0.5 w-7 h-7 rounded-full flex items-center justify-center text-sm font-black ${
          d.isCorrect
            ? 'bg-green-100 text-green-600'
            : 'bg-red-100 text-red-600'
        }`}>
          {d.isCorrect ? '○' : '✕'}
        </div>

        <div className="flex-1 min-w-0">
          {/* 문제 번호 + 유형 + 배점 */}
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="text-xs font-bold text-gray-500">Q{d.orderNum}</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 font-medium">
              {TYPE_LABEL[d.questionType] ?? d.questionType}
            </span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
              d.isCorrect ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-500'
            }`}>
              {d.scoreEarned} / {d.scoreWeight}점
            </span>
          </div>

          {/* 문제 텍스트 */}
          <p className="text-sm font-medium text-gray-800 leading-relaxed mb-2 line-clamp-2">
            {d.questionText}
          </p>

          {/* 내 답 vs 정답 */}
          <div className="flex items-center gap-3 text-xs flex-wrap">
            <span className={`flex items-center gap-1 ${
              d.isCorrect ? 'text-green-600' : 'text-red-500'
            }`}>
              <span className="font-semibold">내 답:</span>
              <span>{d.selectedAnswer ?? '미응답'}</span>
            </span>
            {!d.isCorrect && (
              <span className="flex items-center gap-1 text-green-600">
                <span className="font-semibold">정답:</span>
                <span>{d.correctAnswer}</span>
              </span>
            )}
          </div>

          {/* 해설 + 보기 (토글) */}
          {(d.explanation || (d.options && d.options.length > 0)) && (
            <button
              onClick={() => setOpen(!open)}
              className="mt-2 text-[11px] text-indigo-500 hover:text-indigo-700 font-medium flex items-center gap-1"
            >
              {open ? '▲ 닫기' : '▼ 해설 보기'}
            </button>
          )}

          {open && (
            <div className="mt-3 space-y-3">
              {/* 보기 목록 (객관식) */}
              {d.options && d.options.length > 0 && (
                <div className="space-y-1.5">
                  {d.options.map((opt, oi) => {
                    const isSelected = d.selectedAnswer === opt
                    const isCorrectOpt = d.correctAnswer === opt
                    return (
                      <div
                        key={oi}
                        className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs ${
                          isCorrectOpt
                            ? 'bg-green-50 border border-green-200'
                            : isSelected && !isCorrectOpt
                            ? 'bg-red-50 border border-red-200'
                            : 'bg-gray-50 border border-gray-100'
                        }`}
                      >
                        <span className={`w-5 h-5 shrink-0 rounded-md flex items-center justify-center font-bold text-[10px] ${
                          isCorrectOpt
                            ? 'bg-green-500 text-white'
                            : isSelected
                            ? 'bg-red-400 text-white'
                            : 'bg-gray-200 text-gray-500'
                        }`}>
                          {oi + 1}
                        </span>
                        <span className={`flex-1 ${
                          isCorrectOpt ? 'text-green-700 font-semibold' :
                          isSelected   ? 'text-red-600' : 'text-gray-600'
                        }`}>
                          {opt}
                        </span>
                        {isCorrectOpt && (
                          <span className="text-green-500 font-bold shrink-0">✓ 정답</span>
                        )}
                        {isSelected && !isCorrectOpt && (
                          <span className="text-red-400 font-bold shrink-0">내 답</span>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}

              {/* 해설 */}
              {d.explanation && (
                <div className="bg-amber-50 border border-amber-100 rounded-lg px-4 py-3">
                  <p className="text-[10px] font-semibold text-amber-500 uppercase tracking-wider mb-1">💡 해설</p>
                  <p className="text-xs text-amber-900 leading-relaxed whitespace-pre-wrap">
                    {d.explanation}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
