/**
 * Supabase 쿼리 헬퍼 모음
 *
 * 실제 Supabase 프로젝트 연결 후에는
 *   npx supabase gen types typescript --project-id <ID> > src/types/database.ts
 * 로 타입을 재생성하면 any 단언 없이 완전한 타입 추론이 가능합니다.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
import type {
  ApplicationStatus,
  ApplicationWithExam,
  ApplicationWithRelations,
  ExamApplicationUpdate,
} from '@/types/database'

type AnySupabase = any

// ══════════════════════════════════════════════════════════════
// users
// ══════════════════════════════════════════════════════════════

export async function getMyProfile(supabase: AnySupabase) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single()
  return data
}

export async function getAllUsers(supabase: AnySupabase) {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

// ══════════════════════════════════════════════════════════════
// exams
// ══════════════════════════════════════════════════════════════

/** 접수 기간 중인 활성 시험 목록 */
export async function getActiveExams(supabase: AnySupabase) {
  const now = new Date().toISOString()
  const { data, error } = await supabase
    .from('exams')
    .select('*')
    .eq('is_active', true)
    .lte('registration_start_at', now)
    .gte('registration_end_at', now)
    .order('exam_start_at', { ascending: true })
  if (error) throw error
  return data ?? []
}

export async function getAllExams(supabase: AnySupabase) {
  const { data, error } = await supabase
    .from('exams')
    .select('*')
    .order('exam_start_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function getExamById(supabase: AnySupabase, examId: string) {
  const { data, error } = await supabase
    .from('exams')
    .select('*')
    .eq('id', examId)
    .single()
  if (error) throw error
  return data
}

// ══════════════════════════════════════════════════════════════
// exam_applications
// ══════════════════════════════════════════════════════════════

export async function getMyApplications(supabase: AnySupabase): Promise<ApplicationWithExam[]> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data, error } = await supabase
    .from('exam_applications')
    .select('*, exam:exams(*)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as ApplicationWithExam[]
}

export async function getMyLatestApplication(supabase: AnySupabase): Promise<ApplicationWithExam | null> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data } = await supabase
    .from('exam_applications')
    .select('*, exam:exams(*)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()
  return (data ?? null) as ApplicationWithExam | null
}

export async function getMyApplicationByStatus(
  supabase: AnySupabase,
  status: ApplicationStatus
): Promise<ApplicationWithExam | null> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data } = await supabase
    .from('exam_applications')
    .select('*, exam:exams(*)')
    .eq('user_id', user.id)
    .eq('status', status)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()
  return (data ?? null) as ApplicationWithExam | null
}

export async function getAllApplications(
  supabase: AnySupabase,
  status?: ApplicationStatus
): Promise<ApplicationWithRelations[]> {
  let query = supabase
    .from('exam_applications')
    .select('*, user:users(*), exam:exams(*), certificate:certificates(*)')
    .order('created_at', { ascending: false })

  if (status) query = query.eq('status', status)

  const { data, error } = await query
  if (error) throw error
  return (data ?? []) as ApplicationWithRelations[]
}

export async function applyForExam(supabase: AnySupabase, examId: string) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('로그인이 필요합니다.')

  const { data, error } = await supabase
    .from('exam_applications')
    .insert({ user_id: user.id, exam_id: examId, status: 'waiting_payment' })
    .select()
    .single()

  if (error) {
    if (error.code === '23505') throw new Error('이미 신청한 시험입니다.')
    throw error
  }
  return data
}

