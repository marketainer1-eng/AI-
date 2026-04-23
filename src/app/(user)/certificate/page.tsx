import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import CertificateCard from '@/components/certificate/CertificateCard'
import { checkCertAccess } from '@/lib/certificate/access'
import type { CertificateData } from '@/lib/certificate/access'

export default async function CertificatePage() {
  const supabase = await createClient()

  // ── 인증 ────────────────────────────────────────────────────
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // ── 사용자 프로필 조회 ───────────────────────────────────────
  const { data: profile } = await (supabase as any)
    .from('users')
    .select('full_name, email')
    .eq('id', user.id)
    .single()

  // ── 자격증 목록 조회 (관련 정보 포함) ─────────────────────
  const { data: rows } = await (supabase as any)
    .from('certificates')
    .select(`
      *,
      application:exam_applications (
        id, status, score, certificate_issued_at
      ),
      exam:exam_applications (
        exam:exams (
          title, exam_start_at, passing_score, certificate_issued_at
        )
      )
    `)
    .eq('user_id', user.id)
    .order('issued_at', { ascending: false })

  // ── 데이터 정제 ─────────────────────────────────────────────
  const now = new Date()

  const certDataList: CertificateData[] = ((rows ?? []) as any[])
    .map((row) => {
      const examNested = row.exam?.exam ?? row.application?.exam ?? null
      return {
        cert:        row,
        user:        profile ?? { full_name: user.email ?? '알 수 없음', email: user.email ?? '' },
        application: row.application ?? {},
        exam:        examNested ?? {},
      } as CertificateData
    })
    .filter((d) => d.exam?.title) // 시험 정보가 없는 레코드 제외

  // ── 합격 상태이나 아직 자격증 레코드가 없는 신청 건 확인 ──
  //    (관리자가 발급 처리 전인 경우 — 안내 목적)
  const { data: pendingApps } = await (supabase as any)
    .from('exam_applications')
    .select(`*, exam:exams(title, exam_start_at, certificate_issued_at)`)
    .eq('user_id', user.id)
    .eq('status', 'passed')          // 합격이지만 아직 certificate_ready 아님

  return (
    <div className="space-y-6 max-w-3xl">
      {/* 헤더 */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">자격증</h1>
        <p className="text-gray-500 text-sm mt-1">
          발급된 자격증을 확인하고 PDF로 다운로드하세요.
        </p>
      </div>

      {/* 안내 배너: 발급 대기 신청 건 있을 때 */}
      {pendingApps && pendingApps.length > 0 && (
        <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-100 rounded-xl text-sm text-amber-800">
          <span className="text-lg shrink-0">⏳</span>
          <div>
            <p className="font-semibold mb-0.5">자격증 발급 대기 중</p>
            <p className="text-amber-600 text-xs">
              합격 처리된 시험이 있으나 관리자가 아직 자격증을 발급하지 않았습니다.
              발급 완료 후 이 페이지에 표시됩니다.
            </p>
          </div>
        </div>
      )}

      {/* 자격증 목록 */}
      {certDataList.length > 0 ? (
        <div className="space-y-6">
          {certDataList.map((data) => {
            const access = checkCertAccess(data, now)
            return (
              <CertificateCard
                key={data.cert.id}
                data={data}
                accessReason={access.reason}
                msUntilIssue={access.msUntilIssue}
                issuedAt={
                  access.issuedAt ? access.issuedAt.toISOString() : null
                }
              />
            )
          })}
        </div>
      ) : (
        /* 자격증 없음 */
        <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-16 text-center">
          <div className="text-6xl mb-4">🏆</div>
          <h2 className="font-bold text-gray-700 text-lg mb-2">
            발급된 자격증이 없습니다
          </h2>
          <p className="text-sm text-gray-400 mb-6 leading-relaxed">
            시험에 합격하고 자격증이 발급되면<br />이 페이지에서 확인하고 다운로드할 수 있습니다.
          </p>
          <div className="flex justify-center gap-3">
            <Link
              href="/exam/apply"
              className="px-5 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 transition-colors"
            >
              시험 신청하기
            </Link>
            <Link
              href="/dashboard"
              className="px-5 py-2.5 bg-gray-100 text-gray-600 text-sm font-medium rounded-xl hover:bg-gray-200 transition-colors"
            >
              내 현황
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
