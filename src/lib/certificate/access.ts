/**
 * 자격증 다운로드 접근 제한 로직
 *
 * 다운로드 가능 조건 (AND)
 *   1. 신청 상태가 'certificate_ready' 일 것  (합격자 발급 완료)
 *   2. exams.certificate_issued_at 이 설정되어 있고 현재 시각 이후일 것
 */

import type { CertificateRow, ExamRow, UserRow, ExamApplicationRow } from '@/types'

// ─────────────────────────────────────────────────────────────
// 통합 데이터 타입
// ─────────────────────────────────────────────────────────────

/** 페이지 렌더링·PDF 생성에 필요한 자격증 전체 정보 */
export interface CertificateData {
  // certificates 테이블
  cert: CertificateRow
  // 조인된 사용자 정보
  user: Pick<UserRow, 'full_name' | 'email'>
  // 조인된 신청 정보
  application: Pick<ExamApplicationRow, 'id' | 'status' | 'score' | 'certificate_issued_at'>
  // 조인된 시험 정보
  exam: Pick<
    ExamRow,
    'title' | 'exam_start_at' | 'passing_score' | 'certificate_issued_at'
  >
}

// ─────────────────────────────────────────────────────────────
// 접근 제한 결과 타입
// ─────────────────────────────────────────────────────────────

export type CertAccessReason =
  | 'not_passed'          // 합격 상태 아님
  | 'not_issued'          // 관리자가 아직 발급 처리 안 함
  | 'before_issue_date'   // 발급 예정일 이전
  | 'granted'             // 다운로드 가능

export interface CertAccessResult {
  reason: CertAccessReason
  /** 발급 가능 시각 (before_issue_date 일 때만) */
  issuedAt: Date | null
  /** 발급 예정까지 남은 밀리초 */
  msUntilIssue: number | null
  /** 사용자에게 보여줄 제목 */
  title: string
  /** 사용자에게 보여줄 설명 */
  description: string
}

// ─────────────────────────────────────────────────────────────
// 메시지 맵
// ─────────────────────────────────────────────────────────────

const MESSAGE: Record<Exclude<CertAccessReason, 'granted'>, { title: string; description: string }> = {
  not_passed: {
    title: '자격증을 발급받을 수 없습니다',
    description: '시험 합격 후 관리자 발급 처리가 완료되어야 자격증을 다운로드할 수 있습니다.',
  },
  not_issued: {
    title: '자격증 발급 처리 중입니다',
    description: '관리자가 자격증 발급을 처리하고 있습니다. 잠시 후 다시 확인해주세요.',
  },
  before_issue_date: {
    title: '자격증 발급일 이전입니다',
    description: '발급 예정일 이후에 다운로드할 수 있습니다.',
  },
}

// ─────────────────────────────────────────────────────────────
// 핵심 판정 함수
// ─────────────────────────────────────────────────────────────

/**
 * 자격증 다운로드 가능 여부를 판정합니다.
 *
 * @param data  CertificateData (cert + application + exam 포함)
 * @param now   현재 시각 (테스트 주입용)
 */
export function checkCertAccess(
  data: CertificateData,
  now: Date = new Date()
): CertAccessResult {
  // 1. 합격 상태 확인
  if (data.application.status !== 'certificate_ready') {
    return {
      reason: 'not_passed',
      issuedAt: null,
      msUntilIssue: null,
      ...MESSAGE.not_passed,
    }
  }

  // 2. certificates 레코드 존재 확인 (관리자 발급 여부)
  if (!data.cert.id) {
    return {
      reason: 'not_issued',
      issuedAt: null,
      msUntilIssue: null,
      ...MESSAGE.not_issued,
    }
  }

  // 3. exams.certificate_issued_at 기준 발급일 확인
  //    NULL → 날짜 제한 없음(즉시 허용)
  const issueDateRaw = data.exam.certificate_issued_at
  if (issueDateRaw) {
    const issueDate = new Date(issueDateRaw)
    if (now.getTime() < issueDate.getTime()) {
      return {
        reason: 'before_issue_date',
        issuedAt: issueDate,
        msUntilIssue: issueDate.getTime() - now.getTime(),
        ...MESSAGE.before_issue_date,
        description: `발급 예정일: ${issueDate.toLocaleString('ko-KR', {
          year: 'numeric', month: 'long', day: 'numeric',
          hour: '2-digit', minute: '2-digit',
        })}\n${MESSAGE.before_issue_date.description}`,
      }
    }
  }

  // 4. 허용
  return {
    reason: 'granted',
    issuedAt: issueDateRaw ? new Date(issueDateRaw) : null,
    msUntilIssue: null,
    title: '',
    description: '',
  }
}
