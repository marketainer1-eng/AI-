import { createClient } from '@/lib/supabase/server'
import AdminApplicationActions from '@/components/admin/AdminApplicationActions'
import StatusBadge from '@/components/ui/StatusBadge'
import { ApplicationWithRelations, STATUS_LABEL } from '@/types'
import { formatDate, formatDateTime } from '@/lib/utils/format'

interface PageProps {
  searchParams: Promise<{ status?: string; q?: string }>
}

export default async function AdminApplicationsPage({ searchParams }: PageProps) {
  const { status, q } = await searchParams
  const supabase = await createClient()

  // 신청 목록 쿼리
  let query = (supabase as any)
    .from('exam_applications')
    .select(
      `*, user:users(id, full_name, email, phone), exam:exams(title, exam_start_at, passing_score, fee)`
    )
    .order('created_at', { ascending: false })

  if (status) {
    query = query.eq('status', status)
  }

  const { data: applications } = await query

  // 검색 필터 (클라이언트 사이드)
  const filtered = (
    ((applications ?? []) as ApplicationWithRelations[])
  ).filter((app) => {
    if (!q) return true
    const name = (app as any).user?.full_name?.toLowerCase() ?? ''
    const email = (app as any).user?.email?.toLowerCase() ?? ''
    const title = app.exam?.title?.toLowerCase() ?? ''
    const keyword = q.toLowerCase()
    return name.includes(keyword) || email.includes(keyword) || title.includes(keyword)
  })

  // 상태별 카운트
  const { data: statusCounts } = await (supabase as any)
    .from('exam_applications')
    .select('status')

  const countByStatus = (
    (statusCounts ?? []) as { status: string }[]
  ).reduce<Record<string, number>>((acc, row) => {
    acc[row.status] = (acc[row.status] ?? 0) + 1
    return acc
  }, {})

  const totalCount = statusCounts?.length ?? 0

  const tabs = [
    { value: null, label: '전체', count: totalCount },
    ...Object.entries(STATUS_LABEL).map(([key, label]) => ({
      value: key,
      label,
      count: countByStatus[key] ?? 0,
    })),
  ]

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">신청 관리</h1>
          <p className="text-gray-500 text-sm mt-1">
            시험 신청 내역을 관리하고 상태를 변경하세요.
          </p>
        </div>
        <div className="text-sm text-gray-500">
          총 <span className="font-semibold text-gray-900">{filtered.length}</span>건
        </div>
      </div>

      {/* 상태 필터 탭 */}
      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => {
          const isActive = status === tab.value || (!status && tab.value === null)
          const href = tab.value
            ? `/admin/applications?status=${tab.value}${q ? `&q=${q}` : ''}`
            : `/admin/applications${q ? `?q=${q}` : ''}`
          return (
            <a
              key={tab.value ?? 'all'}
              href={href}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${
                isActive
                  ? 'bg-cyan-600 text-white'
                  : 'bg-white border border-gray-200 text-gray-600 hover:border-cyan-300'
              }`}
            >
              {tab.label}
              <span
                className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                  isActive ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'
                }`}
              >
                {tab.count}
              </span>
            </a>
          )
        })}
      </div>

      {/* 검색 바 */}
      <form method="GET" action="/admin/applications" className="flex gap-2">
        {status && <input type="hidden" name="status" value={status} />}
        <div className="relative flex-1 max-w-sm">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
            fill="none" viewBox="0 0 24 24" stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
          </svg>
          <input
            type="text"
            name="q"
            defaultValue={q ?? ''}
            placeholder="이름, 이메일, 시험명 검색..."
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-300"
          />
        </div>
        <button
          type="submit"
          className="px-4 py-2 text-sm font-medium bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors"
        >
          검색
        </button>
        {q && (
          <a
            href={status ? `/admin/applications?status=${status}` : '/admin/applications'}
            className="px-3 py-2 text-sm text-gray-500 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            초기화
          </a>
        )}
      </form>

      {/* 신청 목록 테이블 */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-6 py-3.5 text-xs text-gray-500 font-semibold uppercase tracking-wider">
                  신청자
                </th>
                <th className="text-left px-6 py-3.5 text-xs text-gray-500 font-semibold uppercase tracking-wider">
                  시험
                </th>
                <th className="text-left px-6 py-3.5 text-xs text-gray-500 font-semibold uppercase tracking-wider">
                  시험일
                </th>
                <th className="text-left px-6 py-3.5 text-xs text-gray-500 font-semibold uppercase tracking-wider">
                  점수
                </th>
                <th className="text-left px-6 py-3.5 text-xs text-gray-500 font-semibold uppercase tracking-wider">
                  상태
                </th>
                <th className="text-left px-6 py-3.5 text-xs text-gray-500 font-semibold uppercase tracking-wider">
                  신청일
                </th>
                <th className="text-right px-6 py-3.5 text-xs text-gray-500 font-semibold uppercase tracking-wider">
                  관리
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-16 text-center">
                    <div className="text-3xl mb-2">🔍</div>
                    <p className="text-gray-400 text-sm">
                      {q ? '검색 결과가 없습니다.' : '해당 상태의 신청 내역이 없습니다.'}
                    </p>
                  </td>
                </tr>
              ) : (
                filtered.map((app) => (
                  <tr key={app.id} className="hover:bg-gray-50 transition-colors">
                    {/* 신청자 */}
                    <td className="px-6 py-4">
                      <p className="font-medium text-gray-900">
                        {(app as any).user?.full_name}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {(app as any).user?.email}
                      </p>
                      {(app as any).user?.phone && (
                        <p className="text-xs text-gray-400">
                          {(app as any).user.phone}
                        </p>
                      )}
                    </td>

                    {/* 시험 */}
                    <td className="px-6 py-4">
                      <p className="text-gray-800 font-medium">{app.exam?.title}</p>
                    </td>

                    {/* 시험일 */}
                    <td className="px-6 py-4 text-gray-600">
                      {app.exam?.exam_start_at ? formatDate(app.exam.exam_start_at) : '-'}
                    </td>

                    {/* 점수 */}
                    <td className="px-6 py-4">
                      {app.score !== null ? (
                        <span className={`font-semibold ${
                          app.status === 'passed' ? 'text-green-600' :
                          app.status === 'failed' ? 'text-red-500' : 'text-gray-700'
                        }`}>
                          {app.score}점
                        </span>
                      ) : (
                        <span className="text-gray-300">-</span>
                      )}
                    </td>

                    {/* 상태 */}
                    <td className="px-6 py-4">
                      <StatusBadge status={app.status} />
                    </td>

                    {/* 신청일 */}
                    <td className="px-6 py-4 text-gray-500 text-xs whitespace-nowrap">
                      {formatDateTime(app.created_at)}
                      {app.payment_confirmed_at && (
                        <p className="text-green-500 mt-0.5">
                          승인 {formatDateTime(app.payment_confirmed_at)}
                        </p>
                      )}
                    </td>

                    {/* 관리 버튼 */}
                    <td className="px-6 py-4 text-right">
                      <AdminApplicationActions application={app} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
