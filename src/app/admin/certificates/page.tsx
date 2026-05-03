export const dynamic = 'force-dynamic'
export const revalidate = 0

import { createClient } from '@/lib/supabase/server'
import { CertificateRow } from '@/types'
import { formatDate, formatDateTime } from '@/lib/utils/format'

export default async function AdminCertificatesPage() {
  const supabase = await createClient()

  const { data: certificates } = await supabase
    .from('certificates')
    .select(`
      *,
      user:users(full_name, email),
      application:exam_applications(
        score,
        exam:exams(title, exam_start_at)
      )
    `)
    .order('issued_at', { ascending: false })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">자격증 관리</h1>
        <p className="text-gray-500 text-sm mt-1">발급된 자격증 현황을 확인하세요.</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <p className="text-sm text-gray-500">전체 {certificates?.length ?? 0}건 발급</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-6 py-3 text-gray-500 font-medium">자격증 번호</th>
                <th className="text-left px-6 py-3 text-gray-500 font-medium">수령인</th>
                <th className="text-left px-6 py-3 text-gray-500 font-medium">시험명</th>
                <th className="text-left px-6 py-3 text-gray-500 font-medium">취득 점수</th>
                <th className="text-left px-6 py-3 text-gray-500 font-medium">발급일</th>
                <th className="text-left px-6 py-3 text-gray-500 font-medium">PDF</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {(certificates as CertificateRow[] ?? []).map((cert) => (
                <tr key={cert.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-mono text-xs text-gray-700">
                    {cert.certificate_number}
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-medium text-gray-900">{(cert as any).user?.full_name}</p>
                    <p className="text-xs text-gray-400">{(cert as any).user?.email}</p>
                  </td>
                  <td className="px-6 py-4 text-gray-600">
                    {/* @ts-ignore */}
                    {cert.application?.exam?.title ?? '-'}
                  </td>
                  <td className="px-6 py-4 text-gray-600">
                    {/* @ts-ignore */}
                    {cert.application?.score !== null ? `${cert.application?.score}점` : '-'}
                  </td>
                  <td className="px-6 py-4 text-gray-500 text-xs">
                    {formatDateTime(cert.issued_at)}
                  </td>
                  <td className="px-6 py-4">
                    {cert.pdf_url ? (
                      <a
                        href={cert.pdf_url}
                        download
                        className="text-cyan-600 hover:underline text-xs"
                      >
                        다운로드
                      </a>
                    ) : (
                      <span className="text-gray-400 text-xs">준비 중</span>
                    )}
                  </td>
                </tr>
              ))}
              {(!certificates || certificates.length === 0) && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                    발급된 자격증이 없습니다.
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
