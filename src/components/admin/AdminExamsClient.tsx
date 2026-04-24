'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import ExamFormModal from './ExamFormModal'
import { deleteExamAction } from '@/app/actions/admin'
import type { ExamRow } from '@/types'
import { formatDate, formatDateTime, formatCurrency } from '@/lib/utils/format'

interface AdminExamsClientProps {
  exams: ExamRow[]
}

export default function AdminExamsClient({ exams }: AdminExamsClientProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editExam, setEditExam] = useState<ExamRow | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<ExamRow | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const handleDelete = (exam: ExamRow) => {
    setDeleteError(null)
    setDeleteTarget(exam)
  }

  const confirmDelete = () => {
    if (!deleteTarget) return
    startTransition(async () => {
      const result = await deleteExamAction(deleteTarget.id)
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
          <h1 className="text-2xl font-bold text-gray-900">시험 관리</h1>
          <p className="text-gray-500 text-sm mt-1">시험 회차를 추가·수정·삭제하고 문제를 관리하세요.</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          시험 추가
        </button>
      </div>

      {/* 시험 목록 */}
      {exams.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 py-16 text-center">
          <div className="text-4xl mb-3">📋</div>
          <p className="text-gray-400 text-sm">등록된 시험이 없습니다.</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="mt-4 px-4 py-2 text-sm text-indigo-600 border border-indigo-200 rounded-lg hover:bg-indigo-50 transition-colors"
          >
            첫 번째 시험 추가하기
          </button>
        </div>
      ) : (
        <div className="grid gap-4">
          {exams.map((exam) => (
            <div
              key={exam.id}
              className="bg-white rounded-xl border border-gray-200 p-6 hover:border-indigo-200 transition-colors"
            >
              {/* 상단: 제목 + 뱃지 + 버튼들 */}
              <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-base font-semibold text-gray-900 truncate">{exam.title}</h3>
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        exam.is_active
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {exam.is_active ? '공개' : '비공개'}
                    </span>
                  </div>
                  {exam.description && (
                    <p className="text-sm text-gray-500 mt-1 truncate">{exam.description}</p>
                  )}
                </div>

                {/* 액션 버튼 */}
                <div className="flex items-center gap-2 shrink-0">
                  <Link
                    href={`/admin/exams/${exam.id}/questions`}
                    className="px-3 py-1.5 text-xs font-medium text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors"
                  >
                    📝 문제 관리
                  </Link>
                  <button
                    onClick={() => setEditExam(exam)}
                    className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    수정
                  </button>
                  <button
                    onClick={() => handleDelete(exam)}
                    className="px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                  >
                    삭제
                  </button>
                </div>
              </div>

              {/* 정보 그리드 */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                <InfoCell label="시험 일시" value={formatDateTime(exam.exam_start_at)} />
                <InfoCell label="시험 시간" value={`${exam.duration_minutes}분`} />
                <InfoCell
                  label="합격 기준"
                  value={`${exam.passing_score}점 이상`}
                  valueClass="text-indigo-600 font-semibold"
                />
                <InfoCell
                  label="출제 문제 수"
                  value={(exam as any).question_count ? `${(exam as any).question_count}문제` : '25문제(기본)'}
                  valueClass="text-purple-600 font-semibold"
                />
                <InfoCell label="응시료" value={formatCurrency(exam.fee)} />
                <InfoCell
                  label="발표일"
                  value={exam.result_released_at ? formatDate(exam.result_released_at) : '미설정'}
                  valueClass={!exam.result_released_at ? 'text-gray-300' : undefined}
                />
              </div>

              {/* 접수 기간 + 자격증 발급일 */}
              <div className="mt-3 pt-3 border-t border-gray-50 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-400">
                <span className="flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  접수: {formatDate(exam.registration_start_at)} ~ {formatDate(exam.registration_end_at)}
                </span>
                {exam.certificate_issued_at && (
                  <span>자격증 발급: {formatDate(exam.certificate_issued_at)}</span>
                )}
                {exam.max_applicants && (
                  <span>최대 {exam.max_applicants.toLocaleString()}명</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 시험 추가 모달 */}
      {showCreateModal && (
        <ExamFormModal
          exam={null}
          onClose={() => setShowCreateModal(false)}
        />
      )}

      {/* 시험 수정 모달 */}
      {editExam && (
        <ExamFormModal
          exam={editExam}
          onClose={() => setEditExam(null)}
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
              <h3 className="text-base font-semibold text-gray-900">시험 삭제</h3>
              <p className="text-sm text-gray-500 mt-2">
                <span className="font-medium text-gray-800">{deleteTarget.title}</span>을(를)<br />
                정말 삭제하시겠습니까?
              </p>
              <p className="text-xs text-red-500 mt-2">
                ⚠️ 관련된 신청 내역과 문제도 함께 삭제됩니다.
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

function InfoCell({
  label,
  value,
  valueClass,
}: {
  label: string
  value: string
  valueClass?: string
}) {
  return (
    <div className="bg-gray-50 rounded-lg px-3 py-2">
      <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-0.5">{label}</p>
      <p className={`text-sm font-medium text-gray-800 truncate ${valueClass ?? ''}`}>{value}</p>
    </div>
  )
}
