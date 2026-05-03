'use client'

/**
 * ResultReview — 결과 페이지용 문제별 오답 분석 섹션
 *
 * submissions 테이블에서 is_correct / score_earned 를 읽어
 * 정답 여부 + 보기 + 해설을 렌더링합니다.
 */

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

// ─── 타입 ─────────────────────────────────────────────────────
interface SubmissionDetail {
  question_id:     string
  selected_answer: string | null
  is_correct:      boolean | null
  score_earned:    number | null
  // joined question fields
  question_text:   string
  question_type:   string
  options:         string[] | null
  correct_answer:  string
  explanation:     string | null
  score_weight:    number
  order_num:       number
}

interface ResultReviewProps {
  applicationId: string
  examId:        string
  passingScore:  number
}

type FilterMode = 'all' | 'correct' | 'wrong'
const PER_PAGE = 5

// ─── 유형 뱃지 ────────────────────────────────────────────────
const TYPE_META: Record<string, { label: string; cls: string }> = {
  multiple_choice: { label: '객관식', cls: 'bg-cyan-100 text-cyan-700' },
  true_false:      { label: 'O / X',  cls: 'bg-orange-100 text-orange-700' },
  short_answer:    { label: '단답형',  cls: 'bg-teal-100 text-teal-700' },
}

