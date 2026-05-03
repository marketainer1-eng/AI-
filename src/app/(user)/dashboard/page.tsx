import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import StatusBadge from '@/components/ui/StatusBadge'
import StatusStepper from '@/components/ui/StatusStepper'
import { ApplicationWithExam } from '@/types'
import { formatDate } from '@/lib/utils/format'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // 내 시험 신청 내역 조회 (최신순)
  const { data: applications } = await supabase
    .from('exam_applications')
    .select(`
      *,
      exam:exams (*)
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const latestApp = applications?.[0] as ApplicationWithExam | undefined

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">내 현황</h1>
        <p className="text-gray-500 text-sm mt-1">시험 신청부터 자격증 발급까지 진행 현황을 확인하세요.</p>
      </div>

      {/* 최근 신청 진행 현황 */}
      {latestApp ? (
        <section className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-semibold text-gray-900">{latestApp.exam?.title}</h2>
              <p className="text-sm text-gray-500 mt-0.5">
                시험일: {latestApp.exam?.exam_start_at ? formatDate(latestApp.exam.exam_start_at) : '-'}
              </p>
            </div>
            <StatusBadge status={latestApp.status} />
          </div>

          {/* 진행 단계 시각화 */}
          <StatusStepper currentStatus={latestApp.status} />

          {/* 상태별 안내 메시지 */}
          <div className="mt-4 p-4 bg-cyan-50 rounded-lg text-sm text-cyan-800">
            {latestApp.status === 'waiting_payment' && (
              <>
                <strong>신청 확인 중</strong>
                <p className="mt-1">
                  신청이 접수되었습니다. 관리자 확인 후 응시 가능 상태로 변경됩니다.
                </p>
              </>
            )}
            {latestApp.status === 'approved' && (
              <>
                <strong>시험 신청 완료 ✓</strong>
                <p className="mt-1">
                  시험일({latestApp.exam?.exam_start_at ? formatDate(latestApp.exam.exam_start_at) : '-'})에
                  시험 응시 페이지에서 응시하세요.
                </p>
                <Link href="/exam/take" className="inline-block mt-2 text-cyan-600 font-medium hover:underline">
                  시험 응시하기 →
                </Link>
              </>
            )}
            {latestApp.status === 'exam_completed' && (
              <p><strong>채점 중입니다.</strong> 결과 발표 후 알림을 드립니다.</p>
            )}
            {latestApp.status === 'passed' && (
              <>
                <strong>합격을 축하드립니다! 🎉</strong>
                <p className="mt-1">점수: {latestApp.score}점</p>
                <p className="mt-1">자격증 발급을 준비 중입니다.</p>
              </>
            )}
            {latestApp.status === 'failed' && (
              <>
                <strong>불합격 안내</strong>
                <p className="mt-1">점수: {latestApp.score}점 (합격 기준: {latestApp.exam?.passing_score}점)</p>
                <Link href="/exam/apply" className="inline-block mt-2 text-cyan-600 font-medium hover:underline">
                  재응시 신청하기 →
                </Link>
              </>
            )}
            {latestApp.status === 'certificate_ready' && (
              <>
                <strong>자격증이 발급되었습니다! 🏆</strong>
                <Link href="/certificate" className="inline-block mt-2 text-cyan-600 font-medium hover:underline">
                  자격증 다운로드 →
                </Link>
              </>
            )}
          </div>
        </section>
      ) : (
        <section className="bg-white rounded-xl border border-dashed border-gray-300 p-12 text-center">
          <div className="text-4xl mb-3">📋</div>
          <h2 className="font-semibold text-gray-900 mb-1">신청 내역이 없습니다</h2>
          <p className="text-sm text-gray-500 mb-4">시험 신청 페이지에서 원하는 시험에 신청하세요.</p>
          <Link
            href="/exam/apply"
            className="inline-flex items-center px-4 py-2 bg-cyan-600 text-white text-sm font-medium rounded-lg hover:bg-cyan-700 transition-colors"
          >
            시험 신청하기
          </Link>
        </section>
      )}

      {/* 전체 신청 내역 */}
      {applications && applications.length > 1 && (
        <section className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-900 mb-4">전체 신청 내역</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-3 text-gray-500 font-medium">시험명</th>
                  <th className="text-left py-3 text-gray-500 font-medium">시험일</th>
                  <th className="text-left py-3 text-gray-500 font-medium">점수</th>
                  <th className="text-left py-3 text-gray-500 font-medium">상태</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {(applications as ApplicationWithExam[]).map((app) => (
                  <tr key={app.id} className="hover:bg-gray-50">
                    <td className="py-3 text-gray-900">{app.exam?.title}</td>
                    <td className="py-3 text-gray-600">
                      {app.exam?.exam_start_at ? formatDate(app.exam.exam_start_at) : '-'}
                    </td>
                    <td className="py-3 text-gray-600">
                      {app.score !== null ? `${app.score}점` : '-'}
                    </td>
                    <td className="py-3">
                      <StatusBadge status={app.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  )
}
