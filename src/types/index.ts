/**
 * 타입 통합 re-export
 * 앱 내 어디서든 `import { ... } from '@/types'` 로 사용
 */

// DB 스키마 타입 전체 re-export
export * from './database'

// ──────────────────────────────────────────────────────────────
// UI 전용 상수 (컴포넌트에서 직접 사용)
// ──────────────────────────────────────────────────────────────
import type { ApplicationStatus } from './database'

/** 상태값 → 한글 라벨 */
export const STATUS_LABEL: Record<ApplicationStatus, string> = {
  waiting_payment:   '확인 대기',
  approved:          '응시 가능',
  exam_completed:    '채점 중',
  passed:            '합격',
  failed:            '불합격',
  certificate_ready: '자격증 발급',
}

/** 상태값 → Tailwind 색상 클래스 */
export const STATUS_COLOR: Record<ApplicationStatus, string> = {
  waiting_payment:   'bg-yellow-100 text-yellow-800 border-yellow-200',
  approved:          'bg-blue-100   text-blue-800   border-blue-200',
  exam_completed:    'bg-purple-100 text-purple-800 border-purple-200',
  passed:            'bg-green-100  text-green-800  border-green-200',
  failed:            'bg-red-100    text-red-800    border-red-200',
  certificate_ready: 'bg-emerald-100 text-emerald-800 border-emerald-200',
}

/** 상태 흐름 순서 (스텝퍼 UI용, failed 는 passed 위치와 동일)
 * - waiting_payment 는 즉시 approved 로 전환되므로 UI에서 제외
 * - exam_completed 는 자동채점으로 바로 passed/failed 로 전환되므로 UI에서 제외
 */
export const STATUS_FLOW: ApplicationStatus[] = [
  'approved',
  'passed',
  'certificate_ready',
]

/** 상태에서 이동 가능한 다음 상태 맵 (관리자용) */
export const NEXT_STATUS_MAP: Partial<Record<ApplicationStatus, ApplicationStatus[]>> = {
  waiting_payment:   ['approved'],
  exam_completed:    ['passed', 'failed'],
  passed:            ['certificate_ready'],
}
