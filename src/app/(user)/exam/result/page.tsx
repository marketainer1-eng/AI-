import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import ResultPending from '@/components/result/ResultPending'
import ResultCard    from '@/components/result/ResultCard'
import { checkResultVisibility } from '@/lib/exam/access'
import type { ApplicationWithExam } from '@/types'

export default async function ExamResultPage() {
  const supabase = await createClient()

  // ── 인증 ────────────────────────────────────────────────────
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // ── 시험 응시 이후 상태의 신청 내역 전체 조회 ───────────────
  //  (exam_completed / passed / failed / certificate_ready)
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

  // ── 각 신청 건에 결과 공개 여부 판정 ──────────────────────
  const enriched = list.map((app) => ({
    app,
    visibility: checkResultVisibility(app, now),
  }))

  return (
    <div className="space-y-6 max-w-3xl">
      {/* 페이지 헤더 */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">결과 조회</h1>
        <p className="text-gray-500 text-sm mt-1">
          응시한 시험의 결과를 확인하세요. 발표일 이후에 점수가 공개됩니다.
        </p>
      </div>

      {/* 발표일 기준 안내 배너 */}
      {enriched.some((e) => e.visibility.visibility === 'pending_release') && (
        <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-100 rounded-xl text-sm text-blue-800">
          <span className="text-lg">ℹ️</span>
          <p>
            결과 점수는 <strong>발표일 이후</strong>에만 확인할 수 있습니다.
            발표 시각이 되면 이 페이지가 자동으로 새로고침됩니다.
          </p>
        </div>
      )}

      {/* 신청 내역 목록 */}
      {enriched.length > 0 ? (
        <div className="space-y-5">
          {enriched.map(({ app, visibility }) => {
            // ── 발표 전 ─────────────────────────────────────
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

            // ── 발표 후 (점수 공개) ──────────────────────────
            if (visibility.visibility === 'released') {
              return (
                <ResultCard
                  key={app.id}
                  application={app}
                  releasedAt={visibility.releasedAt!.toISOString()}
                />
              )
            }

            // ── pending_submission: 제출은 됐지만 상태가 이상한 케이스 ──
            // (정상적으론 거의 도달 안 함)
            return (
              <div
                key={app.id}
                className="bg-white rounded-2xl border border-gray-200 p-6 text-sm text-gray-500"
              >
                {app.exam?.title} — 집계 중
              </div>
            )
          })}
        </div>
      ) : (
        /* 응시 내역 없음 */
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
            className="inline-flex items-center px-5 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 transition-colors"
          >
            시험 신청하기
          </Link>
        </div>
      )}
    </div>
  )
}
