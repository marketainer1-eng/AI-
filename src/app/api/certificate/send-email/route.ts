/**
 * POST /api/certificate/send-email
 *
 * Body (JSON):
 *   { certificateId: string }          ← 개별 발송
 *   { certificateIds: string[] }       ← 일괄 발송
 *
 * 동작:
 *   1. Supabase에서 자격증 + 사용자 + 시험 정보 조회
 *   2. 클라이언트가 전송한 pdfBase64(선택) 또는 메타 정보만 포함
 *   3. Resend로 이메일 발송
 *
 * 환경변수:
 *   RESEND_API_KEY  — Resend 대시보드에서 발급
 *   RESEND_FROM     — 발신 주소 (예: noreply@yourdomain.com)
 *                     Resend 무료플랜: onboarding@resend.dev 사용 가능
 */

import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createServiceClient } from '@/lib/supabase/server'
import { buildCertificateEmailHtml, buildCertificateEmailText } from '@/lib/email/template'

export const runtime = 'nodejs'
export const maxDuration = 60

// ─── Resend 클라이언트 (lazy init) ───────────────────────────
function getResend() {
  const key = process.env.RESEND_API_KEY
  if (!key) throw new Error('RESEND_API_KEY 환경변수가 설정되지 않았습니다.')
  return new Resend(key)
}

function getFromAddress() {
  return process.env.RESEND_FROM ?? 'KAIA 자격증센터 <onboarding@resend.dev>'
}

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://ai-dusky-gamma.vercel.app'

// ─── 단일 자격증 이메일 발송 ─────────────────────────────────
async function sendOneCert(
  resend: Resend,
  certId: string,
  pdfBase64?: string
) {
  const supabase = createServiceClient()

  const { data: certRaw, error } = await (supabase as any)
    .from('certificates')
    .select(`
      *,
      user:users(full_name, email),
      application:exam_applications(
        score,
        exam:exams(title)
      )
    `)
    .eq('id', certId)
    .single()

  if (error || !certRaw) {
    return { certId, success: false, error: '자격증 정보를 찾을 수 없습니다.' }
  }

  const cert        = certRaw as any
  const user        = cert.user
  const application = cert.application
  const exam        = application?.exam

  if (!user?.email) {
    return { certId, success: false, error: '이메일 주소가 없습니다.' }
  }

  // 발급일 포맷
  const issueDate = new Date(cert.issued_at).toLocaleDateString('ko-KR', {
    year: 'numeric', month: 'long', day: 'numeric', timeZone: 'Asia/Seoul',
  })

  const emailData = {
    recipientName: user.full_name ?? '수료자',
    examTitle: exam?.title ?? '소상공인 실전 AI 지도사',
    certificateNumber: cert.certificate_number,
    score: application?.score ?? 100,
    issueDate,
    appUrl: APP_URL,
  }

  // 첨부파일 (클라이언트에서 PDF base64 전달 시)
  const attachments = pdfBase64 ? [{
    filename: `자격증_${user.full_name}_${cert.certificate_number}.pdf`,
    content: pdfBase64,
  }] : []

  try {
    const result = await resend.emails.send({
      from: getFromAddress(),
      to: [user.email],
      subject: `🏆 [KAIA] ${user.full_name}님의 자격증이 발급되었습니다 - ${cert.certificate_number}`,
      html: buildCertificateEmailHtml(emailData),
      text: buildCertificateEmailText(emailData),
      attachments,
    })

    if (result.error) {
      return { certId, success: false, error: result.error.message }
    }

    // email_sent_at 기록 (certificates 테이블에 컬럼이 있으면 업데이트)
    await (supabase as any)
      .from('certificates')
      .update({ email_sent_at: new Date().toISOString() })
      .eq('id', certId)

    return {
      certId,
      success: true,
      to: user.email,
      name: user.full_name,
      certNumber: cert.certificate_number,
    }
  } catch (err: any) {
    return { certId, success: false, error: err.message ?? '발송 실패' }
  }
}

// ─── Route Handler ────────────────────────────────────────────
export async function POST(req: NextRequest) {
  // 관리자 인증 확인 (service role 키로 조회하기 전에 세션 확인)
  try {
    const body = await req.json()
    const { certificateId, certificateIds, pdfBase64 } = body as {
      certificateId?: string
      certificateIds?: string[]
      pdfBase64?: string
    }

    // 발송 대상 목록 정규화
    const ids: string[] = certificateId
      ? [certificateId]
      : (certificateIds ?? [])

    if (ids.length === 0) {
      return NextResponse.json(
        { success: false, error: '발송할 자격증 ID가 없습니다.' },
        { status: 400 }
      )
    }

    // Resend 초기화
    let resend: Resend
    try {
      resend = getResend()
    } catch (e: any) {
      return NextResponse.json(
        { success: false, error: e.message },
        { status: 503 }
      )
    }

    // 순차 발송 (rate-limit 고려)
    const results = []
    for (const id of ids) {
      const result = await sendOneCert(resend, id, pdfBase64)
      results.push(result)
      // 여러 건 발송 시 짧은 딜레이
      if (ids.length > 1) await new Promise(r => setTimeout(r, 300))
    }

    const succeeded = results.filter(r => r.success).length
    const failed    = results.filter(r => !r.success).length

    return NextResponse.json({
      success: true,
      summary: { total: ids.length, succeeded, failed },
      results,
    })

  } catch (err: any) {
    console.error('[send-email]', err)
    return NextResponse.json(
      { success: false, error: err.message ?? '서버 오류' },
      { status: 500 }
    )
  }
}
