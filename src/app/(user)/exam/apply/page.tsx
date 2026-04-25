import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ExamApplyForm from '@/components/exam/ExamApplyForm'
import { ExamRow } from '@/types'
import { formatDate } from '@/lib/utils/format'

export default async function ExamApplyPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // 접수 기간 중인 활성 시험 목록
  const { data: exams } = await supabase
    .from('exams')
    .select('*')
    .eq('is_active', true)
    .order('exam_start_at', { ascending: true })

  // 이미 신청한 시험 ID 목록
  const { data: myApplications } = await (supabase as any)
    .from('exam_applications')
    .select('exam_id, status')
    .eq('user_id', user.id)

  const appliedMap = new Map<string, string>(
    ((myApplications ?? []) as { exam_id: string; status: string }[]).map((a) => [
      a.exam_id,
      a.status,
    ])
  )

  return (
    <div className="space-y-6 max-w-3xl">
      {/* 헤더 */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">시험 신청</h1>
        <p className="text-gray-500 text-sm mt-1">응시할 시험을 선택하고 신청하세요.</p>
      </div>

      {/* 응시 절차 안내 */}
      <div className="bg-blue-50 rounded-xl p-5 border border-blue-100">
        <h2 className="font-semibold text-blue-900 mb-3 flex items-center gap-1.5">
          <span>📋</span> 응시 절차 안내
        </h2>
        <ol className="grid grid-cols-1 sm:grid-cols-4 gap-2">
          {[
            { step: '1', label: '시험 신청', icon: '📝' },
            { step: '2', label: '관리자 확인', icon: '✅' },
            { step: '3', label: '시험 응시', icon: '📖' },
            { step: '4', label: '자격증 발급', icon: '🏆' },
          ].map((item, idx) => (
            <li key={idx} className="flex sm:flex-col items-center sm:items-center gap-2 text-sm text-blue-800">
              <span className="w-7 h-7 shrink-0 rounded-full bg-blue-200 text-blue-800 flex items-center justify-center text-xs font-bold">
                {item.step}
              </span>
              <span className="sm:text-center">
                <span className="mr-1">{item.icon}</span>{item.label}
              </span>
            </li>
          ))}
        </ol>
      </div>

      {/* 시험 목록 */}
      {exams && exams.length > 0 ? (
        <div className="space-y-4">
          {(exams as ExamRow[]).map((exam) => {
            const appliedStatus = appliedMap.get(exam.id)
            const alreadyApplied = !!appliedStatus

            return (
              <article
                key={exam.id}
                className={`bg-white rounded-xl border p-6 transition-colors ${
                  alreadyApplied
                    ? 'border-gray-200 opacity-80'
                    : 'border-gray-200 hover:border-indigo-300 hover:shadow-sm'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-gray-900 truncate">{exam.title}</h3>
                      {exam.is_active && (
                        <span className="shrink-0 px-1.5 py-0.5 text-[10px] font-medium bg-green-100 text-green-700 rounded">
                          접수중
                        </span>
                      )}
                    </div>

                    {exam.description && (
                      <p className="text-sm text-gray-500 mb-3">{exam.description}</p>
                    )}

                    {/* 시험 정보 그리드 */}
                    <div className="grid grid-cols-3 gap-3">
                      <div className="bg-gray-50 rounded-lg px-3 py-2">
                        <p className="text-[10px] text-gray-400 mb-0.5">시험일</p>
                        <p className="text-sm font-medium text-gray-700">
                          {formatDate(exam.exam_start_at)}
                        </p>
                      </div>
                      <div className="bg-gray-50 rounded-lg px-3 py-2">
                        <p className="text-[10px] text-gray-400 mb-0.5">시험 시간</p>
                        <p className="text-sm font-medium text-gray-700">
                          {exam.duration_minutes}분
                        </p>
                      </div>
                      <div className="bg-gray-50 rounded-lg px-3 py-2">
                        <p className="text-[10px] text-gray-400 mb-0.5">합격 기준</p>
                        <p className="text-sm font-medium text-gray-700">
                          {exam.passing_score}점 이상
                        </p>
                      </div>
                    </div>

                    {/* 접수 기간 */}
                    {exam.registration_start_at && exam.registration_end_at && (
                      <p className="text-xs text-gray-400 mt-2">
                        접수 기간: {formatDate(exam.registration_start_at)} ~{' '}
                        {formatDate(exam.registration_end_at)}
                      </p>
                    )}
                  </div>

                  {/* 신청 버튼 영역 */}
                  <div className="shrink-0">
                    {alreadyApplied ? (
                      <div className="flex flex-col items-center gap-1">
                        <AppliedBadge status={appliedStatus!} />
                      </div>
                    ) : (
                      <ExamApplyForm
                        examId={exam.id}
                        userId={user.id}
                        examTitle={exam.title}
                        examDate={formatDate(exam.exam_start_at)}
                      />
                    )}
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-dashed border-gray-300 p-16 text-center">
          <div className="text-5xl mb-4">📭</div>
          <h2 className="font-semibold text-gray-700 mb-1">현재 신청 가능한 시험이 없습니다</h2>
          <p className="text-sm text-gray-400">새로운 시험 일정이 등록되면 여기에 표시됩니다.</p>
        </div>
      )}
    </div>
  )
}

// ─── 이미 신청한 경우 상태 배지 ───────────────────────────
function AppliedBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    waiting_payment:   { label: '확인 대기', cls: 'bg-yellow-100 text-yellow-700' },
    approved:          { label: '응시 가능', cls: 'bg-blue-100 text-blue-700' },
    exam_completed:    { label: '채점 중',   cls: 'bg-purple-100 text-purple-700' },
    passed:            { label: '합격',      cls: 'bg-green-100 text-green-700' },
    failed:            { label: '불합격',    cls: 'bg-red-100 text-red-700' },
    certificate_ready: { label: '자격증 발급', cls: 'bg-emerald-100 text-emerald-700' },
  }
  const info = map[status] ?? { label: '신청 완료', cls: 'bg-gray-100 text-gray-600' }
  return (
    <span className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium ${info.cls}`}>
      ✓ {info.label}
    </span>
  )
}
