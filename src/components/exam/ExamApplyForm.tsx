'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface ExamApplyFormProps {
  examId: string
  userId: string
}

export default function ExamApplyForm({ examId, userId }: ExamApplyFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleApply = async () => {
    setError(null)
    setLoading(true)

    try {
      const supabase = createClient()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from('exam_applications')
        .insert({
          user_id: userId,
          exam_id: examId,
          status: 'waiting_payment',
        })

      if (error) {
        if (error.code === '23505') {
          setError('이미 신청한 시험입니다.')
        } else {
          setError('신청에 실패했습니다. 다시 시도해주세요.')
        }
        return
      }

      router.push('/dashboard')
      router.refresh()
    } catch {
      setError('신청 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      {error && <p className="text-xs text-red-500 mb-2">{error}</p>}
      <button
        onClick={handleApply}
        disabled={loading}
        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white text-sm font-medium rounded-lg transition-colors"
      >
        {loading ? '신청 중...' : '신청하기'}
      </button>
    </div>
  )
}
