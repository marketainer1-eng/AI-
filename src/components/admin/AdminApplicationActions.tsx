'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { confirmPayment, releaseResult, issueCertificate } from '@/lib/supabase/queries'
import type { ApplicationWithExam, ApplicationStatus } from '@/types'

interface AdminApplicationActionsProps {
  application: ApplicationWithExam
}

// 각 상태에서 이동 가능한 액션 정의
const NEXT_ACTIONS: Partial<
  Record<ApplicationStatus, { status: ApplicationStatus; label: string; color: string }[]>
> = {
  waiting_payment: [
    { status: 'approved', label: '✅ 입금 확인', color: 'bg-green-100 text-green-700 hover:bg-green-200' },
  ],
  exam_completed: [
    { status: 'passed', label: '📊 점수 입력 후 처리', color: 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' },
  ],
  passed: [
    { status: 'certificate_ready', label: '🏆 자격증 발급', color: 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200' },
  ],
}

export default function AdminApplicationActions({ application }: AdminApplicationActionsProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [scoreInput, setScoreInput] = useState<string>('')
  const [showScoreInput, setShowScoreInput] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const actions = NEXT_ACTIONS[application.status] ?? []

  const handleAction = async (nextStatus: ApplicationStatus) => {
    setError(null)
    setLoading(true)
    const supabase = createClient()

    try {
      if (nextStatus === 'approved') {
        await confirmPayment(supabase, application.id)

      } else if (nextStatus === 'passed' || nextStatus === 'failed') {
        // 점수 입력 UI에서 호출됨
        const score = parseFloat(scoreInput)
        if (isNaN(score) || score < 0 || score > 100) {
          setError('0 ~ 100 사이의 점수를 입력하세요.')
          setLoading(false)
          return
        }
        await releaseResult(supabase, application.id, score, application.exam.passing_score)
        setShowScoreInput(false)

      } else if (nextStatus === 'certificate_ready') {
        await issueCertificate(supabase, application.id, application.user_id)
      }

      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : '처리 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  if (actions.length === 0) {
    return <span className="text-xs text-gray-400">-</span>
  }

  return (
    <div className="flex flex-col items-end gap-2">
      {/* 에러 메시지 */}
      {error && <p className="text-xs text-red-500">{error}</p>}

      {/* 점수 입력 UI */}
      {showScoreInput && (
        <div className="flex items-center gap-2">
          <input
            type="number"
            min={0}
            max={100}
            step={0.01}
            value={scoreInput}
            onChange={(e) => setScoreInput(e.target.value)}
            placeholder="점수 (0~100)"
            className="w-24 px-2 py-1 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-400"
          />
          <button
            onClick={() => handleAction('passed')}
            disabled={loading}
            className="px-2 py-1 text-xs bg-purple-100 text-purple-700 hover:bg-purple-200 rounded-lg disabled:opacity-50"
          >
            {loading ? '처리 중...' : '확인'}
          </button>
          <button
            onClick={() => { setShowScoreInput(false); setError(null) }}
            className="text-xs text-gray-400 hover:text-gray-600"
          >
            취소
          </button>
        </div>
      )}

      {/* 액션 버튼들 */}
      {!showScoreInput && (
        <div className="flex gap-1 flex-wrap justify-end">
          {actions.map((action) => (
            <button
              key={action.status}
              onClick={() => {
                if (action.status === 'passed') {
                  setShowScoreInput(true)
                } else {
                  handleAction(action.status)
                }
              }}
              disabled={loading}
              className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors disabled:opacity-50 ${action.color}`}
            >
              {loading ? '처리 중...' : action.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
