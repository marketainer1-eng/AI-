import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import StatusBadge from '@/components/ui/StatusBadge'
import { ApplicationWithExam } from '@/types'
import { formatDate, formatDateTime } from '@/lib/utils/format'

export default async function ExamResultPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // 시험 완료된 신청 내역 조회
  const { data: applications } = await supabase
    .from('exam_applications')
    .select('*, exam:exams(*)')
    .eq('user_id', user.id)
    .in('status', ['exam_completed', 'passed', 'failed', 'certificate_ready'])
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">결과 조회</h1>
        <p className="text-gray-500 text-sm mt-1">응시한 시험의 결과를 확인하세요.</p>
      </div>

      {applications && applications.length > 0 ? (
        <div className="space-y-4">
          {(applications as ApplicationWithExam[]).map((app) => (
            <div key={app.id} className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="font-semibold text-gray-900">{app.exam?.title}</h2>
                  <p className="text-sm text-gray-500 mt-0.5">
                    시험일: {app.exam?.exam_start_at ? formatDate(app.exam.exam_start_at) : '-'}
                  </p>
                  {app.result_notified_at && (
                    <p className="text-xs text-gray-400 mt-0.5">
                      결과 발표: {formatDateTime(app.result_notified_at)}
                    </p>
                  )}
                </div>
                <StatusBadge status={app.status} />
              </div>

              {/* 점수 표시 */}
              {app.score !== null && app.status !== 'exam_completed' && (
                <div className={`mt-4 p-4 rounded-lg ${
                  app.status === 'passed' || app.status === 'certificate_ready'
                    ? 'bg-green-50 border border-green-200'
                    : 'bg-red-50 border border-red-200'
                }`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className={`text-sm font-medium ${
                        app.status === 'passed' || app.status === 'certificate_ready'
                          ? 'text-green-800'
                          : 'text-red-800'
                      }`}>
                        {app.status === 'passed' || app.status === 'certificate_ready'
                          ? '🎉 합격'
                          : '😔 불합격'}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        합격 기준: {app.exam?.passing_score}점 이상
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={`text-3xl font-bold ${
                        app.status === 'passed' || app.status === 'certificate_ready'
                          ? 'text-green-700'
                          : 'text-red-700'
                      }`}>
                        {app.score}<span className="text-base">점</span>
                      </p>
                    </div>
                  </div>

                  {/* 점수 바 */}
                  <div className="mt-3">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${
                          app.score >= (app.exam?.passing_score ?? 60)
                            ? 'bg-green-500'
                            : 'bg-red-400'
                        }`}
                        style={{ width: `${app.score}%` }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {app.status === 'exam_completed' && (
                <div className="mt-4 p-3 bg-yellow-50 rounded-lg text-sm text-yellow-800 border border-yellow-200">
                  ⏳ 채점 중입니다. 결과 발표 시 알림을 드립니다.
                </div>
              )}

              {/* 자격증 발급 링크 */}
              {app.status === 'certificate_ready' && (
                <div className="mt-4">
                  <Link
                    href="/certificate"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg transition-colors"
                  >
                    🏆 자격증 다운로드
                  </Link>
                </div>
              )}

              {/* 재응시 링크 */}
              {app.status === 'failed' && (
                <div className="mt-4">
                  <Link
                    href="/exam/apply"
                    className="inline-flex items-center gap-2 px-4 py-2 border border-indigo-300 text-indigo-600 hover:bg-indigo-50 text-sm font-medium rounded-lg transition-colors"
                  >
                    재응시 신청하기
                  </Link>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-dashed border-gray-300 p-12 text-center">
          <div className="text-4xl mb-3">📊</div>
          <p className="text-gray-500">아직 응시한 시험이 없습니다.</p>
          <Link href="/exam/apply" className="inline-block mt-3 text-indigo-600 hover:underline text-sm">
            시험 신청하기 →
          </Link>
        </div>
      )}
    </div>
  )
}