export default function ResultReview({
  applicationId,
  examId,
  passingScore,
}: ResultReviewProps) {
  const [details,     setDetails]     = useState<SubmissionDetail[]>([])
  const [loading,     setLoading]     = useState(true)
  const [error,       setError]       = useState<string | null>(null)
  const [filterMode,  setFilterMode]  = useState<FilterMode>('all')
  const [page,        setPage]        = useState(0)
  const [open,        setOpen]        = useState(false)   // 섹션 전체 토글

  // ─── 데이터 로드 ─────────────────────────────────────────
  useEffect(() => {
    if (!open) return   // 펼칠 때만 로드
    ;(async () => {
      setLoading(true)
      setError(null)
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const supabase = createClient() as any

        // submissions + questions 조인 조회
        const { data, error: err } = await supabase
          .from('submissions')
          .select(`
            question_id,
            selected_answer,
            is_correct,
            score_earned,
            question:questions (
              question_text,
              question_type,
              options,
              correct_answer,
              explanation,
              score_weight,
              order_num
            )
          `)
          .eq('application_id', applicationId)
          .order('question_id')

        if (err) throw err

        // 평탄화
        const flat: SubmissionDetail[] = (data ?? [])
          .filter((r: any) => r.question)
          .map((r: any) => ({
            question_id:     r.question_id,
            selected_answer: r.selected_answer,
            is_correct:      r.is_correct,
            score_earned:    r.score_earned,
            question_text:   r.question.question_text,
            question_type:   r.question.question_type,
            options:         r.question.options,
            correct_answer:  r.question.correct_answer,
            explanation:     r.question.explanation,
            score_weight:    r.question.score_weight,
            order_num:       r.question.order_num,
          }))
          .sort((a: SubmissionDetail, b: SubmissionDetail) => a.order_num - b.order_num)

        setDetails(flat)
      } catch (e: any) {
        setError(e?.message ?? '데이터를 불러오지 못했습니다.')
      } finally {
        setLoading(false)
      }
    })()
  }, [open, applicationId])

  // ─── 필터 + 페이지 ────────────────────────────────────────
  const filtered = details.filter((d) => {
    if (filterMode === 'correct') return d.is_correct === true
    if (filterMode === 'wrong')   return d.is_correct === false || d.is_correct === null
    return true
  })
  const totalPages   = Math.ceil(filtered.length / PER_PAGE)
  const pagedItems   = filtered.slice(page * PER_PAGE, (page + 1) * PER_PAGE)
  const correctCount = details.filter(d => d.is_correct === true).length
  const wrongCount   = details.length - correctCount

  return (
    <div className="rounded-2xl border border-gray-200 overflow-hidden bg-white shadow-sm">
      {/* 헤더 토글 버튼 */}
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-5 py-4 bg-gray-50 hover:bg-gray-100 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-base">📋</span>
          <span className="text-sm font-bold text-gray-800">문제별 채점 결과 (오답 분석)</span>
          {!open && details.length === 0 && (
            <span className="text-[11px] text-gray-400">클릭하여 펼치기</span>
          )}
          {!open && details.length > 0 && (
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-cyan-100 text-cyan-600 font-medium">
              {correctCount}/{details.length} 정답
            </span>
          )}
        </div>
        <svg
          className={`w-4 h-4 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <>
          {loading ? (
            <div className="flex items-center justify-center py-12 gap-3 text-gray-400">
              <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
              <span className="text-sm">채점 결과를 불러오는 중...</span>
            </div>
          ) : error ? (
            <div className="px-5 py-6 text-center text-sm text-red-500">{error}</div>
          ) : details.length === 0 ? (
            <div className="px-5 py-8 text-center text-sm text-gray-400">
              저장된 답안 내역이 없습니다.
            </div>
          ) : (
            <>
              {/* 통계 + 필터 바 */}
              <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-3 text-xs">
                  <span className="text-gray-500 font-medium">
                    총 <strong className="text-gray-800">{details.length}</strong>문제
                  </span>
                  <span className="text-green-600 font-semibold">
                    정답 {correctCount}개
                  </span>
                  <span className="text-red-500 font-semibold">
                    오답 {wrongCount}개
                  </span>
                </div>
                {/* 필터 탭 */}
                <div className="flex gap-1">
                  {([
                    { key: 'all',     label: `전체 ${details.length}` },
                    { key: 'correct', label: `정답 ${correctCount}` },
                    { key: 'wrong',   label: `오답 ${wrongCount}` },
                  ] as const).map(({ key, label }) => (
                    <button
                      key={key}
                      onClick={() => { setFilterMode(key); setPage(0) }}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                        filterMode === key
                          ? key === 'correct'
                            ? 'bg-green-500 text-white'
                            : key === 'wrong'
                            ? 'bg-red-500 text-white'
                            : 'bg-cyan-600 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 문제 목록 */}
              <div className="divide-y divide-gray-100">
                {pagedItems.map((d) => (
                  <ReviewRow key={d.question_id} detail={d} />
                ))}
                {pagedItems.length === 0 && (
                  <div className="py-10 text-center text-sm text-gray-400">
                    해당하는 문제가 없습니다.
                  </div>
                )}
              </div>

              {/* 페이지네이션 */}
              {totalPages > 1 && (
                <div className="flex justify-center gap-1.5 px-5 py-4 border-t border-gray-100">
                  <button
                    onClick={() => setPage(Math.max(0, page - 1))}
                    disabled={page === 0}
                    className="px-3 py-1.5 text-xs text-gray-600 bg-white border border-gray-200 rounded-lg
                               disabled:opacity-40 hover:bg-gray-50 transition-colors"
                  >
                    ← 이전
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => (
                    <button
                      key={i}
                      onClick={() => setPage(i)}
                      className={`w-8 h-8 text-xs font-semibold rounded-lg transition-colors ${
                        i === page
                          ? 'bg-cyan-600 text-white'
                          : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                  <button
                    onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                    disabled={page === totalPages - 1}
                    className="px-3 py-1.5 text-xs text-gray-600 bg-white border border-gray-200 rounded-lg
                               disabled:opacity-40 hover:bg-gray-50 transition-colors"
                  >
                    다음 →
                  </button>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  )
}

// ─── 개별 문제 행 ─────────────────────────────────────────────
function ReviewRow({ detail: d }: { detail: SubmissionDetail }) {
  const [open, setOpen] = useState(false)
  const typeMeta = TYPE_META[d.question_type] ?? { label: d.question_type, cls: 'bg-gray-100 text-gray-600' }
  const isCorrect = d.is_correct === true

  return (
    <div className={`px-5 py-4 ${isCorrect ? 'bg-white' : 'bg-red-50/40'}`}>
      <div className="flex items-start gap-3">
        {/* 정오 아이콘 */}
        <div className={`shrink-0 mt-0.5 w-7 h-7 rounded-full flex items-center justify-center text-sm font-black ${
          isCorrect ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
        }`}>
          {isCorrect ? '○' : '✕'}
        </div>

        <div className="flex-1 min-w-0">
          {/* 메타 정보 행 */}
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className="text-xs font-bold text-gray-500">Q{d.order_num}</span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${typeMeta.cls}`}>
              {typeMeta.label}
            </span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
              isCorrect ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-500'
            }`}>
              {d.score_earned ?? 0} / {d.score_weight}점
            </span>
          </div>

          {/* 문제 텍스트 */}
          <p className="text-sm font-medium text-gray-800 leading-relaxed mb-2">
            {d.question_text}
          </p>

          {/* 내 답 vs 정답 */}
          <div className="flex items-center gap-4 text-xs mb-1 flex-wrap">
            <span className={`flex items-center gap-1 ${isCorrect ? 'text-green-600' : 'text-red-500'}`}>
              <span className="font-semibold">내 답:</span>
              <span>{d.selected_answer ?? '미응답'}</span>
            </span>
            {!isCorrect && (
              <span className="flex items-center gap-1 text-green-600">
                <span className="font-semibold">정답:</span>
                <span className="font-bold">{d.correct_answer}</span>
              </span>
            )}
          </div>

          {/* 해설/보기 토글 */}
          {(d.explanation || (d.options && d.options.length > 0)) && (
            <button
              onClick={() => setOpen(v => !v)}
              className="mt-1.5 text-[11px] text-cyan-500 hover:text-cyan-700 font-medium flex items-center gap-1"
            >
              {open ? '▲ 닫기' : '▼ 해설 · 보기 보기'}
            </button>
          )}

          {open && (
            <div className="mt-3 space-y-3">
              {/* 객관식 보기 목록 */}
              {d.options && d.options.length > 0 && (
                <div className="space-y-1.5">
                  {d.options.map((opt, oi) => {
                    const isSelected   = d.selected_answer === opt
                    const isCorrectOpt = d.correct_answer === opt
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
                  <p className="text-[10px] font-semibold text-amber-500 uppercase tracking-wider mb-1">
                    💡 해설
                  </p>
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
