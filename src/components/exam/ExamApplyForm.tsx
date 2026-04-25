'use client'

import { useState } from 'react'
import { applyForExamAction } from '@/app/actions/exam'

interface ExamApplyFormProps {
  examId: string
  userId: string
  examTitle: string
  examDate: string
}

interface ApplicationResult {
  id: string
  exam: {
    title: string
    exam_start_at: string
  }
}

export default function ExamApplyForm({
  examId,
  userId: _userId,
  examTitle,
  examDate,
}: ExamApplyFormProps) {
  const [step, setStep] = useState<'idle' | 'confirm' | 'loading' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [application, setApplication] = useState<ApplicationResult | null>(null)

  const handleApply = async () => {
    setStep('loading')
    setErrorMsg(null)

    try {
      const result = await applyForExamAction(examId)

      if (result?.error) {
        setErrorMsg(result.error)
        setStep('error')
        return
      }

      if (result?.success && result.application) {
        setApplication(result.application as ApplicationResult)
        setStep('success')
      }
    } catch {
      setErrorMsg('신청 중 오류가 발생했습니다. 다시 시도해주세요.')
      setStep('error')
    }
  }

  // ─── 신청 완료 모달 ───────────────────────────────────────
  if (step === 'success' && application) {
    return (
      <>
        <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium bg-green-100 text-green-700">
          ✓ 신청 완료
        </span>

        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8">
            {/* 상단 아이콘 */}
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center">
                <svg className="w-10 h-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>

            <h2 className="text-xl font-bold text-gray-900 text-center mb-1">
              시험 신청 완료!
            </h2>
            <p className="text-sm text-gray-500 text-center mb-6">
              시험 당일 응시 페이지에서 시험에 응시하세요.
            </p>

            {/* 신청 정보 카드 */}
            <div className="bg-gray-50 rounded-xl p-4 mb-6 space-y-2.5 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">시험명</span>
                <span className="font-medium text-gray-900">{application.exam?.title ?? examTitle}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">시험일</span>
                <span className="font-medium text-gray-900">
                  {application.exam?.exam_start_at
                    ? new Date(application.exam.exam_start_at).toLocaleDateString('ko-KR', {
                        year: 'numeric', month: 'long', day: 'numeric',
                      })
                    : examDate}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">신청 상태</span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-blue-100 text-blue-800">
                  ✓ 응시 가능
                </span>
              </div>
            </div>

            {/* 버튼 */}
            <div className="flex gap-3">
              <a
                href="/dashboard"
                className="flex-1 py-2.5 text-center text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                내 현황 보기
              </a>
              <button
                onClick={() => { setStep('idle'); window.location.reload() }}
                className="flex-1 py-2.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
              >
                확인
              </button>
            </div>
          </div>
        </div>
      </>
    )
  }

  // ─── 신청 확인 모달 ───────────────────────────────────────
  if (step === 'confirm') {
    return (
      <>
        <button disabled className="px-4 py-2 bg-indigo-400 text-white text-sm font-medium rounded-lg">
          신청하기
        </button>

        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-2">시험 신청 확인</h2>
            <p className="text-sm text-gray-600 mb-4">아래 시험에 신청하시겠습니까?</p>

            <div className="bg-gray-50 rounded-lg p-3 mb-5 text-sm space-y-1.5">
              <div className="flex justify-between">
                <span className="text-gray-500">시험명</span>
                <span className="font-medium">{examTitle}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">시험일</span>
                <span className="font-medium">{examDate}</span>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setStep('idle')}
                className="flex-1 py-2 text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleApply}
                className="flex-1 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
              >
                신청하기
              </button>
            </div>
          </div>
        </div>
      </>
    )
  }

  // ─── 에러 ───────────────────────────────────────────────
  if (step === 'error') {
    return (
      <div className="flex flex-col items-end gap-1">
        <p className="text-xs text-red-500">{errorMsg}</p>
        <button
          onClick={() => setStep('idle')}
          className="px-3 py-1.5 text-xs text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
        >
          다시 시도
        </button>
      </div>
    )
  }

  // ─── 로딩 ───────────────────────────────────────────────
  if (step === 'loading') {
    return (
      <button disabled className="px-4 py-2 bg-indigo-400 text-white text-sm font-medium rounded-lg flex items-center gap-2">
        <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
        </svg>
        신청 중...
      </button>
    )
  }

  // ─── 기본 (idle) ──────────────────────────────────────
  return (
    <button
      onClick={() => setStep('confirm')}
      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors"
    >
      신청하기
    </button>
  )
}