export async function updateApplicationStatus(
  supabase: AnySupabase,
  applicationId: string,
  update: ExamApplicationUpdate
) {
  const { data, error } = await supabase
    .from('exam_applications')
    .update(update)
    .eq('id', applicationId)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function confirmPayment(supabase: AnySupabase, applicationId: string) {
  return updateApplicationStatus(supabase, applicationId, {
    status: 'approved',
    payment_confirmed_at: new Date().toISOString(),
  })
}

export async function releaseResult(
  supabase: AnySupabase,
  applicationId: string,
  score: number,
  passingScore: number
) {
  const passed = score >= passingScore
  return updateApplicationStatus(supabase, applicationId, {
    status: passed ? 'passed' : 'failed',
    score,
    result_notified_at: new Date().toISOString(),
  })
}

// ══════════════════════════════════════════════════════════════
// questions
// ══════════════════════════════════════════════════════════════

export async function getQuestionsByExam(supabase: AnySupabase, examId: string) {
  const { data, error } = await supabase
    .from('questions')
    .select('*')
    .eq('exam_id', examId)
    .eq('is_active', true)
    .order('order_num', { ascending: true })
  if (error) throw error
  return data ?? []
}

// ══════════════════════════════════════════════════════════════
// submissions
// ══════════════════════════════════════════════════════════════

export async function upsertSubmissions(
  supabase: AnySupabase,
  applicationId: string,
  answers: Record<string, string | null>
) {
  const rows = Object.entries(answers).map(([question_id, selected_answer]) => ({
    application_id: applicationId,
    question_id,
    selected_answer,
  }))

  const { data, error } = await supabase
    .from('submissions')
    .upsert(rows, { onConflict: 'application_id,question_id' })
    .select()
  if (error) throw error
  return data
}

export async function getMySubmissions(supabase: AnySupabase, applicationId: string) {
  const { data, error } = await supabase
    .from('submissions')
    .select('*')
    .eq('application_id', applicationId)
  if (error) throw error
  return data ?? []
}

// ══════════════════════════════════════════════════════════════
// certificates
// ══════════════════════════════════════════════════════════════

export async function getMyCertificates(supabase: AnySupabase) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data, error } = await supabase
    .from('certificates')
    .select(`
      *,
      application:exam_applications(
        score,
        exam:exams(title, exam_start_at, passing_score)
      )
    `)
    .eq('user_id', user.id)
    .order('issued_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function issueCertificate(
  supabase: AnySupabase,
  applicationId: string,
  userId: string
) {
  const { data: cert, error: certError } = await supabase
    .from('certificates')
    .insert({
      application_id: applicationId,
      user_id: userId,
      // certificate_number 는 DB 트리거가 자동 채번
    })
    .select()
    .single()
  if (certError) throw certError

  await updateApplicationStatus(supabase, applicationId, {
    status: 'certificate_ready',
    certificate_issued_at: new Date().toISOString(),
  })

  return cert
}

export async function getAllCertificates(supabase: AnySupabase) {
  const { data, error } = await supabase
    .from('certificates')
    .select(`
      *,
      user:users(full_name, email),
      application:exam_applications(
        score,
        exam:exams(title)
      )
    `)
    .order('issued_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

// ══════════════════════════════════════════════════════════════
// 통계 (관리자 대시보드)
// ══════════════════════════════════════════════════════════════

export async function getDashboardStats(supabase: AnySupabase) {
  const [
    { count: totalUsers },
    { count: totalApplications },
    { count: waitingPayment },
    { count: approved },
    { count: examCompleted },
    { count: passed },
    { count: failed },
    { count: certReady },
  ] = await Promise.all([
    supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'user'),
    supabase.from('exam_applications').select('*', { count: 'exact', head: true }),
    supabase.from('exam_applications').select('*', { count: 'exact', head: true }).eq('status', 'waiting_payment'),
    supabase.from('exam_applications').select('*', { count: 'exact', head: true }).eq('status', 'approved'),
    supabase.from('exam_applications').select('*', { count: 'exact', head: true }).eq('status', 'exam_completed'),
    supabase.from('exam_applications').select('*', { count: 'exact', head: true }).eq('status', 'passed'),
    supabase.from('exam_applications').select('*', { count: 'exact', head: true }).eq('status', 'failed'),
    supabase.from('certificates').select('*', { count: 'exact', head: true }),
  ])

  return {
    totalUsers:        totalUsers        ?? 0,
    totalApplications: totalApplications ?? 0,
    waitingPayment:    waitingPayment    ?? 0,
    approved:          approved          ?? 0,
    examCompleted:     examCompleted     ?? 0,
    passed:            passed            ?? 0,
    failed:            failed            ?? 0,
    certReady:         certReady         ?? 0,
  }
}
