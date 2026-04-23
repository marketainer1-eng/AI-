'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { ApplicationWithExam, QuestionRow } from '@/types'

interface ExamTakeClientProps {
  application: ApplicationWithExam
  questions: QuestionRow[]
}

export default function ExamTakeClient({ application, questions }: ExamTakeClientProps) {
  const router = useRouter()
  // 시험 시간(초 단위) 초기화
  const totalSeconds = (application.exam?.duration_minutes ?? 60) * 60
  const [answers, setAnswers] = useState<Record<string, string | null>>({})
  const [timeLeft, setTimeLeft] = useState(totalSeconds)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  // ── 타이머 ────────────────────────────────────────────────
  useEffect(() => {
    const endTime = Date.now() + totalSeconds * 1000
    const timer = setInterval(() => {
      const remaining = Math.max(0, Math.ceil((endTime - Date.now()) / 1000))
      setTimeLeft(remaining)
      if (remaining === 0) {
        clearInterval(timer)
        handleSubmit()
      }
    }, 1000)
    return () => clearInterval(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── 제출 처리 ─────────────────────────────────────────────
  const handleSubmit = useCallback(async () => {
    if (submitting || submitted) return
    setSubmitting(true)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = createClient() as any

    // 1. 답안 저장 (submissions 테이블)
    const submissionRows = questions.map((q) => ({
      application_id: application.id,
      question_id: q.id,
      selected_answer: answers[q.id] ?? null,
    }))
    await supabase.from('submissions').upsert(submissionRows, {
      onConflict: 'application_id,question_id',
    })

    // 2. 채점 (correct_answer 와 selected_answer 비교)
    const correctCount = questions.filter(
      (q) => answers[q.id] !== null && String(answers[q.id]) === String(q.correct_answer)
    ).length
    const score = parseFloat(((correctCount / questions.length) * 100).toFixed(2))
    const passingScore = application.exam?.passing_score ?? 60
    const passed = score >= passingScore

    // 3. 신청 상태 업데이트
    await supabase
      .from('exam_applications')
      .update({
        status: passed ? 'passed' : 'failed',
        score,
        exam_submitted_at: new Date().toISOString(),
        result_notified_at: new Date().toISOString(),
      })
      .eq('id', application.id)

    setSubmitted(true)
    setTimeout(() => {
      router.push('/exam/result')
      router.refresh()
    }, 2000)
  }, [submitting, submitted, answers, application, questions, router])

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0')
    const s = (seconds % 60).toString().padStart(2, '0')
    return `${m}:${s}`
  }

  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto text-center py-20">
        <div className="text-5xl mb-4">✅</div>
        <h1 className="text-xl font-bold text-gray-900">시험 제출 완료!</h1>
        <p className="text-gray-500 mt-2">결과 조회 페이지로 이동합니다...</p>
      </div>
    )
  }

  const answeredCount = Object.values(answers).filter((v) => v !== null).length

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* ── 상단 정보 바 ── */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center justify-between sticky top-20 z-10 shadow-sm">
        <div>
          <h1 className="font-bold text-gray-900 text-sm">{application.exam?.title}</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            {answeredCount} / {questions.length}문제 답변
          </p>
        </div>
        <div className={`text-2xl font-mono font-bold tabular-nums ${timeLeft <= 300 ? 'text-red-600 animate-pulse' : 'text-gray-900'}`}>
          ⏱ {formatTime(timeLeft)}
        </div>
      </div>

      {/* ── 문제 목록 ── */}
      <div className="space-y-6">
        {questions.map((q, idx) => (
          <div key={q.id} className="bg-white rounded-xl border border-gray-200 p-6">
            <p className="font-medium text-gray-900 mb-4 leading-relaxed">
              <span className="text-indigo-600 font-bold mr-2">Q{idx + 1}.</span>
              {q.question_text}
            </p>
            <div className="space-y-2">
              {(q.options as string[] | null ?? ['O', 'X']).map((option, optIdx) => (
                <label
                  key={optIdx}
                  className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer border transition-colors ${
                    answers[q.id] === String(optIdx)
                      ? 'border-indigo-500 bg-indigo-50'
                      : 'border-gray-100 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="radio"
                    name={q.id}
                    value={String(optIdx)}
                    checked={answers[q.id] === String(optIdx)}
                    onChange={() =>
                      setAnswers((prev) => ({ ...prev, [q.id]: String(optIdx) }))
                    }
                    className="text-indigo-600 accent-indigo-600"
                  />
                  <span className="text-sm text-gray-800">{option}</span>
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* ── 제출 버튼 ── */}
      <div className="flex justify-end pb-8">
        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-semibold rounded-xl transition-colors shadow-md"
        >
          {submitting
            ? '제출 중...'
            : `시험 제출 (${answeredCount}/${questions.length} 답변)`}
        </button>
      </div>
    </div>
  )
}
