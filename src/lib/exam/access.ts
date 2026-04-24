/**
 * 시험 응시 페이지 접근 제한 로직
 * 시험 결과 공개 판정 로직
 *
 * ┌─ 응시 접근 조건 (모두 AND) ──────────────────────────────┐
 * │  1. 신청 내역이 존재할 것                                 │
 * │  2. status === 'approved'                                 │
 * │  3. 현재 시각 ∈ [exam_start_at, exam_end_at]             │
 * └──────────────────────────────────────────────────────────┘
 *
 * ┌─ 예외 메시지 ────────────────────────────────────────────┐
 * │  미승인(waiting_payment)  → "입금 확인이 필요합니다"       │
 * │  이미 제출                → "이미 제출한 시험입니다"        │
 * │  시험 시작 전             → "아직 시험 시작 전입니다"       │
 * │  시험 시간 아님(종료)     → "시험 시간이 아닙니다"          │
 * └──────────────────────────────────────────────────────────┘
 */

import type { ApplicationWithExam } from '@/types'

// ─────────────────────────────────────────────────────────────
// 접근 결과 타입
// ─────────────────────────────────────────────────────────────

/** 접근 허용 */
export interface AccessGranted {
  granted: true
  /** 시험 마감까지 남은 밀리초 (클라이언트 타이머 초기값) */
  msUntilEnd: number
  /** 시험 종료 UTC 문자열 (클라이언트 실시간 체크용) */
  examEndAt: string
}

/** 접근 거절 사유 */
export type AccessDenyReason =
  | 'no_application'    // 신청 내역 없음
  | 'not_approved'      // 입금 미확인 (waiting_payment)
  | 'already_completed' // 이미 제출 완료
  | 'before_exam'       // 시험 시작 전
  | 'after_exam'        // 시험 시간 아님 (종료)
  | 'no_exam_schedule'  // 시험 일정 정보 없음

export interface AccessDenied {
  granted: false
  reason: AccessDenyReason
  title: string
  description: string
  /** 시험 시작까지 남은 밀리초 (before_exam 전용) */
  msUntilStart?: number
  /** 시험 시작 시각 ISO 문자열 (before_exam 전용 — 클라이언트 카운트다운용) */
  examStartAt?: string
  /** 시험 종료 시각 ISO 문자열 (after_exam 전용 — UI 표시용) */
  examEndAt?: string
  /** 시험 시작 시각 문자열 (after_exam 전용 — 다음 시험 안내용) */
  examStartAtFormatted?: string
  /** 시험 종료 시각 문자열 (UI 표시용) */
  examEndAtFormatted?: string
}

export type AccessResult = AccessGranted | AccessDenied

// ─────────────────────────────────────────────────────────────
// 사유별 기본 메시지
// ─────────────────────────────────────────────────────────────
const BASE_MESSAGE: Record<AccessDenyReason, { title: string; description: string }> = {
  no_application: {
    title: '시험 신청 내역이 없습니다',
    description: '시험 신청 페이지에서 원하는 시험에 신청해주세요.',
  },
  not_approved: {
    title: '입금 확인이 필요합니다',
    description:
      '응시료 입금 후 관리자 확인이 완료되어야 시험에 응시할 수 있습니다.\n' +
      '입금 확인 후 상태가 "응시 가능"으로 변경되면 응시하실 수 있습니다.',
  },
  already_completed: {
    title: '이미 제출한 시험입니다',
    description: '결과 조회 페이지에서 시험 결과를 확인해주세요.',
  },
  before_exam: {
    title: '아직 시험 시작 전입니다',
    description: '시험 시작 시각까지 기다려주세요.',
  },
  after_exam: {
    title: '시험 시간이 아닙니다',
    description: '응시 가능한 시험 시간이 종료되었습니다.\n결과 발표를 기다려주세요.',
  },
  no_exam_schedule: {
    title: '시험 일정 정보를 찾을 수 없습니다',
    description: '관리자에게 문의해주세요.',
  },
}

