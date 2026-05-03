'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createQuestionAction, updateQuestionAction } from '@/app/actions/admin'
import type { QuestionRow, QuestionType } from '@/types'

interface QuestionFormModalProps {
  examId: string
  question?: QuestionRow | null
  onClose: () => void
}

const QUESTION_TYPES: { value: QuestionType; label: string; desc: string }[] = [
  { value: 'multiple_choice', label: '객관식', desc: '보기 중 하나 선택' },
  { value: 'true_false',      label: 'O/X',  desc: '맞으면 O, 틀리면 X' },
  { value: 'short_answer',    label: '단답형', desc: '직접 입력' },
]

export default function QuestionFormModal({
  examId,
  question,
  onClose,
}: QuestionFormModalProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [qType, setQType] = useState<QuestionType>(
    question?.question_type ?? 'multiple_choice'
  )

  const isEdit = !!question

  // 보기 목록 → textarea 형식으로 변환
  const defaultOptions = question?.options?.join('\n') ?? ''

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    const formData = new FormData(e.currentTarget)
    // 현재 선택된 question_type 강제 주입
    formData.set('question_type', qType)

    startTransition(async () => {
      const result = isEdit
        ? await updateQuestionAction(examId, question!.id, formData)
        : await createQuestionAction(examId, formData)

      if (result.error) {
        setError(result.error)
        return
      }
      onClose()
      router.refresh()
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">
            {isEdit ? '문제 수정' : '문제 추가'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">
          {/* 문제 유형 */}
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">
              문제 유형 <span className="text-red-500">*</span>
            </p>
            <div className="grid grid-cols-3 gap-2">
              {QUESTION_TYPES.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setQType(t.value)}
                  className={`p-2.5 rounded-lg border text-left transition-all ${
                    qType === t.value
                      ? 'border-cyan-500 bg-cyan-50 ring-1 ring-cyan-400'
                      : 'border-gray-200 hover:border-cyan-300'
                  }`}
                >
                  <p className="text-xs font-semibold text-gray-800">{t.label}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">{t.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* 문제 텍스트 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              문제 <span className="text-red-500">*</span>
            </label>
            <textarea
              name="question_text"
              required
              defaultValue={question?.question_text ?? ''}
              placeholder="문제를 입력하세요"
              rows={3}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-300 resize-none"
            />
          </div>

          {/* 보기 (객관식일 때만) */}
          {qType === 'multiple_choice' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                보기 <span className="text-red-500">*</span>
                <span className="text-xs text-gray-400 ml-1">(한 줄에 하나씩)</span>
              </label>
              <textarea
                name="options"
                defaultValue={defaultOptions}
                placeholder={`① 보기 1\n② 보기 2\n③ 보기 3\n④ 보기 4`}
                rows={4}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-300 resize-none font-mono"
              />
              <p className="text-xs text-gray-400 mt-1">
                정답은 아래 보기 번호 또는 텍스트를 입력하세요.
              </p>
            </div>
          )}

          {/* O/X 보기 안내 */}
          {qType === 'true_false' && (
            <div className="p-3 bg-cyan-50 rounded-lg">
              <p className="text-xs text-cyan-700">
                O/X 문제는 정답을 <strong>O</strong> 또는 <strong>X</strong>로 입력하세요.
              </p>
            </div>
          )}

          {/* 정답 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              정답 <span className="text-red-500">*</span>
            </label>
            {qType === 'true_false' ? (
              <div className="flex gap-3">
                {['O', 'X'].map((v) => (
                  <label key={v} className="flex-1">
                    <input
                      type="radio"
                      name="correct_answer"
                      value={v}
                      defaultChecked={question?.correct_answer === v || (!question && v === 'O')}
                      required
                      className="sr-only peer"
                    />
                    <div className="w-full py-2.5 rounded-lg border border-gray-200 text-center text-lg font-bold cursor-pointer peer-checked:border-cyan-500 peer-checked:bg-cyan-50 peer-checked:text-cyan-700 hover:border-cyan-300 transition-all">
                      {v}
                    </div>
                  </label>
                ))}
              </div>
            ) : (
              <input
                name="correct_answer"
                required
                defaultValue={question?.correct_answer ?? ''}
                placeholder={
                  qType === 'multiple_choice'
                    ? '보기 텍스트 또는 번호 입력'
                    : '정답을 입력하세요'
                }
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-300"
              />
            )}
          </div>

          {/* 배점 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">배점</label>
            <div className="relative w-32">
              <input
                type="number"
                name="score_weight"
                min={1}
                max={100}
                defaultValue={question?.score_weight ?? 1}
                className="w-full px-3 py-2 pr-8 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-300"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">점</span>
            </div>
          </div>

          {/* 해설 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              해설 <span className="text-xs text-gray-400">(선택)</span>
            </label>
            <textarea
              name="explanation"
              defaultValue={question?.explanation ?? ''}
              placeholder="정답에 대한 해설을 입력하세요"
              rows={2}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-300 resize-none"
            />
          </div>

          {/* 활성 여부 (수정 모드) */}
          {isEdit && (
            <div className="flex items-center gap-3">
              <label className="text-sm font-medium text-gray-700">문제 활성화</label>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  name="is_active"
                  value="true"
                  defaultChecked={question?.is_active ?? true}
                  className="sr-only peer"
                />
                <div className="w-10 h-5 bg-gray-200 rounded-full peer peer-checked:bg-cyan-600 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-5" />
              </label>
            </div>
          )}
          {!isEdit && (
            <input type="hidden" name="is_active" value="true" />
          )}

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="px-4 py-2 text-sm font-medium text-white bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50 rounded-lg transition-colors flex items-center gap-2"
            >
              {isPending && (
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
              )}
              {isEdit ? '저장' : '문제 추가'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
