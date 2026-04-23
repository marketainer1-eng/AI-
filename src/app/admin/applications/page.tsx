import { createClient } from '@/lib/supabase/server'
import AdminApplicationActions from '@/components/admin/AdminApplicationActions'
import StatusBadge from '@/components/ui/StatusBadge'
import { ApplicationWithRelations, ApplicationStatus, STATUS_LABEL } from '@/types'
import { formatDate, formatDateTime } from '@/lib/utils/format'

interface PageProps {
  searchParams: Promise<{ status?: string }>
}

export default async function AdminApplicationsPage({ searchParams }: PageProps) {
  const { status } = await searchParams
  const supabase = await createClient()

  let query = supabase
    .from('exam_applications')
    .select(`
      *,
      user:users(full_name, email, phone),
      exam:exams(title, exam_start_at, passing_score, fee)
    `)
    .order('created_at', { ascending: false })

  if (status) {
    query = query.eq('status', status)
  }

  const { data: applications } = await query

  // 상태값 탭용 카운트
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: statusCounts } = await (supabase as any)
    .from('exam_applications')
    .select('status')

  const countByStatus = ((statusCounts ?? []) as { status: string }[]).reduce<Record<string, number>>((acc, row) => {
    acc[row.status] = (acc[row.status] ?? 0) + 1
    return acc
  }, {})

  const tabs: { value: string | null; label: string }[] = [
    { value: null, label: `전체 (${statusCounts?.length ?? 0})` },
    ...Object.entries(STATUS_LABEL).map(([key, label]) => ({
      value: key,
      label: `${label} (${countByStatus[key] ?? 0})`,
    })),
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">신청 관리</h1>
        <p className="text-gray-500 text-sm mt-1">시험 신청 내역을 관리하고 상태를 변경하세요.</p>
      </div>

      {/* 상태 필터 탭 */}
      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => {
          const isActive = status === tab.value || (!status && tab.value === null)
          return (
            <a
              key={tab.value ?? 'all'}
              href={tab.value ? `/admin/applications?status=${tab.value}` : '/admin/applications'}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                isActive
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white border border-gray-200 text-gray-600 hover:border-indigo-300'
              }`}
            >
              {tab.label}
            </a>
          )
        })}
      </div>

      {/* 신청 목록 */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-6 py-3 text-gray-500 font-medium">신청자</th>
                <th className="text-left px-6 py-3 text-gray-500 font-medium">시험명</th>
                <th className="text-left px-6 py-3 text-gray-500 font-medium">시험일</th>
                <th className="text-left px-6 py-3 text-gray-500 font-medium">점수</th>
                <th className="text-left px-6 py-3 text-gray-500 font-medium">상태</th>
                <th className="text-left px-6 py-3 text-gray-500 font-medium">신청일</th>
                <th className="text-right px-6 py-3 text-gray-500 font-medium">작업</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {((applications ?? []) as ApplicationWithRelations[]).map((app) => (
                <tr key={app.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <p className="font-medium text-gray-900">{(app as any).user?.full_name}</p>
                    <p className="text-xs text-gray-400">{(app as any).user?.email}</p>
                  </td>
                  <td className="px-6 py-4 text-gray-700">{app.exam?.title}</td>
                  <td className="px-6 py-4 text-gray-600">
                    {app.exam?.exam_start_at ? formatDate(app.exam.exam_start_at) : '-'}
                  </td>
                  <td className="px-6 py-4 text-gray-600">
                    {app.score !== null ? `${app.score}점` : '-'}
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge status={app.status} />
                  </td>
                  <td className="px-6 py-4 text-gray-500 text-xs">
                    {formatDateTime(app.created_at)}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <AdminApplicationActions application={app} />
                  </td>
                </tr>
              ))}
              {(!applications || applications.length === 0) && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-400">
                    해당 상태의 신청 내역이 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
