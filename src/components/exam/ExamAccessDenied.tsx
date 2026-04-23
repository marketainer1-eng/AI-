'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import type { AccessDenyReason } from '@/lib/exam/access'

interface ExamAccessDeniedProps {
  reason: AccessDenyReason
  title: string
  description: string
  /** before_exam 일 때: 시험 시작까지 남은 밀리초 */
  msUntilStart?: number
}

// ─── 사유별 아이콘 / 색상 / 액션 버튼 ──────────────────────
const REASON_CONFIG: Record<
  AccessDenyReason,
  {
    icon: string
    gradientFrom: string
    gradientTo: string
    ringColor: string
    badgeClass: string
    badgeLabel: string
    actions: { href: string; label: string; primary?: boolean }[]
  }
> = {
  no_application: {
    icon: '📋',
    gradientFrom: 'from-gray-500',
    gradientTo: 'to-slate-500',
    ringColor: 'ring-gray-200',
    badgeClass: 'bg-gray-100 text-gray-600',
    badgeLabel: '신청 없음',
    actions: [
      { href: '/exam/apply', label: '시험 신청하기', primary: true },
      { href: '/dashboard', label: '내 현황' },
    ],
  },
  not_approved: {
    icon: '💳',
    gradientFrom: 'from-yellow-500',
    gradientTo: 'to-orange-400',
    ringColor: 'ring-yellow-200',
    badgeClass: 'bg-yellow-100 text-yellow-700',
    badgeLabel: '입금 확인 필요',
    actions: [
      { href: '/dashboard', label: '내 현황 확인', primary: true },
      { href: '/exam/apply', label: '시험 목록' },
    ],
  },
  already_completed: {
    icon: '✅',
    gradientFrom: 'from-green-500',
    gradientTo: 'to-emerald-400',
    ringColor: 'ring-green-200',
    badgeClass: 'bg-green-100 text-green-700',
    badgeLabel: '제출 완료',
    actions: [
      { href: '/exam/result', label: '결과 조회', primary: true },
      { href: '/dashboard', label: '내 현황' },
    ],
  },
  before_exam: {
    icon: '⏰',
    gradientFrom: 'from-blue-500',
    gradientTo: 'to-indigo-400',
    ringColor: 'ring-blue-200',
    badgeClass: 'bg-blue-100 text-blue-700',
    badgeLabel: '시험 시작 전',
    actions: [
      { href: '/dashboard', label: '내 현황 보기', primary: true },
    ],
  },
  after_exam: {
    icon: '🔒',
    gradientFrom: 'from-red-500',
    gradientTo: 'to-rose-400',
    ringColor: 'ring-red-200',
    badgeClass: 'bg-red-100 text-red-700',
    badgeLabel: '시험 종료',
    actions: [
      { href: '/exam/result', label: '결과 조회', primary: true },
      { href: '/dashboard', label: '내 현황' },
    ],
  },
  no_exam_schedule: {
    icon: '⚠️',
    gradientFrom: 'from-gray-400',
    gradientTo: 'to-gray-500',
    ringColor: 'ring-gray-200',
    badgeClass: 'bg-gray-100 text-gray-600',
    badgeLabel: '일정 없음',
    actions: [
      { href: '/dashboard', label: '내 현황', primary: true },
    ],
  },
}

// ─── 카운트다운 훅 ───────────────────────────────────────────
function useCountdown(initialMs: number | undefined) {
  const [msLeft, setMsLeft] = useState(initialMs ?? 0)

  useEffect(() => {
    if (!initialMs || initialMs <= 0) return
    const end = Date.now() + initialMs
    const id = setInterval(() => {
      const remaining = Math.max(0, end - Date.now())
      setMsLeft(remaining)
      if (remaining === 0) clearInterval(id)
    }, 1000)
    return () => clearInterval(id)
  }, [initialMs])

  const totalSec = Math.ceil(msLeft / 1000)
  const hours    = Math.floor(totalSec / 3600)
  const minutes  = Math.floor((totalSec % 3600) / 60)
  const seconds  = totalSec % 60

  return { hours, minutes, seconds, totalSec }
}

