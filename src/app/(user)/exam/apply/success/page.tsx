import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ApplicationWithExam } from '@/types'
import { formatDate } from '@/lib/utils/format'

export default async function ExamApplySuccessPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // 가장 최근 신청 내역 조회
  const { data: application } = await (supabase as any)
    .from('exam_applications')
    .select(`*, exam:exams(*)`)
    .eq('user_id', user.id)
    .eq('status', 'waiting_payment')
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (!application) redirect('/dashboard')

  const app = application as ApplicationWithExam

  return (
    <div className="max-w-lg mx-auto py-8">
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {/* 상단 그린 배너 */}
        <div className="bg-gradient-to-r from-green-500 to-emerald-500 px-8 py-10 text-white text-center">
          <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold mb-1">시험 신청 완료!</h1>
          <p className="text-green-100 text-sm">
            관리자 확인 후 응시가 가능합니다.
          </p>
        </div>

        {/* 신청 정보 */}
        <div className="px-8 py-6">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
            신청 정보
          </h2>
          <dl className="space-y-3">
            <div className="flex justify-between text-sm">
              <dt className="text-gray-500">시험명</dt>
              <dd className="font-semibold text-gray-900">{app.exam?.title}</dd>
            </div>
            <div className="flex justify-between text-sm">
              <dt className="text-gray-500">시험일</dt>
              <dd className="text-gray-800">
                {app.exam?.exam_start_at ? formatDate(app.exam.exam_start_at) : '-'}
              </dd>
            </div>
            <div className="flex justify-between text-sm">
              <dt className="text-gray-500">시험 시간</dt>
              <dd className="text-gray-800">{app.exam?.duration_minutes}분</dd>
            </div>
            <div className="flex justify-between text-sm">
              <dt className="text-gray-500">합격 기준</dt>
              <dd className="text-gray-800">{app.exam?.passing_score}점 이상</dd>
            </div>
            <div className="flex justify-between text-sm">
              <dt className="text-gray-500">현재 상태</dt>
              <dd>
                <span className="px-2 py-0.5 rounded-md text-xs font-medium bg-yellow-100 text-yellow-800">
                  확인 대기
                </span>
              </dd>
            </div>
          </dl>
        </div>

        {/* 안내 메시지 */}
        <div className="mx-8 mb-6 bg-cyan-50 border border-cyan-100 rounded-xl p-5">
          <h3 className="font-semibold text-cyan-900 mb-2">📌 안내</h3>
          <p className="text-sm text-cyan-800">
            관리자 확인 후 응시 가능 상태로 변경됩니다. 시험 일정을 확인하고 준비하세요.
          </p>
        </div>

        {/* 진행 단계 */}
        <div className="px-8 pb-6">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
            진행 단계
          </h3>
          <div className="flex items-center">
            {[
              { label: '신청', active: true, done: true },
              { label: '확인', active: true, done: false },
              { label: '응시', active: false, done: false },
              { label: '발급', active: false, done: false },
            ].map((step, idx, arr) => (
              <div key={idx} className="flex items-center flex-1 last:flex-none">
                <div className="flex flex-col items-center">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                    step.done
                      ? 'bg-green-500 text-white'
                      : step.active
                      ? 'bg-yellow-400 text-white'
                      : 'bg-gray-100 text-gray-400'
                  }`}>
                    {step.done ? '✓' : idx + 1}
                  </div>
                  <span className={`text-[10px] mt-1 ${
                    step.active ? 'text-gray-700 font-medium' : 'text-gray-400'
                  }`}>
                    {step.label}
                  </span>
                </div>
                {idx < arr.length - 1 && (
                  <div className={`flex-1 h-0.5 mb-4 ${
                    step.done ? 'bg-green-200' : 'bg-gray-100'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* 버튼 */}
        <div className="px-8 pb-8 flex gap-3">
          <Link
            href="/exam/apply"
            className="flex-1 py-2.5 text-center text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            시험 목록
          </Link>
          <Link
            href="/dashboard"
            className="flex-1 py-2.5 text-center text-sm font-medium text-white bg-cyan-600 hover:bg-cyan-700 rounded-lg transition-colors"
          >
            내 현황 보기
          </Link>
        </div>
      </div>
    </div>
  )
}
