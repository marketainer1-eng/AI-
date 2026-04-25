'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createExamAction, updateExamAction } from '@/app/actions/admin'
import type { ExamRow } from '@/types'

interface ExamFormModalProps {
  exam?: ExamRow | null   // null = 생성 모드
  onClose: () => void
}

/** datetime-local input에 쓸 수 있는 로컬 시간 문자열 변환 */
function toDatetimeLocal(iso: string | null | undefined): string {
  if (!iso) return ''
  // "2024-06-01T09:00:00Z" → "2024-06-01T09:00" (로컬 커팅)
  return iso.slice(0, 16)
}

export default function ExamFormModal({ exam, onClose }: ExamFormModalProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const isEdit = !!exam

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    const formData = new FormData(e.currentTarget)

    startTransition(async () => {
      const result = isEdit
        ? await updateExamAction(exam!.id, formData)
        : await createExamAction(formData)

      if (result.error) {
        setError(result.error)
        return
      }
      onClose()
      router.refresh()
    })
  }

  return (
    /* Overlay */
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">
            {isEdit ? '시험 수정' : '시험 추가'}
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">
          {/* 시험명 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              시험명 <span className="text-red-500">*</span>
            </label>
            <input
              name="title"
              required
              defaultValue={exam?.title ?? ''}
              placeholder="예) 2025년 1회 자격증 시험"
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300"
            />
          </div>

          {/* 설명 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">설명</label>
            <textarea
              name="description"
              defaultValue={exam?.description ?? ''}
              placeholder="시험에 대한 간단한 설명"
              rows={2}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none"
            />
          </div>

          {/* 접수 기간 */}
          <div>
            <p className="text-sm font-medium text-gray-700 mb-1.5">접수 기간 <span className="text-red-500">*</span></p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">시작</label>
                <input
                  type="datetime-local"
                  name="registration_start_at"
                  required
                  defaultValue={toDatetimeLocal(exam?.registration_start_at)}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">종료</label>
                <input
                  type="datetime-local"
                  name="registration_end_at"
                  required
                  defaultValue={toDatetimeLocal(exam?.registration_end_at)}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300"
                />
              </div>
            </div>
          </div>

          {/* 시험 일정 */}
          <div>
            <p className="text-sm font-medium text-gray-700 mb-1.5">시험 일정 <span className="text-red-500">*</span></p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">시작 시간</label>
                <input
                  type="datetime-local"
                  name="exam_start_at"
                  required
                  defaultValue={toDatetimeLocal(exam?.exam_start_at)}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">종료 시간</label>
                <input
                  type="datetime-local"
                  name="exam_end_at"
                  required
                  defaultValue={toDatetimeLocal(exam?.exam_end_at)}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300"
                />
              </div>
            </div>
          </div>

          {/* 시험 시간 (분) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              시험 시간 (분) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              name="duration_minutes"
              required
              min={1}
              max={600}
              defaultValue={exam?.duration_minutes ?? 60}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300"
            />
          </div>

          {/* 발표일 / 자격증 발급일 */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">발표일</label>
              <input
                type="datetime-local"
                name="result_released_at"
                defaultValue={toDatetimeLocal(exam?.result_released_at)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">자격증 발급일</label>
              <input
                type="datetime-local"
                name="certificate_issued_at"
                defaultValue={toDatetimeLocal(exam?.certificate_issued_at)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300"
              />
            </div>
          </div>

          {/* 합격 기준 점수 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              합격 기준 점수 <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="number"
                name="passing_score"
                required
                min={0}
                max={100}
                defaultValue={exam?.passing_score ?? 60}
                className="w-full px-3 py-2 pr-8 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">점</span>
            </div>
          </div>

          {/* 출제 문제 수 / 최대 신청 인원 */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                출제 문제 수
                <span className="text-xs text-gray-400 ml-1">(비워두면 25문제)</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  name="question_count"
                  min={1}
                  max={200}
                  defaultValue={(exam as any)?.question_count ?? ''}
                  placeholder="25"
                  className="w-full px-3 py-2 pr-8 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">문제</span>
              </div>
              <p className="text-xs text-gray-400 mt-1">
                랜덤으로 해당 수만큼 출제됩니다
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                최대 신청 인원 <span className="text-xs text-gray-400">(비워두면 제한 없음)</span>
              </label>
              <input
                type="number"
                name="max_applicants"
                min={1}
                defaultValue={exam?.max_applicants ?? ''}
                placeholder="제한 없음"
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300"
              />
            </div>
          </div>

          {/* 활성 여부 */}
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-gray-700">시험 공개 여부</label>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="hidden"
                name="is_active"
                value="false"
              />
              <input
                type="checkbox"
                name="is_active"
                value="true"
                defaultChecked={exam?.is_active ?? true}
                className="sr-only peer"
                onChange={(e) => {
                  // hidden input 값 동기화
                  const hidden = e.currentTarget.previousElementSibling as HTMLInputElement
                  if (hidden) hidden.disabled = e.currentTarget.checked
                }}
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
              <span className="ml-3 text-sm text-gray-600">
                {exam?.is_active ?? true ? '공개' : '비공개'}
              </span>
            </label>
          </div>

          {/* 에러 */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {error}
            </div>
          )}

          {/* 버튼 */}
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
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-lg transition-colors flex items-center gap-2"
            >
              {isPending && (
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
              )}
              {isEdit ? '저장' : '시험 추가'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
