/**
 * 시험 응시 페이지 접근 제한 로직
 *
 * 접근 가능 조건 (AND)
 *   1. 신청 상태가 'approved' 일 것
 *   2. 현재 시각이 exam_start_at ~ exam_end_at 사이일 것
 */

import type { ApplicationWithExam } from '@/types'

// ─────────────────────────────────────────────────────────────
// 결과 타입
// ─────────────────────────────────────────────────────────────

/** 접근 허용 */
interface AccessGranted {
  granted: true
  /** 시험 마감까지 남은 밀리초 (클라이언트 타이머 보정용) */
  msUntilEnd: number
}

/** 접근 거절 사유 */
export type AccessDenyReason =
  | 'no_application'      // 신청 내역 없음
  | 'not_approved'        // 입금 미확인 (waiting_payment 등)
  | 'already_completed'   // 이미 제출 완료
  | 'before_exam'         // 아직 시험 시작 전
  | 'after_exam'          // 시험 종료 후
  | 'no_exam_schedule'    // 시험 일정 정보 없음

interface AccessDenied {
  granted: false
  reason: AccessDenyReason
  /** 사용자에게 보여줄 제목 */
  title: string
  /** 사용자에게 보여줄 설명 */
  description: string
  /** 시험 시작까지 남은 밀리초 (before_exam 일 때만) */
  msUntilStart?: number
}

export type AccessResult = AccessGranted | AccessDenied

// ─────────────────────────────────────────────────────────────
// 접근 제한 사유별 메시지 맵
// ─────────────────────────────────────────────────────────────
const DENY_MESSAGE: Record<
  AccessDenyReason,
  { title: string; description: string }
> = {
  no_application: {
    title: '시험 신청 내역이 없습니다',
    description: '시험 신청 페이지에서 원하는 시험에 신청해주세요.',
  },
  not_approved: {
    title: '입금 확인이 필요합니다',
    description:
      '응시료 입금 후 관리자 확인이 완료되어야 시험에 응시할 수 있습니다.\n' +
      '계좌: 국민은행 000-0000-0000-00 (예금주: 자격증센터)',
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
    title: '시험 시간이 종료되었습니다',
    description: '시험 응시 가능 시간이 지났습니다. 결과 발표를 기다려주세요.',
  },
  no_exam_schedule: {
    title: '시험 일정 정보를 찾을 수 없습니다',
    description: '관리자에게 문의해주세요.',
  },
}

// ─────────────────────────────────────────────────────────────
// 핵심 함수
// ─────────────────────────────────────────────────────────────

/**
 * 주어진 신청 건에 대해 시험 응시 접근 가능 여부를 판단합니다.
 *
 * @param application  exam:exams 를 포함한 신청 건 (null 허용)
 * @param now          현재 시각 (테스트 주입용, 기본값 new Date())
 */
export function checkExamAccess(
  application: ApplicationWithExam | null | undefined,
  now: Date = new Date()
): AccessResult {
  // ── 1. 신청 내역 없음 ────────────────────────────────────────
  if (!application) {
    const msg = DENY_MESSAGE.no_application
    return { granted: false, reason: 'no_application', ...msg }
  }

  // ── 2. 상태 체크 ────────────────────────────────────────────
  const { status } = application

  if (status === 'exam_completed') {
    const msg = DENY_MESSAGE.already_completed
    return { granted: false, reason: 'already_completed', ...msg }
  }

  if (
    status === 'waiting_payment' ||
    status === 'passed' ||
    status === 'failed' ||
    status === 'certificate_ready'
  ) {
    const msg = DENY_MESSAGE.not_approved
    return { granted: false, reason: 'not_approved', ...msg }
  }

  // ── 3. 시험 일정 정보 없음 ─────────────────────────────────
  const exam = application.exam
  if (!exam?.exam_start_at || !exam?.exam_end_at) {
    const msg = DENY_MESSAGE.no_exam_schedule
    return { granted: false, reason: 'no_exam_schedule', ...msg }
  }

  const startAt = new Date(exam.exam_start_at)
  const endAt   = new Date(exam.exam_end_at)
  const nowMs   = now.getTime()

  // ── 4. 시험 시작 전 ─────────────────────────────────────────
  if (nowMs < startAt.getTime()) {
    const msg = DENY_MESSAGE.before_exam
    return {
      granted: false,
      reason: 'before_exam',
      ...msg,
      description:
        `시험 시작: ${startAt.toLocaleString('ko-KR', {
          year:   'numeric',
          month:  'long',
          day:    'numeric',
          hour:   '2-digit',
          minute: '2-digit',
        })}\n${msg.description}`,
      msUntilStart: startAt.getTime() - nowMs,
    }
  }

  // ── 5. 시험 종료 후 ─────────────────────────────────────────
  if (nowMs > endAt.getTime()) {
    const msg = DENY_MESSAGE.after_exam
    return { granted: false, reason: 'after_exam', ...msg }
  }

  // ── 6. 접근 허용 ─────────────────────────────────────────────
  return {
    granted: true,
    msUntilEnd: endAt.getTime() - nowMs,
  }
}

// ─────────────────────────────────────────────────────────────
// 헬퍼 타입 가드
// ─────────────────────────────────────────────────────────────

export function isAccessGranted(result: AccessResult): result is AccessGranted {
  return result.granted === true
}

export function isAccessDenied(result: AccessResult): result is AccessDenied {
  return result.granted === false
}

// ─────────────────────────────────────────────────────────────
// 남은 시간 계산 헬퍼 (ExamTakeClient 타이머 초기값용)
// ─────────────────────────────────────────────────────────────

/**
 * 시험 종료 시각 기준 남은 초를 반환합니다.
 * duration_minutes 와 exam_end_at 중 더 작은 값을 사용합니다.
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

  // 시험 종료 시각 기준 남은 시간과 duration 중 작은 값
  return Math.min(durationSec, remainByEndAt)
}
