import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ApplicationWithExam } from '@/types'

/**
 * 현재 로그인 사용자의 최신 시험 신청 정보를 가져오는 훅
 */
export function useApplicationWithExam() {
  const [application, setApplication] = useState<ApplicationWithExam | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchApplication = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }

      const { data, error } = await supabase
        .from('exam_applications')
        .select('*, exam:exams(*)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (error) setError(error.message)
      else setApplication(data as ApplicationWithExam)
      setLoading(false)
    }

    fetchApplication()
  }, [])

  return { application, loading, error }
}
