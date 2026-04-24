'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import QuestionFormModal from './QuestionFormModal'
import ExcelUploadModal from './ExcelUploadModal'
import { deleteQuestionAction } from '@/app/actions/admin'
import type { QuestionRow, ExamRow } from '@/types'

interface AdminQuestionsClientProps {
  exam: ExamRow
  questions: QuestionRow[]
}

const TYPE_LABEL: Record<string, string> = {
  multiple_choice: '객관식',
  true_false:      'O/X',
  short_answer:    '단답형',
}

const TYPE_COLOR: Record<string, string> = {
  multiple_choice: 'bg-blue-100 text-blue-700',
  true_false:      'bg-orange-100 text-orange-700',
  short_answer:    'bg-teal-100 text-teal-700',
}

export default function AdminQuestionsClient({
  exam,
  questions,
}: AdminQuestionsClientProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showExcelModal, setShowExcelModal] = useState(false)
  const [editQuestion, setEditQuestion] = useState<QuestionRow | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<QuestionRow | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  // 총 배점 계산
  const totalScore = questions
    .filter((q) => q.is_active)
    .reduce((sum, q) => sum + q.score_weight, 0)

  const handleDelete = (q: QuestionRow) => {
    setDeleteError(null)
    setDeleteTarget(q)
  }

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
      {/* 상단 네비게이션 */}
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Link href="/admin/exams" className="hover:text-indigo-600 transition-colors">
          시험 관리
        </Link>
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
        <span className="text-gray-900 font-medium truncate">{exam.title}</span>
      </div>

      {/* 헤더 */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">문제 관리</h1>
          <p className="text-gray-500 text-sm mt-1">{exam.title}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setShowExcelModal(true)}
            className="px-3 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            엑셀 업로드
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-3 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            문제 추가
          </button>
        </div>
      </div>

      {/* 시험 요약 */}
      <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
        <SummaryCell label="전체 문제" value={`${questions.length}문항`} />
        <SummaryCell
          label="활성 문제"
          value={`${questions.filter((q) => q.is_active).length}문항`}
        />
        <SummaryCell
          label="총 배점"
          value={`${totalScore}점`}
          valueClass="text-indigo-700 font-bold"
        />
        <SummaryCell
          label="합격 기준"
          value={`${exam.passing_score}점`}
          valueClass="text-green-700 font-bold"
        />
      </div>

      {/* 문제 목록 */}
      {questions.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 py-16 text-center">
          <div className="text-4xl mb-3">📝</div>
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
          {questions.map((q, idx) => (
            <div
              key={q.id}
              className={`bg-white rounded-xl border transition-colors p-5 ${
                q.is_active
                  ? 'border-gray-200 hover:border-indigo-200'
                  : 'border-dashed border-gray-200 opacity-50'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                {/* 번호 + 유형 */}
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className="shrink-0 w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-sm font-bold text-gray-600">
                    {idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          TYPE_COLOR[q.question_type] ?? 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {TYPE_LABEL[q.question_type] ?? q.question_type}
                      </span>
                      <span className="text-xs text-gray-400">{q.score_weight}점</span>
                      {!q.is_active && (
                        <span className="text-xs bg-gray-100 text-gray-400 px-2 py-0.5 rounded-full">
                          비활성
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-medium text-gray-800 whitespace-pre-wrap">
                      {q.question_text}
                    </p>

                    {/* 보기 */}
                    {q.options && q.options.length > 0 && (
                      <ul className="mt-2 space-y-1">
                        {q.options.map((opt, oi) => (
                          <li
                            key={oi}
                            className={`text-xs flex items-center gap-1.5 ${
                              opt === q.correct_answer
                                ? 'text-green-700 font-medium'
                                : 'text-gray-500'
                            }`}
                          >
                            {opt === q.correct_answer && (
                              <svg className="w-3.5 h-3.5 text-green-500 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414L8.414 15l-4.121-4.121a1 1 0 011.414-1.414L8.414 12.172l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            )}
                            {opt !== q.correct_answer && (
                              <span className="w-3.5 h-3.5 shrink-0" />
                            )}
                            {opt}
                          </li>
                        ))}
                      </ul>
                    )}

                    {/* O/X or 단답형 정답 */}
                    {q.question_type !== 'multiple_choice' && (
                      <p className="mt-2 text-xs text-green-700 font-medium">
                        ✓ 정답: {q.correct_answer}
                      </p>
                    )}

                    {/* 해설 */}
                    {q.explanation && (
                      <p className="mt-2 text-xs text-gray-400 bg-gray-50 rounded-lg px-2.5 py-1.5">
                        💡 {q.explanation}
                      </p>
                    )}
                  </div>
                </div>

                {/* 액션 */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => setEditQuestion(q)}
                    className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    수정
                  </button>
                  <button
                    onClick={() => handleDelete(q)}
                    className="px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                  >
                    삭제
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 엑셀 업로드 모달 */}
      {showExcelModal && (
        <ExcelUploadModal
          examId={exam.id}
          examTitle={exam.title}
          onClose={() => setShowExcelModal(false)}
        />
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
              <p className="text-sm text-gray-500 mt-2">
                이 문제를 삭제하시겠습니까?<br />
                <span className="text-xs text-red-400">삭제된 문제는 복구할 수 없습니다.</span>
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

function SummaryCell({
  label,
  value,
  valueClass,
}: {
  label: string
  value: string
  valueClass?: string
}) {
  return (
    <div>
      <p className="text-xs text-indigo-500 mb-0.5">{label}</p>
      <p className={`text-lg font-semibold text-gray-800 ${valueClass ?? ''}`}>{value}</p>
    </div>
  )
}
