import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ExamApplyForm from '@/components/exam/ExamApplyForm'
import { Exam } from '@/types'
import { formatDate, formatCurrency } from '@/lib/utils/format'

export default async function ExamApplyPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // 활성화된 시험 목록 조회
  const { data: exams } = await supabase
    .from('exams')
    .select('*')
    .eq('is_active', true)
    .gte('exam_date', new Date().toISOString().split('T')[0])
    .order('exam_date', { ascending: true })

  // 이미 신청한 시험 ID 목록
  const { data: myApplications } = await supabase
    .from('exam_applications')
    .select('exam_id')
    .eq('user_id', user.id)

  const appliedExamIds = new Set(myApplications?.map((a) => a.exam_id) ?? [])

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">시험 신청</h1>
        <p className="text-gray-500 text-sm mt-1">응시할 시험을 선택하고 신청하세요.</p>
      </div>

      {/* 응시 절차 안내 */}
      <div className="bg-blue-50 rounded-xl p-5 border border-blue-100">
        <h2 className="font-semibold text-blue-900 mb-3">응시 절차 안내</h2>
        <ol className="space-y-1.5 text-sm text-blue-800">
          <li className="flex gap-2"><span className="font-bold">1.</span> 시험 신청 (아래에서 선택)</li>
          <li className="flex gap-2"><span className="font-bold">2.</span> 응시료 입금 (계좌: 국민은행 000-0000-0000-00)</li>
          <li className="flex gap-2"><span className="font-bold">3.</span> 관리자 입금 확인 → 응시 가능</li>
          <li className="flex gap-2"><span className="font-bold">4.</span> 시험 응시 및 결과 발표</li>
          <li className="flex gap-2"><span className="font-bold">5.</span> 합격 시 자격증 발급</li>
        </ol>
      </div>

      {/* 시험 목록 */}
      {exams && exams.length > 0 ? (
        <div className="space-y-4">
          {(exams as Exam[]).map((exam) => {
            const alreadyApplied = appliedExamIds.has(exam.id)
            return (
              <div
                key={exam.id}
                className={`bg-white rounded-xl border p-6 ${
                  alreadyApplied ? 'border-gray-200 opacity-70' : 'border-gray-200 hover:border-indigo-300 transition-colors'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{exam.title}</h3>
                    {exam.description && (
                      <p className="text-sm text-gray-500 mt-1">{exam.description}</p>
                    )}
                    <div className="flex flex-wrap gap-4 mt-3 text-sm text-gray-600">
                      <span>📅 시험일: {formatDate(exam.exam_date)}</span>
                      <span>⏱ 시험 시간: {exam.duration_minutes}분</span>
                      <span>✅ 합격 기준: {exam.passing_score}점 이상</span>
                      <span>💳 응시료: {formatCurrency(exam.fee)}</span>
                    </div>
                  </div>
                  <div className="ml-4">
                    {alreadyApplied ? (
                      <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-100 text-gray-500">
                        신청 완료
                      </span>
                    ) : (
                      <ExamApplyForm examId={exam.id} userId={user.id} />
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-dashed border-gray-300 p-12 text-center">
          <div className="text-4xl mb-3">📭</div>
          <p className="text-gray-500">현재 신청 가능한 시험이 없습니다.</p>
        </div>
      )}
    </div>
  )
}
