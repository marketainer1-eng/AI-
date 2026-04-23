import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ExamTakeClient from '@/components/exam/ExamTakeClient'
import { ApplicationWithExam, QuestionRow } from '@/types'

export default async function ExamTakePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // approved 상태인 가장 최근 신청 건 조회
  const { data: application } = await supabase
    .from('exam_applications')
    .select('*, exam:exams(*)')
    .eq('user_id', user.id)
    .eq('status', 'approved')
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  // 응시 가능한 시험이 없는 경우
  if (!application) {
    return (
      <div className="max-w-2xl mx-auto text-center py-20">
        <div className="text-5xl mb-4">🔒</div>
        <h1 className="text-xl font-bold text-gray-900 mb-2">응시 가능한 시험이 없습니다</h1>
        <p className="text-gray-500 text-sm">
          입금 확인 후 응시가 가능합니다.
          <br />시험 신청 후 응시료를 입금해주세요.
        </p>
      </div>
    )
  }

  // 시험 문제 조회 (테이블명: questions)
  const { data: questions } = await supabase
    .from('questions')
    .select('*')
    .eq('exam_id', (application as ApplicationWithExam).exam_id)
    .order('order_num', { ascending: true })

  if (!questions || questions.length === 0) {
    return (
      <div className="max-w-2xl mx-auto text-center py-20">
        <div className="text-5xl mb-4">⚠️</div>
        <h1 className="text-xl font-bold text-gray-900 mb-2">시험 문제가 준비되지 않았습니다</h1>
        <p className="text-gray-500 text-sm">관리자에게 문의해주세요.</p>
      </div>
    )
  }

  return (
    <ExamTakeClient
      application={application as ApplicationWithExam}
      questions={questions as QuestionRow[]}
    />
  )
}
