import { redirect }  from 'next/navigation'
import Link          from 'next/link'
import { createClient } from '@/lib/supabase/server'
import ResultPending    from '@/components/result/ResultPending'
import ResultCard       from '@/components/result/ResultCard'
import { checkResultVisibility } from '@/lib/exam/access'
import type { ApplicationWithExam } from '@/types'
import { formatDateTime } from '@/lib/utils/format'

export const dynamic = 'force-dynamic'

export default async function ExamResultPage() {
  const supabase = await createClient()

  // ── 인증 ───────────────────────────────────────────────────────
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // ── 시험 응시 이후 상태의 신청 내역 전체 조회 ──────────────────
  const { data: applications } = await (supabase as any)
    .from('exam_applications')
    .select(`
      *,
      exam:exams (
        id, title, description,
        exam_start_at, exam_end_at,
        result_released_at,
        certificate_issued_at,
        passing_score, duration_minutes, fee
      )
    `)
    .eq('user_id', user.id)
    .in('status', ['exam_completed', 'passed', 'failed', 'certificate_ready'])
    .order('created_at', { ascending: false })

  const now  = new Date()
  const list = (applications ?? []) as ApplicationWithExam[]

  // ── 각 신청 건에 결과 공개 여부 판정 ─────────────────────────
  const enriched = list.map((app) => ({
    app,
    visibility: checkResultVisibility(app, now),
  }))

  // 즉시 공개 vs 대기 건수 집계
  const releasedCount = enriched.filter(e => e.visibility.visibility === 'released').length
  const pendingCount  = enriched.filter(e => e.visibility.visibility === 'pending_release').length

  return (
    <div className="space-y-6 max-w-3xl">

      {/* ── 페이지 헤더 ─────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">시험 결과 조회</h1>
          <p className="text-gray-500 text-sm mt-1">
            응시한 시험의 합격·불합격 판정 결과를 확인하세요.
          </p>
        </div>
        {enriched.length > 0 && (
          <div className="flex gap-2 text-xs shrink-0">
            {releasedCount > 0 && (
              <span className="px-2.5 py-1 rounded-full bg-green-100 text-green-700 font-semibold">
                공개 {releasedCount}건
              </span>
            )}
            {pendingCount > 0 && (
              <span className="px-2.5 py-1 rounded-full bg-cyan-100 text-cyan-700 font-semibold">
                대기 {pendingCount}건
              </span>
            )}
          </div>
        )}
      </div>

      {/* ── 즉시 결과 안내 배너 ─────────────────────────────────── */}
      {releasedCount > 0 && (
        <div className="flex items-start gap-3 p-4 bg-emerald-50 border border-emerald-100 rounded-xl text-sm text-emerald-800">
          <span className="text-lg shrink-0">✅</span>
          <p>
            시험 제출 즉시 <strong>자동 채점</strong>이 완료되어 합격·불합격이 판정되었습니다.
            아래에서 결과를 확인하세요.
          </p>
        </div>
      )}

      {/* ── 발표일 기준 대기 배너 ───────────────────────────────── */}
      {pendingCount > 0 && (
        <div className="flex items-start gap-3 p-4 bg-cyan-50 border border-cyan-100 rounded-xl text-sm text-cyan-800">
          <span className="text-lg shrink-0">ℹ️</span>
          <p>
            일부 결과는 <strong>발표일</strong> 이후에만 공개됩니다.
            발표 시각이 되면 이 페이지가 자동으로 새로고침됩니다.
          </p>
        </div>
      )}

      {/* ── 신청 내역 목록 ──────────────────────────────────────── */}
      {enriched.length > 0 ? (
        <div className="space-y-5">
          {enriched.map(({ app, visibility }) => {

            // ── 발표 대기 중 ────────────────────────────────────
            if (visibility.visibility === 'pending_release') {
              return (
                <ResultPending
                  key={app.id}
                  application={app}
                  releasedAt={
                    visibility.releasedAt
                      ? visibility.releasedAt.toISOString()
                      : null
                  }
                  msUntilRelease={visibility.msUntilRelease}
                />
              )
            }

            // ── 결과 공개 (즉시 판정 포함) ──────────────────────
            if (visibility.visibility === 'released') {
              return (
                <ResultCard
                  key={app.id}
                  application={app}
                  releasedAt={visibility.releasedAt!.toISOString()}
                />
              )
            }

            // ── pending_submission: 거의 도달 안 함 ─────────────
            return (
              <div
                key={app.id}
                className="bg-white rounded-2xl border border-gray-200 p-6 text-sm text-gray-500 flex items-center gap-3"
              >
                <span className="text-xl">⏳</span>
                <span>{app.exam?.title} — 집계 중입니다.</span>
              </div>
            )
          })}
        </div>
      ) : (
        /* ── 응시 내역 없음 ─────────────────────────────────── */
        <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-16 text-center">
          <div className="text-5xl mb-4">📊</div>
          <h2 className="font-semibold text-gray-700 mb-1">
            아직 응시한 시험이 없습니다
          </h2>
          <p className="text-sm text-gray-400 mb-5">
            시험 신청 후 응시하면 이 페이지에서 결과를 확인할 수 있습니다.
          </p>
          <Link
            href="/exam/apply"
            className="inline-flex items-center px-5 py-2.5 bg-cyan-600 text-white text-sm font-semibold rounded-xl hover:bg-cyan-700 transition-colors"
          >
            시험 신청하기 →
          </Link>
        </div>
      )}
    </div>
  )
}
