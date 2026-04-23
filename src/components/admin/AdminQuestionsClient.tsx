'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import QuestionFormModal from './QuestionFormModal'
import { deleteQuestionAction } from '@/app/actions/admin'
import type { QuestionRow, ExamRow } from '@/types'

interface AdminQuestionsClientProps {
  exam: ExamRow
  questions: QuestionRow[]
}

const Q_TYPE_LABEL: Record<QuestionRow['question_type'], string> = {
  multiple_choice: '객관식',
  true_false: 'O/X',
  short_answer: '단답형',
}

const Q_TYPE_COLOR: Record<QuestionRow['question_type'], string> = {
  multiple_choice: 'bg-indigo-50 text-indigo-700',
  true_false: 'bg-blue-50 text-blue-700',
  short_answer: 'bg-amber-50 text-amber-700',
}

export default function AdminQuestionsClient({
  exam,
  questions,
}: AdminQuestionsClientProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editQuestion, setEditQuestion] = useState<QuestionRow | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<QuestionRow | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const totalScore = questions.reduce((s, q) => s + (q.score_weight ?? 1), 0)

  const confirmDelete = () => {
    if (!deleteTarget) return
    startTransition(async () => {
      const result = await deleteQuestionAction(exam.id, deleteTarget.id)
      if (result.error) {
        setDeleteError(result.error)
        return
      }
      setDeleteTarget(null)
      router.refresh()
    })
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <a
              href="/admin/exams"
              className="text-sm text-gray-400 hover:text-indigo-600 transition-colors"
            >
              ← 시험 목록
            </a>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">문제 관리</h1>
          <p className="text-gray-500 text-sm mt-0.5 truncate max-w-md">{exam.title}</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          문제 추가
        </button>
      </div>

      {/* 요약 카드 */}
      <div className="grid grid-cols-3 gap-4">
        <SummaryCard
          label="총 문제 수"
          value={`${questions.length}문제`}
          icon="📝"
          color="bg-indigo-50"
        />
        <SummaryCard
          label="총 배점"
          value={`${totalScore}점`}
          icon="🎯"
          color="bg-green-50"
        />
        <SummaryCard
          label="합격 기준"
          value={`${exam.passing_score}점 이상`}
          icon="✅"
          color="bg-amber-50"
        />
      </div>

      {/* 문제 목록 */}
      {questions.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 py-16 text-center">
          <div className="text-4xl mb-3">❓</div>
          <p className="text-gray-400 text-sm">등록된 문제가 없습니다.</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="mt-4 px-4 py-2 text-sm text-indigo-600 border border-indigo-200 rounded-lg hover:bg-indigo-50 transition-colors"
          >
            첫 번째 문제 추가하기
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {questions.map((q, idx) => {
            const isExpanded = expandedId === q.id
            return (
              <div
                key={q.id}
                className={`bg-white rounded-xl border transition-all ${
                  isExpanded ? 'border-indigo-300 shadow-sm' : 'border-gray-200'
                } ${!q.is_active ? 'opacity-60' : ''}`}
              >
                {/* 문제 헤더 (클릭 시 토글) */}
                <div
                  className="flex items-start gap-4 px-5 py-4 cursor-pointer"
                  onClick={() => setExpandedId(isExpanded ? null : q.id)}
                >
                  {/* 번호 */}
                  <div className="shrink-0 w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold flex items-center justify-center">
                    {idx + 1}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold ${Q_TYPE_COLOR[q.question_type]}`}>
                        {Q_TYPE_LABEL[q.question_type]}
                      </span>
                      <span className="text-[10px] text-gray-400">{q.score_weight}점</span>
                      {!q.is_active && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] bg-gray-100 text-gray-400">
                          비활성
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-800 font-medium leading-snug">
                      {q.question_text}
                    </p>
                  </div>

                  <div className="flex items-center gap-1 shrink-0 ml-2">
                    <button
                      onClick={(e) => { e.stopPropagation(); setEditQuestion(q) }}
                      className="px-2.5 py-1 text-xs text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      수정
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); setDeleteTarget(q); setDeleteError(null) }}
                      className="px-2.5 py-1 text-xs text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      삭제
                    </button>
                    <svg
                      className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                      fill="none" viewBox="0 0 24 24" stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>

                {/* 펼침 영역 */}
                {isExpanded && (
                  <div className="px-5 pb-5 space-y-3 border-t border-gray-50 pt-4">
                    {/* 보기 */}
                    {q.options && q.options.length > 0 && (
                      <div>
                        <p className="text-xs font-medium text-gray-500 mb-2">보기</p>
                        <ol className="space-y-1">
                          {q.options.map((opt, i) => (
                            <li
                              key={i}
                              className={`flex items-start gap-2 text-sm px-3 py-1.5 rounded-lg ${
                                opt === q.correct_answer
                                  ? 'bg-green-50 text-green-800 font-medium'
                                  : 'text-gray-600'
                              }`}
                            >
                              <span className="shrink-0 text-xs text-gray-400 mt-0.5">{i + 1}.</span>
                              <span>{opt}</span>
                              {opt === q.correct_answer && (
                                <span className="ml-auto text-xs text-green-600">✓ 정답</span>
                              )}
                            </li>
                          ))}
                        </ol>
                      </div>
                    )}

                    {/* 정답 (객관식이 아닐 때) */}
                    {!q.options?.length && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">정답:</span>
                        <span className="px-2 py-0.5 bg-green-100 text-green-700 text-sm font-semibold rounded">
                          {q.correct_answer}
                        </span>
                      </div>
                    )}

                    {/* 해설 */}
                    {q.explanation && (
                      <div className="p-3 bg-amber-50 rounded-lg">
                        <p className="text-xs font-medium text-amber-700 mb-1">해설</p>
                        <p className="text-sm text-amber-800">{q.explanation}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* 문제 추가 모달 */}
      {showCreateModal && (
        <QuestionFormModal
          examId={exam.id}
          question={null}
          onClose={() => setShowCreateModal(false)}
        />
      )}

      {/* 문제 수정 모달 */}
      {editQuestion && (
        <QuestionFormModal
          examId={exam.id}
          question={editQuestion}
          onClose={() => setEditQuestion(null)}
        />
      )}

      {/* 삭제 확인 모달 */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <div className="text-center mb-5">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-base font-semibold text-gray-900">문제 삭제</h3>
              <p className="text-sm text-gray-500 mt-2 line-clamp-2">
                {deleteTarget.question_text}
              </p>
            </div>

            {deleteError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                {deleteError}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => { setDeleteTarget(null); setDeleteError(null) }}
                className="flex-1 py-2 text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                취소
              </button>
              <button
                onClick={confirmDelete}
                disabled={isPending}
                className="flex-1 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                {isPending && (
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                )}
                삭제
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function SummaryCard({
  label,
  value,
  icon,
  color,
}: {
  label: string
  value: string
  icon: string
  color: string
}) {
  return (
    <div className={`rounded-xl p-4 ${color} border border-white`}>
      <div className="text-2xl mb-1">{icon}</div>
      <p className="text-lg font-bold text-gray-900">{value}</p>
      <p className="text-xs text-gray-500">{label}</p>
    </div>
  )
}
