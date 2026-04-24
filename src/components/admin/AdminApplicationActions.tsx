'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  confirmPaymentAction,
  releaseResultAction,
  issueCertificateAction,
} from '@/app/actions/exam'
import type { ApplicationWithRelations } from '@/types'

interface AdminApplicationActionsProps {
  application: ApplicationWithRelations
}

type ToastType = 'success' | 'error'

interface Toast {
  type: ToastType
  message: string
}

export default function AdminApplicationActions({ application }: AdminApplicationActionsProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [scoreInput, setScoreInput] = useState<string>('')
  const [showScoreInput, setShowScoreInput] = useState(false)
  const [showConfirmId, setShowConfirmId] = useState<string | null>(null)
  const [toast, setToast] = useState<Toast | null>(null)

  const showToast = (type: ToastType, message: string) => {
    setToast({ type, message })
    setTimeout(() => setToast(null), 3000)
  }

  // ─── 입금 확인 ──────────────────────────────────────
  const handleConfirmPayment = () => {
    startTransition(async () => {
      const result = await confirmPaymentAction(application.id)
      if (result.error) {
        showToast('error', result.error)
      } else {
        showToast('success', `✅ 입금 확인 완료 — ${(application as any).user?.full_name}`)
        setShowConfirmId(null)
        router.refresh()
      }
    })
  }

  // ─── 결과 처리 (레거시: exam_completed 상태에서 수동 채점) ─────
  const handleReleaseResult = () => {
    const score = parseFloat(scoreInput)
    if (isNaN(score) || score < 0 || score > 100) {
      showToast('error', '0 ~ 100 사이의 점수를 입력하세요.')
      return
    }
    startTransition(async () => {
      const passingScore = application.exam?.passing_score ?? 70
      const result = await releaseResultAction(application.id, score, passingScore)
      if (result.error) {
        showToast('error', result.error)
      } else {
        showToast(
          'success',
          `${result.passed ? '🎉 합격' : '❌ 불합격'} 처리 완료 — ${score}점`
        )
        setShowScoreInput(false)
        setScoreInput('')
        router.refresh()
      }
    })
  }

  // ─── 자격증 발급 ────────────────────────────────────
  const handleIssueCertificate = () => {
    startTransition(async () => {
      const result = await issueCertificateAction(
        application.id,
        application.user_id
      )
      if (result.error) {
        showToast('error', result.error)
      } else {
        showToast('success', '🏆 자격증 발급 완료!')
        router.refresh()
      }
    })
  }

  const status = application.status
  // 자동 채점으로 판정된 경우 (submit API 가 직접 passed/failed 로 설정)
  const isAutoGraded =
    (status === 'passed' || status === 'failed') &&
    application.result_notified_at != null &&
    application.exam_submitted_at != null

  return (
    <div className="flex flex-col items-end gap-2">
      {/* 토스트 알림 */}
      {toast && (
        <div
          className={`text-xs px-3 py-1.5 rounded-lg font-medium whitespace-nowrap ${
            toast.type === 'success'
              ? 'bg-green-100 text-green-700'
              : 'bg-red-100 text-red-700'
          }`}
        >
          {toast.message}
        </div>
      )}

      {/* ── 입금 대기 → 승인 ────────────────────────── */}
      {status === 'waiting_payment' && (
        <>
          {showConfirmId === application.id ? (
            <div className="flex flex-col items-end gap-2 p-3 bg-green-50 border border-green-200 rounded-xl">
              <p className="text-xs text-green-800 font-medium">
                입금 확인 처리하시겠습니까?
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowConfirmId(null)}
                  className="px-2.5 py-1 text-xs text-gray-500 bg-white border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  취소
                </button>
                <button
                  onClick={handleConfirmPayment}
                  disabled={isPending}
                  className="px-2.5 py-1 text-xs font-medium text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 rounded-lg transition-colors flex items-center gap-1"
                >
                  {isPending ? (
                    <><svg className="animate-spin w-3 h-3" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>처리 중...</>
                  ) : '✅ 확인'}
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowConfirmId(application.id)}
              disabled={isPending}
              className="px-3 py-1.5 text-xs font-medium text-green-700 bg-green-100 hover:bg-green-200 disabled:opacity-50 rounded-lg transition-colors"
            >
              입금 확인
            </button>
          )}
        </>
      )}

      {/* ── 시험 완료 (수동 채점 필요 — 레거시 케이스) ─ */}
      {status === 'exam_completed' && (
        <>
          {showScoreInput ? (
            <div className="flex flex-col items-end gap-2 p-3 bg-purple-50 border border-purple-200 rounded-xl">
              <p className="text-xs text-purple-800 font-medium">점수를 입력하세요</p>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={0}
                  max={100}
                  step={0.5}
                  value={scoreInput}
                  onChange={(e) => setScoreInput(e.target.value)}
                  placeholder="0 ~ 100"
                  className="w-24 px-2 py-1.5 text-xs border border-purple-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-300 text-center"
                  autoFocus
                />
                <span className="text-xs text-gray-400">
                  / 합격:{application.exam?.passing_score ?? 70}점
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => { setShowScoreInput(false); setScoreInput('') }}
                  className="px-2.5 py-1 text-xs text-gray-500 bg-white border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  취소
                </button>
                <button
                  onClick={handleReleaseResult}
                  disabled={isPending || !scoreInput}
                  className="px-2.5 py-1 text-xs font-medium text-white bg-purple-600 hover:bg-purple-700 disabled:opacity-50 rounded-lg transition-colors flex items-center gap-1"
                >
                  {isPending ? (
                    <><svg className="animate-spin w-3 h-3" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>처리 중...</>
                  ) : '결과 처리'}
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowScoreInput(true)}
              disabled={isPending}
              className="px-3 py-1.5 text-xs font-medium text-purple-700 bg-purple-100 hover:bg-purple-200 disabled:opacity-50 rounded-lg transition-colors"
            >
              점수 입력
            </button>
          )}
        </>
      )}

      {/* ── 자동 채점 합격 → 자격증 발급 ──────────────── */}
      {status === 'passed' && (
        <div className="flex flex-col items-end gap-1.5">
          {isAutoGraded && (
            <span className="text-[10px] text-green-600 bg-green-50 px-2 py-0.5 rounded-full font-medium">
              ⚡ 자동 채점 합격
            </span>
          )}
          <button
            onClick={handleIssueCertificate}
            disabled={isPending}
            className="px-3 py-1.5 text-xs font-medium text-indigo-700 bg-indigo-100 hover:bg-indigo-200 disabled:opacity-50 rounded-lg transition-colors flex items-center gap-1"
          >
            {isPending ? (
              <><svg className="animate-spin w-3 h-3" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>발급 중...</>
            ) : '🏆 자격증 발급'}
          </button>
        </div>
      )}

      {/* ── 자동 채점 불합격 ──────────────────────────── */}
      {status === 'failed' && (
        <div className="flex flex-col items-end gap-1">
          {isAutoGraded && (
            <span className="text-[10px] text-red-500 bg-red-50 px-2 py-0.5 rounded-full font-medium">
              ⚡ 자동 채점 불합격
            </span>
          )}
          <span className="text-xs text-gray-300">조치 없음</span>
        </div>
      )}

      {/* 최종 상태 */}
      {status === 'certificate_ready' && (
        <span className="text-xs text-emerald-500 font-medium">🏆 발급 완료</span>
      )}
    </div>
  )
}
