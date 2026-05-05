'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { sendCertificateEmail } from '@/lib/email/sendCertificateEmail'

// ────────────────────────────────────────────────
// 시험 신청
// ────────────────────────────────────────────────
export async function applyForExamAction(examId: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // 이미 신청 여부 확인
  const { data: existing } = await (supabase as any)
    .from('exam_applications')
    .select('id')
    .eq('user_id', user.id)
    .eq('exam_id', examId)
    .maybeSingle()

  if (existing) {
    return { error: '이미 신청한 시험입니다.' }
  }

  // 응시료가 없으므로 신청 즉시 approved 상태로 저장
  const { data, error } = await (supabase as any)
    .from('exam_applications')
    .insert({
      user_id: user.id,
      exam_id: examId,
      status: 'approved',
      payment_confirmed_at: new Date().toISOString(),
    })
    .select(`*, exam:exams(title, fee, exam_start_at, exam_end_at)`)
    .single()

  if (error) {
    if (error.code === '23505') {
      return { error: '이미 신청한 시험입니다.' }
    }
    return { error: '신청에 실패했습니다. 다시 시도해주세요.' }
  }

  revalidatePath('/exam/apply')
  revalidatePath('/dashboard')

  return { success: true, application: data }
}

// ────────────────────────────────────────────────
// 입금 확인 (관리자)
// ────────────────────────────────────────────────
export async function confirmPaymentAction(applicationId: string) {
  const supabase = await createClient()

  // 관리자 권한 확인
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: '인증이 필요합니다.' }

  const { data: profile } = await (supabase as any)
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'admin') {
    return { error: '관리자만 접근 가능합니다.' }
  }

  const { data, error } = await (supabase as any)
    .from('exam_applications')
    .update({
      status: 'approved',
      payment_confirmed_at: new Date().toISOString(),
    })
    .eq('id', applicationId)
    .select(`*, user:users(full_name, email), exam:exams(title)`)
    .single()

  if (error) {
    return { error: '처리 중 오류가 발생했습니다.' }
  }

  revalidatePath('/admin/applications')
  revalidatePath('/dashboard')

  return { success: true, application: data }
}

// ────────────────────────────────────────────────
// 결과 처리 (관리자)
// ────────────────────────────────────────────────
export async function releaseResultAction(
  applicationId: string,
  score: number,
  passingScore: number
) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: '인증이 필요합니다.' }

  const { data: profile } = await (supabase as any)
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'admin') {
    return { error: '관리자만 접근 가능합니다.' }
  }

  const passed = score >= passingScore
  const { data, error } = await (supabase as any)
    .from('exam_applications')
    .update({
      status: passed ? 'passed' : 'failed',
      score,
      result_notified_at: new Date().toISOString(),
    })
    .eq('id', applicationId)
    .select()
    .single()

  if (error) {
    return { error: '처리 중 오류가 발생했습니다.' }
  }

  revalidatePath('/admin/applications')
  revalidatePath('/dashboard')
  revalidatePath('/exam/result')

  return { success: true, application: data, passed }
}

// ────────────────────────────────────────────────
// 자격증 발급 (관리자)
// ────────────────────────────────────────────────
export async function issueCertificateAction(applicationId: string, userId: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: '인증이 필요합니다.' }

  const { data: profile } = await (supabase as any)
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'admin') {
    return { error: '관리자만 접근 가능합니다.' }
  }

  // 이미 발급된 자격증 확인
  const { data: existing } = await (supabase as any)
    .from('certificates')
    .select('id')
    .eq('application_id', applicationId)
    .maybeSingle()

  if (existing) {
    return { error: '이미 발급된 자격증이 있습니다.' }
  }

  const { data: cert, error: certError } = await (supabase as any)
    .from('certificates')
    .insert({
      application_id: applicationId,
      user_id: userId,
    })
    .select()
    .single()

  if (certError) {
    return { error: '자격증 발급 중 오류가 발생했습니다.' }
  }

  const nowIso = new Date().toISOString()

  await (supabase as any)
    .from('exam_applications')
    .update({
      status: 'certificate_ready',
      certificate_issued_at: nowIso,
    })
    .eq('id', applicationId)

  // ── 자격증 발급 직후 이메일 자동 발송 ──────────────────────────
  try {
    // 합격자 이메일·이름 조회
    const { data: userProfile } = await (supabase as any)
      .from('users')
      .select('full_name, email')
      .eq('id', userId)
      .single()

    // 시험 제목·점수 조회
    const { data: appInfo } = await (supabase as any)
      .from('exam_applications')
      .select('score, exam:exams(title)')
      .eq('id', applicationId)
      .single()

    if (userProfile?.email && cert?.certificate_number) {
      await sendCertificateEmail({
        toEmail:           userProfile.email,
        recipientName:     userProfile.full_name ?? '합격자',
        examTitle:         appInfo?.exam?.title ?? '자격증 시험',
        certificateNumber: cert.certificate_number,
        score:             appInfo?.score ?? 0,
        issuedAt:          nowIso,
      })
    }
  } catch (emailErr) {
    // 이메일 실패가 자격증 발급 결과에 영향 주지 않도록 catch
    console.error('[issueCertificate] 이메일 자동 발송 실패:', emailErr)
  }

  revalidatePath('/admin/applications')
  revalidatePath('/admin/certificates')
  revalidatePath('/certificate')
  revalidatePath('/dashboard')

  return { success: true, certificate: cert }
}
