import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import ResultPending from '@/components/result/ResultPending'
import ResultCard from '@/components/result/ResultCard'
import { checkResultVisibility } from '@/lib/exam/access'
import type { ApplicationWithExam } from '@/types'

export default async function ExamResultPage() {
  const supabase = await createClient()

  // ── 인증 ─────────────────────────────────────────────────────
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // ── 응시 완료된 신청 내역 전체 조회 (최신순) ─────────────────
  //    exam:exams 의 result_released_at 포함
  const { data: applications } = await (supabase as any)
    .from('exam_applications')
    .select(`
      *,
      exam:exams (
        id,
        title,
        exam_start_at,
        exam_end_at,
        result_released_at,
        passing_score,
        duration_minutes
      )
    `)
    .eq('user_id', user.id)
    .in('status', ['exam_completed', 'passed', 'failed', 'certificate_ready'])
    .order('created_at', { ascending: false })

  const now = new Date()
  const apps = ((applications ?? []) as ApplicationWithExam[])

  // ── 각 신청 건마다 결과 공개 여부 판정 ───────────────────────
  const appWithVisibility = apps.map((app) => ({
    app,
    visibility: checkResultVisibility(app, now),
  }))

  // 결과 공개 건수 / 대기 건수
  const releasedCount = appWithVisibility.filter(
    (a) => a.visibility.visibility === 'released'
  ).length
  const pendingCount = appWithVisibility.filter(
    (a) => a.visibility.visibility === 'pending_release'
  ).length

  return (
    <div className="space-y-6 max-w-3xl">
      {/* ── 헤더 ── */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">결과 조회</h1>
          <p className="text-gray-500 text-sm mt-1">
            응시한 시험의 결과를 확인하세요.
          </p>
        </div>

        {/* 요약 뱃지 */}
        {apps.length > 0 && (
          <div className="flex gap-2 text-xs">
            {releasedCount > 0 && (
              <span className="px-2.5 py-1 rounded-full bg-green-100 text-green-700 font-medium">
                발표 완료 {releasedCount}건
              </span>
            )}
            {pendingCount > 0 && (
              <span className="px-2.5 py-1 rounded-full bg-purple-100 text-purple-700 font-medium">
                발표 대기 {pendingCount}건
              </span>
            )}
          </div>
        )}
      </div>

      {/* ── 신청 목록 ── */}
      {appWithVisibility.length > 0 ? (
        <div className="space-y-5">
          {appWithVisibility.map(({ app, visibility }) => {
            // ── 결과 공개 ──────────────────────────────────────
            if (visibility.visibility === 'released') {
              return (
                <ResultCard
                  key={app.id}
                  application={app}
                  releasedAt={app.exam?.result_released_at ?? null}
                />
              )
            }

            // ── 발표 대기 ──────────────────────────────────────
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
          })}
        </div>
      ) : (
        /* ── 응시 내역 없음 ── */
        <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-16 text-center">
          <div className="text-5xl mb-4">📊</div>
          <h2 className="font-semibold text-gray-700 mb-1">
            아직 응시한 시험이 없습니다
          </h2>
          <p className="text-sm text-gray-400 mb-5">
            시험에 응시하면 결과가 여기에 표시됩니다.
          </p>
          <Link
            href="/exam/apply"
            className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-xl transition-colors"
          >
            시험 신청하기
          </Link>
        </div>
      )}

      {/* ── 결과 발표 안내 (대기 건이 있을 때) ── */}
      {pendingCount > 0 && (
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm text-blue-700">
          <p className="font-semibold mb-0.5">📣 결과 발표 안내</p>
          <p className="text-blue-600 text-xs leading-relaxed">
            발표 예정 시각이 되면 이 페이지가 자동으로 새로고침됩니다.
            발표일 이후에도 결과가 표시되지 않으면 새로고침을 눌러주세요.
          </p>
        </div>
      )}
    </div>
  )
}
