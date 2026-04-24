'use client'

/**
 * ExamAccessDenied
 *
 * 시험 응시 불가 사유별 안내 UI
 *  - not_approved   → 💳 입금 확인 필요  (계좌 안내 + 입금 절차)
 *  - before_exam    → ⏰ 시험 시작 전    (카운트다운 + 시작 시 자동 새로고침)
 *  - after_exam     → 🔒 시험 시간이 아닙니다  (응시 시간 표시)
 *  - already_completed → ✅ 이미 제출 완료
 *  - no_application → 📋 신청 없음
 *  - no_exam_schedule → ⚠️ 일정 정보 없음
 */

import { useEffect, useState } from 'react'
import Link from 'next/link'
import type { AccessDenyReason } from '@/lib/exam/access'

// ─────────────────────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────────────────────
interface ExamAccessDeniedProps {
  reason: AccessDenyReason
  title: string
  description: string
  /** before_exam: 시험 시작까지 남은 ms */
  msUntilStart?: number
  /** before_exam: 시험 시작 ISO 문자열 */
  examStartAt?: string
  /** after_exam / before_exam: 시험 종료 ISO 문자열 */
  examEndAt?: string
  /** before_exam / after_exam: 포맷된 시작 시각 */
  examStartAtFormatted?: string
  /** before_exam / after_exam: 포맷된 종료 시각 */
  examEndAtFormatted?: string
}

// ─────────────────────────────────────────────────────────────
// 사유별 정적 설정
// ─────────────────────────────────────────────────────────────
const REASON_CFG = {
  no_application: {
    icon: '📋', badge: '신청 없음',
    headerCls: 'from-slate-500 to-gray-600',
    ringCls: 'ring-gray-200',
    actions: [
      { href: '/exam/apply', label: '시험 신청하기', primary: true },
      { href: '/dashboard',  label: '내 현황' },
    ],
  },
  not_approved: {
    icon: '💳', badge: '입금 확인 필요',
    headerCls: 'from-amber-500 to-orange-500',
    ringCls: 'ring-amber-200',
    actions: [
      { href: '/dashboard',  label: '내 현황 확인', primary: true },
      { href: '/exam/apply', label: '시험 목록' },
    ],
  },
  already_completed: {
    icon: '✅', badge: '제출 완료',
    headerCls: 'from-green-500 to-emerald-500',
    ringCls: 'ring-green-200',
    actions: [
      { href: '/exam/result', label: '결과 조회', primary: true },
      { href: '/dashboard',   label: '내 현황' },
    ],
  },
  before_exam: {
    icon: '⏰', badge: '시험 시작 전',
    headerCls: 'from-blue-500 to-indigo-500',
    ringCls: 'ring-blue-200',
    actions: [
      { href: '/dashboard', label: '내 현황 보기', primary: true },
    ],
  },
  after_exam: {
    icon: '🔒', badge: '시험 시간 아님',
    headerCls: 'from-red-500 to-rose-500',
    ringCls: 'ring-red-200',
    actions: [
      { href: '/exam/result', label: '결과 조회', primary: true },
      { href: '/dashboard',   label: '내 현황' },
    ],
  },
  no_exam_schedule: {
    icon: '⚠️', badge: '일정 없음',
    headerCls: 'from-gray-400 to-gray-500',
    ringCls: 'ring-gray-200',
    actions: [
      { href: '/dashboard', label: '내 현황', primary: true },
    ],
  },
} satisfies Record<AccessDenyReason, {
  icon: string; badge: string
  headerCls: string; ringCls: string
  actions: { href: string; label: string; primary?: boolean }[]
}>

