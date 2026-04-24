import Link from 'next/link'
import type { ApplicationWithExam } from '@/types'
import { formatDate, formatDateTime } from '@/lib/utils/format'
import ResultReview from '@/components/result/ResultReview'

interface ResultCardProps {
  application: ApplicationWithExam
  releasedAt: string
}

export default function ResultCard({ application, releasedAt }: ResultCardProps) {
  const isPassed =
    application.status === 'passed' || application.status === 'certificate_ready'
  const isCertReady = application.status === 'certificate_ready'
  const score       = application.score
  const passingScore = application.exam?.passing_score ?? 60

  // 점수 바 퍼센트 (0~100 클램프)
  const barWidth = score !== null ? Math.min(100, Math.max(0, score)) : 0

  return (
    <article className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
      {/* 상단 컬러 띠 */}
      <div
        className={`h-1.5 ${
          isPassed
            ? 'bg-gradient-to-r from-green-400 to-emerald-500'
            : 'bg-gradient-to-r from-red-400 to-rose-500'
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

          {/* 합격/불합격 뱃지 */}
          <span
            className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-bold ${
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
            className={`rounded-2xl p-6 mb-6 ${
              isPassed
                ? 'bg-gradient-to-br from-green-50 to-emerald-50 border border-green-100'
                : 'bg-gradient-to-br from-red-50 to-rose-50 border border-red-100'
            }`}
          >
            <div className="flex items-end justify-between mb-4">
              {/* 점수 */}
              <div>
                <p className={`text-xs font-semibold uppercase tracking-wider mb-1 ${isPassed ? 'text-green-500' : 'text-red-400'}`}>
                  최종 점수
                </p>
                <div className="flex items-end gap-1">
                  <span
                    className={`text-5xl font-extrabold tabular-nums ${
                      isPassed ? 'text-green-700' : 'text-red-600'
                    }`}
                  >
                    {score}
                  </span>
                  <span className={`text-xl font-bold mb-1 ${isPassed ? 'text-green-500' : 'text-red-400'}`}>
                    점
                  </span>
                </div>
              </div>

              {/* 합격 기준 */}
              <div className="text-right">
                <p className="text-xs text-gray-400 mb-0.5">합격 기준</p>
                <p className="text-lg font-bold text-gray-600">
                  {passingScore}<span className="text-sm font-medium">점 이상</span>
                </p>
              </div>
            </div>

            {/* 점수 프로그레스 바 */}
            <div className="space-y-1.5">
              <div className="relative h-3 bg-white/60 rounded-full overflow-hidden">
                {/* 합격 기준선 */}
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-gray-400/50 z-10"
                  style={{ left: `${passingScore}%` }}
                />
                {/* 점수 바 */}
                <div
                  className={`h-full rounded-full transition-all duration-700 ${
                    isPassed ? 'bg-green-500' : 'bg-red-400'
                  }`}
                  style={{ width: `${barWidth}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-gray-400">
                <span>0점</span>
                <span className="text-gray-500">합격선 {passingScore}점</span>
                <span>100점</span>
              </div>
            </div>

            {/* 합격/불합격 안내 텍스트 */}
            <p
              className={`mt-3 text-xs font-medium text-center ${
                isPassed ? 'text-green-600' : 'text-red-500'
              }`}
            >
              {isPassed
                ? `합격 기준(${passingScore}점)을 ${(score - passingScore).toFixed(1)}점 초과 달성했습니다.`
                : `합격 기준(${passingScore}점)까지 ${(passingScore - score).toFixed(1)}점 부족합니다.`}
            </p>
          </div>
        ) : (
          /* 점수 미집계 (exam_completed 등) */
          <div className="bg-yellow-50 border border-yellow-100 rounded-xl p-4 mb-6 text-center text-sm text-yellow-700">
            ⏳ 점수 집계 중입니다.
          </div>
        )}

        {/* 결과 메타 정보 */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm mb-6">
          <InfoCell label="발표일" value={formatDate(releasedAt)} />
          {application.result_notified_at && (
            <InfoCell
              label="결과 통보"
              value={formatDateTime(application.result_notified_at)}
            />
          )}
          {application.exam_submitted_at && (
            <InfoCell
              label="제출 일시"
              value={formatDateTime(application.exam_submitted_at)}
            />
          )}
        </div>

        {/* 문제별 채점 결과 (오답 분석) — 발표 이후에만 표시 */}
        {application.exam?.id && (
          <div className="mb-6">
            <ResultReview
              applicationId={application.id}
              examId={application.exam.id}
              passingScore={passingScore}
            />
          </div>
        )}

        {/* 액션 버튼 */}
        <div className="flex flex-wrap gap-3">
          {isCertReady && (
            <Link
              href="/certificate"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm"
            >
              🏆 자격증 다운로드
            </Link>
          )}
          {isPassed && !isCertReady && (
            <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-100 text-gray-500 text-sm rounded-xl">
              🏆 자격증 발급 준비 중...
            </div>
          )}
          {!isPassed && (
            <Link
              href="/exam/apply"
              className="inline-flex items-center gap-2 px-5 py-2.5 border border-indigo-300 text-indigo-600 hover:bg-indigo-50 text-sm font-medium rounded-xl transition-colors"
            >
              재응시 신청하기 →
            </Link>
          )}
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-600 text-sm font-medium rounded-xl transition-colors"
          >
            내 현황
          </Link>
        </div>
      </div>
    </article>
  )
}

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
