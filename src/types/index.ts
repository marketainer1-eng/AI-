// ============================================================
// 공통 상태값 (시험 신청 → 자격증 발급 흐름)
// ============================================================
export type ExamStatus =
  | 'waiting_payment'   // 입금 대기 중
  | 'approved'          // 입금 확인 → 시험 응시 가능
  | 'exam_completed'    // 시험 응시 완료 (채점 대기)
  | 'passed'            // 합격
  | 'failed'            // 불합격
  | 'certificate_ready' // 자격증 발급 완료

// 상태 라벨 매핑
export const EXAM_STATUS_LABEL: Record<ExamStatus, string> = {
  waiting_payment: '입금 대기',
  approved: '응시 가능',
  exam_completed: '채점 중',
  passed: '합격',
  failed: '불합격',
  certificate_ready: '자격증 발급',
}

// 상태 색상 매핑 (Tailwind 클래스)
export const EXAM_STATUS_COLOR: Record<ExamStatus, string> = {
  waiting_payment: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-blue-100 text-blue-800',
  exam_completed: 'bg-purple-100 text-purple-800',
  passed: 'bg-green-100 text-green-800',
  failed: 'bg-red-100 text-red-800',
  certificate_ready: 'bg-emerald-100 text-emerald-800',
}

// 상태 흐름 순서
export const EXAM_STATUS_FLOW: ExamStatus[] = [
  'waiting_payment',
  'approved',
  'exam_completed',
  'passed',
  'certificate_ready',
]

// ============================================================
// 사용자 역할
// ============================================================
export type UserRole = 'user' | 'admin'

// ============================================================
// DB 테이블 타입 (Supabase 스키마와 1:1 매핑)
// ============================================================

/** profiles 테이블 */
export interface Profile {
  id: string             // auth.users.id (UUID)
  email: string
  full_name: string
  phone: string | null
  role: UserRole
  created_at: string
  updated_at: string
}

/** exams 테이블 (시험 종류/회차) */
export interface Exam {
  id: string
  title: string          // 예: "2024년 1회 자격증 시험"
  description: string | null
  exam_date: string      // ISO Date
  duration_minutes: number
  passing_score: number  // 합격 기준 점수 (0~100)
  fee: number            // 응시료 (원)
  is_active: boolean
  created_at: string
}

/** exam_applications 테이블 (시험 신청) */
export interface ExamApplication {
  id: string
  user_id: string
  exam_id: string
  status: ExamStatus
  score: number | null
  payment_confirmed_at: string | null
  exam_completed_at: string | null
  result_released_at: string | null
  certificate_issued_at: string | null
  created_at: string
  updated_at: string
  // 조인 데이터
  exam?: Exam
  profile?: Profile
}

/** exam_questions 테이블 (시험 문제) */
export interface ExamQuestion {
  id: string
  exam_id: string
  question_text: string
  options: string[]       // JSON 배열 ["①...", "②...", "③...", "④..."]
  correct_answer: number  // 정답 인덱스 (0-based)
  order_num: number
}

/** exam_answers 테이블 (응시자 답안) */
export interface ExamAnswer {
  id: string
  application_id: string
  question_id: string
  selected_answer: number | null
  created_at: string
}

/** certificates 테이블 (발급된 자격증) */
export interface Certificate {
  id: string
  application_id: string
  user_id: string
  certificate_number: string   // 자격증 고유번호
  issued_at: string
  pdf_url: string | null
  // 조인 데이터
  application?: ExamApplication
  profile?: Profile
}

// ============================================================
// API 응답 타입
// ============================================================
export interface ApiResponse<T = unknown> {
  data: T | null
  error: string | null
}

// ============================================================
// 폼 데이터 타입
// ============================================================
export interface SignUpFormData {
  email: string
  password: string
  full_name: string
  phone: string
}

export interface LoginFormData {
  email: string
  password: string
}

export interface ExamApplicationFormData {
  exam_id: string
  agreed_to_terms: boolean
}