// ─── 메인 컴포넌트 ────────────────────────────────────────────
export default function ExamAccessDenied({
  reason,
  title,
  description,
  msUntilStart,
}: ExamAccessDeniedProps) {
  const config = REASON_CONFIG[reason]
  const { hours, minutes, seconds, totalSec } = useCountdown(
    reason === 'before_exam' ? msUntilStart : undefined
  )

  // description 에 \n 이 있으면 줄바꿈 처리
  const descLines = description.split('\n')

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* ── 카드 ── */}
        <div className={`bg-white rounded-2xl shadow-lg ring-1 ${config.ringColor} overflow-hidden`}>

          {/* 상단 그라디언트 헤더 */}
          <div className={`bg-gradient-to-r ${config.gradientFrom} ${config.gradientTo} px-8 pt-8 pb-10 text-center`}>
            <div className="text-6xl mb-3 drop-shadow">{config.icon}</div>
            <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold mb-3 ${config.badgeClass} bg-white/80`}>
              {config.badgeLabel}
            </span>
            <h1 className="text-xl font-bold text-white drop-shadow-sm">
              {title}
            </h1>
          </div>

          {/* 본문 */}
          <div className="px-8 py-6">
            {/* 설명 */}
            <div className="text-sm text-gray-600 leading-relaxed space-y-1 mb-6">
              {descLines.map((line, i) => (
                <p key={i} className={i === 0 ? 'font-medium text-gray-800' : ''}>
                  {line}
                </p>
              ))}
            </div>

            {/* 시험 시작 카운트다운 (before_exam 전용) */}
            {reason === 'before_exam' && msUntilStart !== undefined && totalSec > 0 && (
              <div className="mb-6 p-4 bg-blue-50 border border-blue-100 rounded-xl text-center">
                <p className="text-xs text-blue-500 font-medium mb-2">시험 시작까지</p>
                <div className="flex justify-center gap-3">
                  {[
                    { value: hours,   label: '시간' },
                    { value: minutes, label: '분' },
                    { value: seconds, label: '초' },
                  ].map(({ value, label }) => (
                    <div key={label} className="flex flex-col items-center">
                      <span className="text-3xl font-mono font-bold text-blue-700 tabular-nums w-14 text-center">
                        {String(value).padStart(2, '0')}
                      </span>
                      <span className="text-[10px] text-blue-400 mt-0.5">{label}</span>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-blue-400 mt-3">
                  이 페이지는 시험 시작 시각에 자동으로 새로고침됩니다.
                </p>
                {/* 시작 시각이 되면 자동 새로고침 */}
                <AutoRefreshOnStart msUntilStart={msUntilStart} />
              </div>
            )}

            {/* not_approved 전용: 입금 안내 박스 */}
            {reason === 'not_approved' && (
              <div className="mb-6 p-4 bg-yellow-50 border border-yellow-100 rounded-xl text-sm">
                <p className="font-semibold text-yellow-800 mb-2">💳 응시료 입금 안내</p>
                <dl className="space-y-1.5 text-yellow-700">
                  <div className="flex justify-between">
                    <dt className="text-yellow-500">은행</dt>
                    <dd className="font-medium">국민은행</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-yellow-500">계좌</dt>
                    <dd className="font-medium">000-0000-0000-00</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-yellow-500">예금주</dt>
                    <dd className="font-medium">자격증센터</dd>
                  </div>
                </dl>
              </div>
            )}

            {/* 액션 버튼 */}
            <div className="flex flex-col gap-2.5">
              {config.actions.map((action) => (
                <Link
                  key={action.href}
                  href={action.href}
                  className={
                    action.primary
                      ? 'w-full py-2.5 text-center text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors shadow-sm'
                      : 'w-full py-2.5 text-center text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors'
                  }
                >
                  {action.label}
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* 하단 도움말 */}
        <p className="text-center text-xs text-gray-400 mt-4">
          문제가 있으신가요?{' '}
          <a href="mailto:help@certcenter.kr" className="underline hover:text-gray-600">
            고객센터 문의
          </a>
        </p>
      </div>
    </div>
  )
}

// ─── 자동 새로고침 (시작 시각 도달 시) ─────────────────────
function AutoRefreshOnStart({ msUntilStart }: { msUntilStart: number }) {
  useEffect(() => {
    if (msUntilStart <= 0) return
    const id = setTimeout(() => {
      window.location.reload()
    }, msUntilStart + 500) // 500ms 여유
    return () => clearTimeout(id)
  }, [msUntilStart])

  return null
}
