'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ExamApplication, ExamStatus } from '@/types'

interface AdminApplicationActionsProps {
  application: ExamApplication
}

// 각 상태에서 이동할 수 있는 다음 상태들
const NEXT_ACTIONS: Record<ExamStatus, { status: ExamStatus; label: string; color: string }[]> = {
  waiting_payment: [
    { status: 'approved', label: '✅ 입금 확인', color: 'bg-green-100 text-green-700 hover:bg-green-200' },
  ],
  approved: [],
  exam_completed: [
    { status: 'passed', label: '🎉 합격 처리', color: 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' },
    { status: 'failed', label: '❌ 불합격 처리', color: 'bg-red-100 text-red-700 hover:bg-red-200' },
  ],
  passed: [
    { status: 'certificate_ready', label: '🏆 자격증 발급', color: 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200' },
  ],
  failed: [],
  certificate_ready: [],
}

export default function AdminApplicationActions({ application }: AdminApplicationActionsProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [scoreInput, setScoreInput] = useState<string>('')
  const [showScoreInput, setShowScoreInput] = useState(false)

  const actions = NEXT_ACTIONS[application.status] ?? []

  const handleStatusChange = async (nextStatus: ExamStatus, score?: number) => {
    setLoading(true)
    const supabase = createClient()

    const updateData: Partial<ExamApplication> & Record<string, unknown> = {
      status: nextStatus,
      updated_at: new Date().toISOString(),
    }

    if (nextStatus === 'approved') {
      updateData.payment_confirmed_at = new Date().toISOString()
    }
    if (nextStatus === 'passed' || nextStatus === 'failed') {
      updateData.result_released_at = new Date().toISOString()
      if (score !== undefined) updateData.score = score
    }
    if (nextStatus === 'certificate_ready') {
      updateData.certificate_issued_at = new Date().toISOString()
      // 자격증 레코드 생성
      const certNumber = `CERT-${new Date().getFullYear()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`
      await supabase.from('certificates').insert({
        application_id: application.id,
        user_id: application.user_id,
        certificate_number: certNumber,
      })
    }

    await supabase
      .from('exam_applications')
      .update(updateData)
      .eq('id', application.id)

    setLoading(false)
    setShowScoreInput(false)
    router.refresh()
  }

  if (actions.length === 0) {
    return <span className="text-xs text-gray-400">-</span>
  }

  return (
    <div className="flex flex-col items-end gap-2">
      {showScoreInput && (
        <div className="flex items-center gap-2">
          <input
            type="number"
            min={0}
            max={100}
            value={scoreInput}
            onChange={(e) => setScoreInput(e.target.value)}
            placeholder="점수 (0-100)"
            className="w-24 px-2 py-1 text-xs border border-gray-300 rounded-lg"
          />
          <button
            onClick={() => {
              const s = parseInt(scoreInput)
              if (isNaN(s) || s < 0 || s > 100) return
              const passed = s >= (application.exam?.passing_score ?? 60)
              handleStatusChange(passed ? 'passed' : 'failed', s)
            }}
            disabled={loading}
            className="px-2 py-1 text-xs bg-purple-100 text-purple-700 hover:bg-purple-200 rounded-lg disabled:opacity-50"
          >
            확인
          </button>
          <button
            onClick={() => setShowScoreInput(false)}
            className="text-xs text-gray-400 hover:text-gray-600"
          >
            취소
          </button>
        </div>
      )}

      <div className="flex gap-1 flex-wrap justify-end">
        {actions.map((action) => {
          // 채점 처리는 점수 입력 UI 표시
          if (action.status === 'passed') {
            return (
              <button
                key={action.status}
                onClick={() => setShowScoreInput(true)}
                disabled={loading}
                className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors disabled:opacity-50 ${action.color}`}
              >
                📊 점수 입력
              </button>
            )
          }
          return (
            <button
              key={action.status}
              onClick={() => handleStatusChange(action.status)}
              disabled={loading}
              className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors disabled:opacity-50 ${action.color}`}
            >
              {loading ? '처리 중...' : action.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
