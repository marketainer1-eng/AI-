/**
 * 시험 문제 랜덤 선택 유틸
 *
 * 전략:
 *   - application_id를 시드(seed)로 사용 → 사용자마다 다른 문제 순서
 *   - 선택된 문제 ID 배열을 exam_applications.memo(JSON) 에 저장
 *   - 재진입 시 memo에서 읽어 동일 문제 순서 보장
 */

import type { QuestionRow } from '@/types'

// ─── 시드 기반 의사난수 생성기 (Mulberry32) ──────────────────
// 외부 의존성 없이 순수 JS로 결정론적 셔플 구현
function mulberry32(seed: number) {
  return function () {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// 문자열(applicationId)을 숫자 시드로 변환
function strToSeed(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash |= 0  // 32bit int
  }
  return Math.abs(hash)
}

// Fisher-Yates 셔플 (시드 기반)
function seededShuffle<T>(arr: T[], seed: number): T[] {
  const result = [...arr]
  const rand = mulberry32(seed)
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

// ─── 문제 선택 (랜덤 N개, 순서 고정) ────────────────────────
export function selectQuestions(
  allQuestions: QuestionRow[],
  applicationId: string,
  count: number = 25
): QuestionRow[] {
  if (allQuestions.length <= count) {
    // 문제 수가 count 이하면 전체 반환 (셔플만)
    const seed = strToSeed(applicationId)
    return seededShuffle(allQuestions, seed)
  }

  const seed = strToSeed(applicationId)
  const shuffled = seededShuffle(allQuestions, seed)
  return shuffled.slice(0, count)
}

// ─── memo 파싱/생성 헬퍼 ─────────────────────────────────────

/** memo JSON 구조 */
export interface ExamMemo {
  selectedQuestionIds: string[]  // 선택된 문제 ID 배열 (순서 포함)
  selectedAt: string             // 최초 선택 시각 (ISO)
}

/** memo 문자열 → ExamMemo 파싱 */
export function parseMemo(memo: string | null): ExamMemo | null {
  if (!memo) return null
  try {
    const parsed = JSON.parse(memo)
    if (Array.isArray(parsed.selectedQuestionIds)) return parsed as ExamMemo
    return null
  } catch {
    return null
  }
}

/** ExamMemo → memo 문자열 */
export function stringifyMemo(ids: string[]): string {
  const memo: ExamMemo = {
    selectedQuestionIds: ids,
    selectedAt: new Date().toISOString(),
  }
  return JSON.stringify(memo)
}

/**
 * 전체 문제 풀에서 memo에 저장된 ID 순서대로 문제 복원
 * (재진입 시 동일 문제·순서 보장)
 */
export function restoreQuestionsFromMemo(
  allQuestions: QuestionRow[],
  memo: ExamMemo
): QuestionRow[] {
  const map = new Map(allQuestions.map((q) => [q.id, q]))
  return memo.selectedQuestionIds
    .map((id) => map.get(id))
    .filter((q): q is QuestionRow => q !== undefined)
}