// ─────────────────────────────────────────────────────────────
// 카운트다운 훅
// ─────────────────────────────────────────────────────────────
function useCountdown(initialMs: number | undefined) {
  const [msLeft, setMsLeft] = useState(initialMs ?? 0)

  useEffect(() => {
    if (!initialMs || initialMs <= 0) return
    const endTs = Date.now() + initialMs
    const id = setInterval(() => {
      const rem = Math.max(0, endTs - Date.now())
      setMsLeft(rem)
      if (rem === 0) clearInterval(id)
    }, 500)
    return () => clearInterval(id)
  }, [initialMs])

  const totalSec = Math.ceil(msLeft / 1000)
  return {
    hours:   Math.floor(totalSec / 3600),
    minutes: Math.floor((totalSec % 3600) / 60),
    seconds: totalSec % 60,
    totalSec,
  }
}

// ─────────────────────────────────────────────────────────────
// 메인 컴포넌트
// ─────────────────────────────────────────────────────────────
export default function ExamAccessDenied({
  reason,
  title,
  description,
  msUntilStart,
  examStartAt,
  examEndAt,
  examStartAtFormatted,
  examEndAtFormatted,
}: ExamAccessDeniedProps) {
  const cfg = REASON_CFG[reason]
  const { hours, minutes, seconds, totalSec } = useCountdown(
    reason === 'before_exam' ? msUntilStart : undefined
  )

  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md space-y-4">

        {/* ── 카드 ── */}
        <div className={`bg-white rounded-2xl shadow-lg ring-1 overflow-hidden ${cfg.ringCls}`}>

          {/* 그라디언트 헤더 */}
          <div className={`bg-gradient-to-br ${cfg.headerCls} px-8 pt-8 pb-10 text-center relative overflow-hidden`}>
            {/* 배경 패턴 */}
            <div className="absolute inset-0 opacity-10"
              style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)', backgroundSize: '30px 30px' }}
            />
            <div className="relative">
              <div className="text-6xl mb-3 drop-shadow-sm">{cfg.icon}</div>
              <span className="inline-block px-3 py-1 rounded-full text-xs font-bold mb-3 bg-white/20 text-white backdrop-blur-sm border border-white/30">
                {cfg.badge}
              </span>
              <h1 className="text-xl font-bold text-white drop-shadow">{title}</h1>
            </div>
          </div>

          {/* 본문 */}
          <div className="px-6 py-6 space-y-5">

            {/* 설명 텍스트 */}
            <div className="space-y-1">
              {description.split('\n').map((line, i) => (
                <p key={i} className={`text-sm leading-relaxed ${
                  i === 0 ? 'font-medium text-gray-800' : 'text-gray-500'
                }`}>
                  {line}
                </p>
              ))}
            </div>

            {/* ─── 사유별 전용 UI ─────────────────────────────── */}

            {/* 💳 not_approved: 입금 안내 박스 */}
            {reason === 'not_approved' && (
              <div className="rounded-xl border border-amber-100 bg-amber-50 overflow-hidden">
                <div className="px-4 py-2.5 bg-amber-100 border-b border-amber-200">
                  <p className="text-xs font-bold text-amber-800">💳 응시료 입금 안내</p>
                </div>
                <dl className="px-4 py-3 space-y-2">
                  {[
                    { label: '은행',   value: '국민은행' },
                    { label: '계좌번호', value: '000-0000-0000-00' },
                    { label: '예금주',  value: '자격증센터' },
                    { label: '금액',   value: '응시료 확인' },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex justify-between text-sm">
                      <dt className="text-amber-500 font-medium">{label}</dt>
                      <dd className="font-semibold text-amber-900">{value}</dd>
                    </div>
                  ))}
                </dl>
                <div className="px-4 py-3 bg-amber-50 border-t border-amber-100">
                  <p className="text-xs text-amber-600 leading-relaxed">
                    입금 후 관리자가 확인하면 상태가 <strong>"응시 가능"</strong>으로 변경됩니다.
                    내 현황 페이지에서 상태를 확인해주세요.
                  </p>
                </div>
              </div>
            )}

            {/* ⏰ before_exam: 카운트다운 */}
            {reason === 'before_exam' && (
              <>
                {/* 시험 시간 정보 */}
                {(examStartAtFormatted || examEndAtFormatted) && (
                  <div className="rounded-xl bg-blue-50 border border-blue-100 px-4 py-3 space-y-2">
                    <p className="text-xs font-bold text-blue-700 uppercase tracking-wider">
                      📅 시험 일정
                    </p>
                    {examStartAtFormatted && (
                      <div className="flex justify-between text-sm">
                        <span className="text-blue-500">시작</span>
                        <span className="font-semibold text-blue-900">{examStartAtFormatted}</span>
                      </div>
                    )}
                    {examEndAtFormatted && (
                      <div className="flex justify-between text-sm">
                        <span className="text-blue-500">종료</span>
                        <span className="font-semibold text-blue-900">{examEndAtFormatted}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* 카운트다운 타이머 */}
                {msUntilStart !== undefined && totalSec > 0 && (
                  <div className="rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 px-4 py-5 text-center">
                    <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-4">
                      시험 시작까지
                    </p>
                    <div className="flex justify-center gap-2 sm:gap-4 mb-4">
                      {[
                        { v: hours,   l: '시간' },
                        { v: minutes, l: '분' },
                        { v: seconds, l: '초' },
                      ].map(({ v, l }) => (
                        <div key={l} className="flex flex-col items-center">
                          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white rounded-2xl shadow-sm border border-blue-100 flex items-center justify-center">
                            <span className="text-2xl sm:text-3xl font-mono font-black text-blue-700 tabular-nums">
                              {String(v).padStart(2, '0')}
                            </span>
                          </div>
                          <span className="text-[10px] text-blue-400 mt-1.5 font-medium">{l}</span>
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-blue-400">
                      시험 시작 시각에 이 페이지가 자동으로 새로고침됩니다.
                    </p>
                  </div>
                )}

                {/* 시작 시각이 되면 자동 새로고침 */}
                {msUntilStart !== undefined && (
                  <AutoRefresh msUntil={msUntilStart} />
                )}
              </>
            )}

            {/* 🔒 after_exam: 응시 시간 요약 */}
            {reason === 'after_exam' && (
              <div className="rounded-xl bg-red-50 border border-red-100 overflow-hidden">
                <div className="px-4 py-2.5 bg-red-100 border-b border-red-200">
                  <p className="text-xs font-bold text-red-700">🕐 응시 가능 시간</p>
                </div>
                <div className="px-4 py-3 space-y-2">
                  {examStartAtFormatted && (
                    <div className="flex justify-between text-sm">
                      <span className="text-red-400">시작</span>
                      <span className="font-semibold text-red-800">{examStartAtFormatted}</span>
                    </div>
                  )}
                  {examEndAtFormatted && (
                    <div className="flex justify-between text-sm">
                      <span className="text-red-400">종료</span>
                      <span className="font-semibold text-red-800">{examEndAtFormatted}</span>
                    </div>
                  )}
                </div>
                <div className="px-4 py-3 bg-red-50 border-t border-red-100">
                  <p className="text-xs text-red-500">
                    시험 시간이 종료되었습니다. 다음 시험 일정을 확인해주세요.
                  </p>
                </div>
              </div>
            )}

            {/* 액션 버튼 */}
            <div className="flex flex-col gap-2.5 pt-1">
              {cfg.actions.map((a) => (
                <Link
                  key={a.href}
                  href={a.href}
                  className={
                    a.primary
                      ? 'w-full py-3 text-center text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors shadow-sm'
                      : 'w-full py-3 text-center text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors'
                  }
                >
                  {a.label}
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* 하단 도움말 */}
        <p className="text-center text-xs text-gray-400">
          문제가 있으신가요?{' '}
          <a href="mailto:help@certcenter.kr" className="underline hover:text-gray-600">
            고객센터 문의
          </a>
        </p>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// 자동 새로고침 (시험 시작 / 종료 시각 도달 시)
// ─────────────────────────────────────────────────────────────
function AutoRefresh({ msUntil }: { msUntil: number }) {
  useEffect(() => {
    if (msUntil <= 0) { window.location.reload(); return }
    const id = setTimeout(() => window.location.reload(), msUntil + 500)
    return () => clearTimeout(id)
  }, [msUntil])
  return null
}