// ─────────────────────────────────────────────────────────────
// 날짜 포맷 헬퍼 (서버에서만 사용 — ko-KR)
// ─────────────────────────────────────────────────────────────
function fmtDateTime(iso: string): string {
  return new Date(iso).toLocaleString('ko-KR', {
    year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}
function fmtTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('ko-KR', {
    hour: '2-digit', minute: '2-digit',
  })
}

// ─────────────────────────────────────────────────────────────
// 핵심 함수: checkExamAccess
// ─────────────────────────────────────────────────────────────

/**
 * 신청 건에 대해 시험 응시 가능 여부를 판단합니다.
 *
 * 검증 순서:
 *   1. 신청 내역 존재 여부
 *   2. status 체크  → not_approved | already_completed
 *   3. 시험 일정 존재 여부
 *   4. 현재 시각 vs [exam_start_at, exam_end_at]
 *   5. 모두 통과 → AccessGranted
 */
export function checkExamAccess(
  application: ApplicationWithExam | null | undefined,
  now: Date = new Date()
): AccessResult {

  // ── 1. 신청 내역 없음 ────────────────────────────────────────
  if (!application) {
    return { granted: false, reason: 'no_application', ...BASE_MESSAGE.no_application }
  }

  const { status } = application

  // ── 2-a. 이미 시험 완료 ──────────────────────────────────────
  if (
    status === 'exam_completed' ||
    status === 'passed' ||
    status === 'failed' ||
    status === 'certificate_ready'
  ) {
    return { granted: false, reason: 'already_completed', ...BASE_MESSAGE.already_completed }
  }

  // ── 2-b. 미승인 (입금 대기) ──────────────────────────────────
  if (status === 'waiting_payment') {
    return { granted: false, reason: 'not_approved', ...BASE_MESSAGE.not_approved }
  }

  // ── 3. 시험 일정 정보 없음 ────────────────────────────────────
  const exam = application.exam
  if (!exam?.exam_start_at || !exam?.exam_end_at) {
    return { granted: false, reason: 'no_exam_schedule', ...BASE_MESSAGE.no_exam_schedule }
  }

  const startAt  = new Date(exam.exam_start_at)
  const endAt    = new Date(exam.exam_end_at)
  const nowMs    = now.getTime()

  // ── 4-a. 시험 시작 전 ────────────────────────────────────────
  if (nowMs < startAt.getTime()) {
    const msUntilStart = startAt.getTime() - nowMs
    return {
      granted: false,
      reason: 'before_exam',
      title: BASE_MESSAGE.before_exam.title,
      description:
        `시험 시작: ${fmtDateTime(exam.exam_start_at)}\n` +
        `시험 종료: ${fmtDateTime(exam.exam_end_at)}\n` +
        BASE_MESSAGE.before_exam.description,
      msUntilStart,
      examStartAt: exam.exam_start_at,
      examEndAt: exam.exam_end_at,
      examStartAtFormatted: fmtDateTime(exam.exam_start_at),
      examEndAtFormatted:   fmtDateTime(exam.exam_end_at),
    }
  }

  // ── 4-b. 시험 시간 종료 ───────────────────────────────────────
  if (nowMs > endAt.getTime()) {
    return {
      granted: false,
      reason: 'after_exam',
      title: BASE_MESSAGE.after_exam.title,
      description:
        `응시 시간: ${fmtTime(exam.exam_start_at)} ~ ${fmtTime(exam.exam_end_at)}\n` +
        BASE_MESSAGE.after_exam.description,
      examEndAt: exam.exam_end_at,
      examStartAtFormatted: fmtDateTime(exam.exam_start_at),
      examEndAtFormatted:   fmtDateTime(exam.exam_end_at),
    }
  }

  // ── 5. 접근 허용 ─────────────────────────────────────────────
  return {
    granted: true,
    msUntilEnd: endAt.getTime() - nowMs,
    examEndAt: exam.exam_end_at,
  }
}

// ─────────────────────────────────────────────────────────────
// 타입 가드
// ─────────────────────────────────────────────────────────────
export function isAccessGranted(r: AccessResult): r is AccessGranted { return r.granted === true }
export function isAccessDenied(r: AccessResult): r is AccessDenied   { return r.granted === false }

// ─────────────────────────────────────────────────────────────
// 남은 시간 계산 (ExamTakeClient 타이머 초기값)
// ─────────────────────────────────────────────────────────────

/**
 * exam_end_at 과 duration_minutes 중 더 작은 값을 초 단위로 반환합니다.
 * 응시자가 시험 중간에 입장했을 때 실제 남은 시간을 정확히 계산합니다.
 */
export function calcRemainingSeconds(
  application: ApplicationWithExam,
  now: Date = new Date()
): number {
  const durationSec = (application.exam?.duration_minutes ?? 60) * 60
  const endAt = application.exam?.exam_end_at
    ? new Date(application.exam.exam_end_at)
    : null

  if (!endAt) return durationSec

  const remainByEndAt = Math.max(
    0,
    Math.ceil((endAt.getTime() - now.getTime()) / 1000)
  )

  // 시험 종료까지 남은 시간과 제한 시간 중 작은 값
  return Math.min(durationSec, remainByEndAt)
}

// ═════════════════════════════════════════════════════════════
// 결과 공개 판정
// ═════════════════════════════════════════════════════════════

export type ResultVisibility =
  | 'pending_submission'
  | 'pending_release'
  | 'released'

export interface ResultVisibilityInfo {
  visibility: ResultVisibility
  releasedAt: Date | null
  msUntilRelease: number | null
}

/**
 * passed / failed / certificate_ready → 즉시 공개
 * exam_completed                       → result_released_at 기준
 */
export function checkResultVisibility(
  application: ApplicationWithExam,
  now: Date = new Date()
): ResultVisibilityInfo {
  const { status } = application

  const SUBMITTED: ApplicationWithExam['status'][] = [
    'exam_completed', 'passed', 'failed', 'certificate_ready',
  ]
  if (!SUBMITTED.includes(status)) {
    return { visibility: 'pending_submission', releasedAt: null, msUntilRelease: null }
  }

  // 자동 채점으로 즉시 판정된 경우 → 바로 공개
  if (status === 'passed' || status === 'failed' || status === 'certificate_ready') {
    const releasedAt = application.result_notified_at
      ? new Date(application.result_notified_at)
      : now
    return { visibility: 'released', releasedAt, msUntilRelease: null }
  }

  // exam_completed → result_released_at 기준
  const releasedAt = application.exam?.result_released_at
    ? new Date(application.exam.result_released_at)
    : null

  if (!releasedAt || now.getTime() < releasedAt.getTime()) {
    return {
      visibility: 'pending_release',
      releasedAt,
      msUntilRelease: releasedAt ? releasedAt.getTime() - now.getTime() : null,
    }
  }

  return { visibility: 'released', releasedAt, msUntilRelease: null }
}
