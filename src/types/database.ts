/**
 * Supabase 스키마와 1:1 대응하는 Database 타입 정의
 * (supabase gen types 명령으로 자동 생성 가능하지만 여기서는 수동 관리)
 *
 * 실제 프로젝트에서는:
 *   npx supabase gen types typescript --project-id <id> > src/types/database.ts
 * 로 덮어씌워 사용하세요.
 */

// ──────────────────────────────────────────────────────────────
// ENUM 타입
// ──────────────────────────────────────────────────────────────

/** 시험 신청 상태 흐름 */
export type ApplicationStatus =
  | 'waiting_payment'   // 신청 완료, 입금 대기
  | 'approved'          // 입금 확인, 응시 가능
  | 'exam_completed'    // 시험 제출 완료, 채점 대기
  | 'passed'            // 합격
  | 'failed'            // 불합격
  | 'certificate_ready' // 자격증 발급 완료

/** 문제 유형 */
export type QuestionType =
  | 'multiple_choice'   // 객관식
  | 'true_false'        // O/X
  | 'short_answer'      // 단답형

/** 사용자 역할 */
export type UserRole = 'user' | 'admin'

// ──────────────────────────────────────────────────────────────
// 테이블 Row 타입 (SELECT 결과)
// ──────────────────────────────────────────────────────────────

export interface UserRow {
  id: string
  email: string
  full_name: string
  phone: string | null
  role: UserRole
  created_at: string
  updated_at: string
}

export interface ExamRow {
  id: string
  title: string
  description: string | null
  registration_start_at: string
  registration_end_at: string
  exam_start_at: string
  exam_end_at: string
  result_released_at: string | null
  certificate_issued_at: string | null
  duration_minutes: number
  passing_score: number
  fee: number
  max_applicants: number | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface ExamApplicationRow {
  id: string
  user_id: string
  exam_id: string
  status: ApplicationStatus
  score: number | null
  payment_confirmed_at: string | null
  exam_started_at: string | null
  exam_submitted_at: string | null
  result_notified_at: string | null
  certificate_issued_at: string | null
  memo: string | null
  created_at: string
  updated_at: string
}

export interface QuestionRow {
  id: string
  exam_id: string
  question_type: QuestionType
  question_text: string
  options: string[] | null      // JSONB → 파싱된 배열
  correct_answer: string
  explanation: string | null
  score_weight: number
  order_num: number
  is_active: boolean
  created_at: string
}

export interface SubmissionRow {
  id: string
  application_id: string
  question_id: string
  selected_answer: string | null
  is_correct: boolean | null
  score_earned: number | null
  answered_at: string
}

export interface CertificateRow {
  id: string
  application_id: string
  user_id: string
  certificate_number: string
  issued_at: string
  expires_at: string | null
  pdf_url: string | null
  pdf_storage_path: string | null
  created_at: string
}

// ──────────────────────────────────────────────────────────────
// Insert / Update 타입 (Omit으로 자동 생성 필드 제외)
// ──────────────────────────────────────────────────────────────

export type UserInsert = Omit<UserRow, 'created_at' | 'updated_at'>
export type UserUpdate = Partial<Pick<UserRow, 'full_name' | 'phone' | 'role'>>

export type ExamInsert = Omit<ExamRow, 'id' | 'created_at' | 'updated_at'>
export type ExamUpdate = Partial<Omit<ExamRow, 'id' | 'created_at' | 'updated_at'>>

export type ExamApplicationInsert = Pick<ExamApplicationRow, 'user_id' | 'exam_id'>
export type ExamApplicationUpdate = Partial<
  Pick<
    ExamApplicationRow,
    | 'status'
    | 'score'
    | 'payment_confirmed_at'
    | 'exam_started_at'
    | 'exam_submitted_at'
    | 'result_notified_at'
    | 'certificate_issued_at'
    | 'memo'
  >
>

export type QuestionInsert = Omit<QuestionRow, 'id' | 'created_at'>
export type QuestionUpdate = Partial<Omit<QuestionRow, 'id' | 'exam_id' | 'created_at'>>

export type SubmissionInsert = Pick<
  SubmissionRow,
  'application_id' | 'question_id' | 'selected_answer'
>
export type SubmissionUpdate = Partial<
  Pick<SubmissionRow, 'selected_answer' | 'is_correct' | 'score_earned'>
>

export type CertificateInsert = Omit<CertificateRow, 'id' | 'certificate_number' | 'created_at'>
export type CertificateUpdate = Partial<
  Pick<CertificateRow, 'pdf_url' | 'pdf_storage_path' | 'expires_at'>
>

// ──────────────────────────────────────────────────────────────
// 조인 포함 확장 타입 (컴포넌트에서 직접 사용)
// ──────────────────────────────────────────────────────────────

/** 신청 + 시험 정보 + 사용자 정보 (관리자 뷰) */
export interface ApplicationWithRelations extends ExamApplicationRow {
  user: UserRow
  exam: ExamRow
  certificate: CertificateRow | null
}

/** 신청 + 시험 정보 (사용자 뷰) */
export interface ApplicationWithExam extends ExamApplicationRow {
  exam: ExamRow
}

/** 자격증 + 신청 + 사용자 정보 */
export interface CertificateWithRelations extends CertificateRow {
  application: ApplicationWithExam
  user: UserRow
}

/** v_applications_detail 뷰 타입 */
export interface ApplicationDetailView {
  application_id: string
  status: ApplicationStatus
  score: number | null
  payment_confirmed_at: string | null
  exam_started_at: string | null
  exam_submitted_at: string | null
  result_notified_at: string | null
  app_certificate_issued_at: string | null
  memo: string | null
  applied_at: string
  // user
  user_id: string
  email: string
  full_name: string
  phone: string | null
  // exam
  exam_id: string
  exam_title: string
  exam_start_at: string
  exam_end_at: string
  result_released_at: string | null
  exam_certificate_issued_at: string | null
  passing_score: number
  fee: number
  // certificate
  certificate_number: string | null
  cert_issued_at: string | null
  pdf_url: string | null
}

// ──────────────────────────────────────────────────────────────
// Supabase Database 타입 (createClient<Database>() 에 사용)
// ──────────────────────────────────────────────────────────────
export interface Database {
  public: {
    Tables: {
      users: {
        Row: UserRow
        Insert: UserInsert
        Update: UserUpdate
      }
      exams: {
        Row: ExamRow
        Insert: ExamInsert
        Update: ExamUpdate
      }
      exam_applications: {
        Row: ExamApplicationRow
        Insert: ExamApplicationInsert
        Update: ExamApplicationUpdate
      }
      questions: {
        Row: QuestionRow
        Insert: QuestionInsert
        Update: QuestionUpdate
      }
      submissions: {
        Row: SubmissionRow
        Insert: SubmissionInsert
        Update: SubmissionUpdate
      }
      certificates: {
        Row: CertificateRow
        Insert: CertificateInsert
        Update: CertificateUpdate
      }
    }
    Views: {
      v_applications_detail: {
        Row: ApplicationDetailView
      }
    }
    Enums: {
      application_status: ApplicationStatus
      question_type: QuestionType
    }
  }
}
