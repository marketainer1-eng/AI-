export const dynamic = 'force-dynamic'
export const revalidate = 0

import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export default async function AdminDashboardPage() {
  const supabase = await createClient()

  // 통계 데이터 병렬 조회
  const [
    { count: totalUsers },
    { count: totalApplications },
    { count: waitingPayment },
    { count: approved },
    { count: passed },
    { count: certificates },
  ] = await Promise.all([
    supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'user'),
    supabase.from('exam_applications').select('*', { count: 'exact', head: true }),
    supabase.from('exam_applications').select('*', { count: 'exact', head: true }).eq('status', 'waiting_payment'),
    supabase.from('exam_applications').select('*', { count: 'exact', head: true }).eq('status', 'approved'),
    supabase.from('exam_applications').select('*', { count: 'exact', head: true }).eq('status', 'passed'),
    supabase.from('certificates').select('*', { count: 'exact', head: true }),
  ])

  const stats = [
    { label: '전체 회원', value: totalUsers ?? 0, icon: '👥', color: 'bg-cyan-50 text-cyan-600', href: '/admin/users' },
    { label: '전체 신청', value: totalApplications ?? 0, icon: '📋', color: 'bg-teal-50 text-teal-600', href: '/admin/applications' },
    { label: '확인 대기', value: waitingPayment ?? 0, icon: '📋', color: 'bg-yellow-50 text-yellow-600', href: '/admin/applications?status=waiting_payment' },
    { label: '응시 가능', value: approved ?? 0, icon: '✅', color: 'bg-green-50 text-green-600', href: '/admin/applications?status=approved' },
    { label: '합격', value: passed ?? 0, icon: '🎉', color: 'bg-emerald-50 text-emerald-600', href: '/admin/applications?status=passed' },
    { label: '자격증 발급', value: certificates ?? 0, icon: '🏆', color: 'bg-cyan-50 text-cyan-600', href: '/admin/certificates' },
  ]

  // 최근 신청 5건
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: recentApps } = await (supabase as any)
    .from('exam_applications')
    .select('*, user:users(full_name, email), exam:exams(title)')
    .order('created_at', { ascending: false })
    .limit(5)

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">관리자 대시보드</h1>
        <p className="text-gray-500 text-sm mt-1">전체 현황을 확인하고 신청을 관리하세요.</p>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {stats.map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className="bg-white rounded-xl border border-gray-200 p-5 hover:border-cyan-300 hover:shadow-sm transition-all"
          >
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl mb-3 ${stat.color}`}>
              {stat.icon}
            </div>
            <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{stat.label}</p>
          </Link>
        ))}
      </div>

      {/* 빠른 작업 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          href="/admin/applications?status=waiting_payment"
          className="bg-yellow-50 border border-yellow-200 rounded-xl p-5 hover:bg-yellow-100 transition-colors"
        >
          <h3 className="font-semibold text-yellow-900">📋 신청 확인 대기</h3>
          <p className="text-sm text-yellow-700 mt-1">{waitingPayment ?? 0}건 처리 필요</p>
        </Link>
        <Link
          href="/admin/applications?status=exam_completed"
          className="bg-teal-50 border border-teal-200 rounded-xl p-5 hover:bg-teal-100 transition-colors"
        >
          <h3 className="font-semibold text-teal-900">📊 채점 대기</h3>
          <p className="text-sm text-teal-700 mt-1">시험 완료 후 결과 확인</p>
        </Link>
        <Link
          href="/admin/certificates"
          className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 hover:bg-emerald-100 transition-colors"
        >
          <h3 className="font-semibold text-emerald-900">🏆 자격증 발급</h3>
          <p className="text-sm text-emerald-700 mt-1">합격자 자격증 발급 처리</p>
        </Link>
      </div>

      {/* 최근 신청 내역 */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-900">최근 신청</h2>
          <Link href="/admin/applications" className="text-sm text-cyan-600 hover:underline">
            전체 보기 →
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-3 text-gray-500 font-medium">신청자</th>
                <th className="text-left py-3 text-gray-500 font-medium">시험명</th>
                <th className="text-left py-3 text-gray-500 font-medium">상태</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {recentApps?.map((app: any) => (
                <tr key={app.id} className="hover:bg-gray-50">
                  {/* @ts-ignore */}
                  <td className="py-3 text-gray-900">{app.user?.full_name}</td>
                  {/* @ts-ignore */}
                  <td className="py-3 text-gray-600">{app.exam?.title}</td>
                  <td className="py-3">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                      {app.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
