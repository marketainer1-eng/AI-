import Link from 'next/link'
import type { ApplicationWithExam } from '@/types'
import { formatDate, formatDateTime } from '@/lib/utils/format'

interface ResultCardProps {
  application: ApplicationWithExam
  releasedAt: string | null
}

export default function ResultCard({ application, releasedAt }: ResultCardProps) {
  const isPassed =
    application.status === 'passed' ||
    application.status === 'certificate_ready'

  const score        = application.score
  const passingScore = application.exam?.passing_score ?? 60
  const scorePercent = score !== null ? Math.min(100, score) : 0

  // 점수 바 색상
  const barColor = isPassed
    ? 'bg-gradient-to-r from-emerald-400 to-green-500'
    : 'bg-gradient-to-r from-orange-400 to-red-400'

  return (
    <article className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
      {/* 상단 컬러 띠 */}
      <div
        className={`h-1.5 ${isPassed
          ? 'bg-gradient-to-r from-green-400 to-emerald-500'
          : 'bg-gradient-to-r from-orange-400 to-red-400'
        }`}
      />

      <div className="p-6 sm:p-8">
        {/* 헤더 */}
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <h2 className="text-lg font-bold text-gray-900">
              {application.exam?.title}
            </h2>
            {application.exam?.exam_start_at && (
              <p className="text-sm text-gray-400 mt-0.5">
                시험일 · {formatDate(application.exam.exam_start_at)}
              </p>
            )}
          </div>

          {/* 합격/불합격 배지 */}
          <span
            className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
              isPassed
                ? 'bg-green-100 text-green-700'
                : 'bg-red-100 text-red-600'
            }`}
          >
            {isPassed ? '🎉 합격' : '😔 불합격'}
          </span>
        </div>

        {/* 점수 섹션 */}
        {score !== null ? (
          <div
            className={`rounded-2xl border p-6 mb-6 ${
              isPassed
                ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-200'
                : 'bg-gradient-to-br from-orange-50 to-red-50 border-red-200'
            }`}
          >
            {/* 점수 숫자 */}
            <div className="flex items-end justify-between mb-4">
              <div>
                <p className={`text-xs font-semibold uppercase tracking-wider mb-1 ${
                  isPassed ? 'text-green-500' : 'text-red-400'
                }`}>
                  내 점수
                </p>
                <div className="flex items-baseline gap-1">
                  <span className={`text-5xl font-extrabold tabular-nums ${
                    isPassed ? 'text-green-700' : 'text-red-600'
                  }`}>
                    {score}
                  </span>
                  <span className={`text-xl font-bold ${
                    isPassed ? 'text-green-500' : 'text-red-400'
                  }`}>점</span>
                </div>
              </div>

              {/* 합격 기준 */}
              <div className="text-right">
                <p className="text-xs text-gray-400 mb-1">합격 기준</p>
                <p className="text-2xl font-bold text-gray-500">
                  {passingScore}<span className="text-base">점</span>
                </p>
              </div>
            </div>

            {/* 점수 바 */}
            <div className="relative">
              <div className="w-full h-3 bg-white/70 rounded-full overflow-hidden border border-white">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${barColor}`}
                  style={{ width: `${scorePercent}%` }}
                />
              </div>
              {/* 합격 기준선 */}
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-gray-400/60"
                style={{ left: `${passingScore}%` }}
                title={`합격 기준: ${passingScore}점`}
              />
              {/* 합격 기준 레이블 */}
              <div
                className="absolute -top-5 text-[10px] text-gray-400 -translate-x-1/2"
                style={{ left: `${passingScore}%` }}
              >
                {passingScore}점
              </div>
            </div>

            {/* 점수 차이 */}
            <p className={`mt-3 text-xs font-medium ${
              isPassed ? 'text-green-600' : 'text-red-500'
            }`}>
              {isPassed
                ? `합격 기준보다 ${(score - passingScore).toFixed(1)}점 높습니다.`
                : `합격까지 ${(passingScore - score).toFixed(1)}점 부족합니다.`
              }
            </p>
          </div>
        ) : (
          /* 점수 미공개 (exam_completed 상태인데 released 판정된 경우 – 예외) */
          <div className="bg-gray-50 border border-gray-200 rounded-2xl p-5 mb-6 text-center text-sm text-gray-500">
            점수 정보를 불러올 수 없습니다.
          </div>
        )}

        {/* 상세 정보 그리드 */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
          {releasedAt && (
            <InfoCell label="결과 발표일" value={formatDate(releasedAt)} />
          )}
          {application.exam_submitted_at && (
            <InfoCell label="제출 일시" value={formatDateTime(application.exam_submitted_at)} />
          )}
          <InfoCell label="합격 기준" value={`${passingScore}점 이상`} />
        </div>

        {/* 액션 버튼 */}
        <div className="flex flex-wrap gap-3">
          {application.status === 'certificate_ready' && (
            <Link
              href="/certificate"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm"
            >
              🏆 자격증 다운로드
            </Link>
          )}

          {application.status === 'passed' && (
            <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-medium rounded-xl">
              ✓ 자격증 발급 준비 중
            </div>
          )}

          {application.status === 'failed' && (
            <Link
              href="/exam/apply"
              className="inline-flex items-center gap-2 px-5 py-2.5 border border-indigo-200 text-indigo-600 hover:bg-indigo-50 text-sm font-semibold rounded-xl transition-colors"
            >
              재응시 신청하기 →
            </Link>
          )}

          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-600 text-sm font-medium rounded-xl transition-colors"
          >
            내 현황
          </Link>
        </div>
      </div>
    </article>
  )
}

// ─── 보조 컴포넌트 ────────────────────────────────────────────
function InfoCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-gray-50 rounded-xl px-4 py-3">
      <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider mb-0.5">
        {label}
      </p>
      <p className="text-sm font-semibold text-gray-800 truncate">{value}</p>
    </div>
  )
}
