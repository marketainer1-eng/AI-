'use client'

import { useEffect, useState } from 'react'
import type { ApplicationWithExam } from '@/types'
import { formatDate, formatDateTime } from '@/lib/utils/format'

interface ResultPendingProps {
  application: ApplicationWithExam
  releasedAt: string | null
  msUntilRelease: number | null
}

function useCountdown(initialMs: number | null) {
  const [msLeft, setMsLeft] = useState<number>(initialMs ?? 0)

  useEffect(() => {
    if (!initialMs || initialMs <= 0) return
    const endTs = Date.now() + initialMs
    const id = setInterval(() => {
      const remaining = Math.max(0, endTs - Date.now())
      setMsLeft(remaining)
      if (remaining === 0) {
        clearInterval(id)
        setTimeout(() => window.location.reload(), 800)
      }
    }, 1000)
    return () => clearInterval(id)
  }, [initialMs])

  const totalSec = Math.ceil(msLeft / 1000)
  const days    = Math.floor(totalSec / 86400)
  const hours   = Math.floor((totalSec % 86400) / 3600)
  const minutes = Math.floor((totalSec % 3600) / 60)
  const seconds = totalSec % 60

  return { days, hours, minutes, seconds, totalSec }
}

export default function ResultPending({
  application,
  releasedAt,
  msUntilRelease,
}: ResultPendingProps) {
  const { days, hours, minutes, seconds, totalSec } = useCountdown(msUntilRelease)

  const examTitle  = application.exam?.title ?? '시험'
  const examDate   = application.exam?.exam_start_at

  return (
    <article className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
      <div className="h-1.5 bg-gradient-to-r from-indigo-400 via-purple-400 to-blue-400" />

      <div className="p-6 sm:p-8">
        {/* 헤더 */}
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <h2 className="text-lg font-bold text-gray-900">{examTitle}</h2>
            {examDate && (
              <p className="text-sm text-gray-400 mt-0.5">
                시험일 · {formatDate(examDate)}
              </p>
            )}
          </div>
          <span className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-700">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500" />
            </span>
            발표 대기 중
          </span>
        </div>

        {/* 메인 안내 박스 */}
        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100 rounded-2xl p-6 text-center mb-6">
          <div className="text-4xl mb-3">⏳</div>
          <h3 className="text-base font-bold text-indigo-900 mb-1">
            결과 발표를 기다리고 있습니다
          </h3>

          {releasedAt ? (
            <>
              <p className="text-sm text-indigo-600">
                발표 예정일 ·{' '}
                <strong>{formatDateTime(releasedAt)}</strong>
              </p>

              {msUntilRelease !== null && totalSec > 0 && (
                <div className="mt-5">
                  <p className="text-[10px] text-indigo-400 font-semibold uppercase tracking-wider mb-3">
                    발표까지 남은 시간
                  </p>
                  <div className="flex justify-center gap-3">
                    {days > 0 && <CountdownUnit value={days}    label="일" />}
                    <CountdownUnit value={hours}   label="시간" />
                    <CountdownUnit value={minutes} label="분" />
                    <CountdownUnit value={seconds} label="초" />
                  </div>
                  <p className="text-[10px] text-indigo-300 mt-3">
                    발표 시각이 되면 자동으로 새로고침됩니다.
                  </p>
                </div>
              )}

              {msUntilRelease !== null && totalSec === 0 && (
                <p className="mt-4 text-sm text-purple-600 font-medium animate-pulse">
                  결과를 불러오는 중...
                </p>
              )}
            </>
          ) : (
            <p className="text-sm text-indigo-500 mt-1">
              발표 일정이 확정되지 않았습니다. 공지를 확인해주세요.
            </p>
          )}
        </div>

        {/* 제출 정보 요약 */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <InfoCell
            label="제출 완료"
            value={
              application.exam_submitted_at
                ? formatDateTime(application.exam_submitted_at)
                : '-'
            }
          />
          <InfoCell label="합격 기준" value={`${application.exam?.passing_score ?? '-'}점 이상`} />
          {releasedAt && (
            <InfoCell label="발표 예정" value={formatDate(releasedAt)} highlight />
          )}
          <InfoCell label="응시 시험" value={examTitle} />
        </div>

        <p className="mt-5 text-xs text-gray-400 text-center">
          발표일 이후 이 페이지를 새로고침하면 점수와 합격 여부를 확인할 수 있습니다.
        </p>
      </div>
    </article>
  )
}

function CountdownUnit({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <div className="w-14 h-14 bg-white border border-indigo-100 rounded-xl shadow-sm flex items-center justify-center">
        <span className="text-2xl font-mono font-bold text-indigo-700 tabular-nums">
          {String(value).padStart(2, '0')}
        </span>
      </div>
      <span className="text-[10px] text-indigo-400 mt-1.5 font-medium">{label}</span>
    </div>
  )
}

function InfoCell({
  label,
  value,
  highlight = false,
}: {
  label: string
  value: string
  highlight?: boolean
}) {
  return (
    <div className="bg-gray-50 rounded-xl px-4 py-3">
      <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider mb-0.5">
        {label}
      </p>
      <p className={`text-sm font-semibold truncate ${highlight ? 'text-indigo-600' : 'text-gray-800'}`}>
        {value}
      </p>
    </div>
  )
}
