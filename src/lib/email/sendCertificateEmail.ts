/**
 * 자격증 자동 발송 공통 함수 — Gmail SMTP
 *
 * 사용처:
 *   1. /api/exam/submit  — 시험 합격 즉시 자동 발송
 *   2. actions/exam.ts   — 관리자가 자격증 발급 시 자동 발송
 *
 * 환경변수:
 *   GMAIL_USER    — aiecommerce202509@gmail.com
 *   GMAIL_APP_PW  — Gmail 앱 비밀번호 (16자리)
 */

import nodemailer from 'nodemailer'
import { buildCertificateEmailHtml, buildCertificateEmailText } from './template'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://ai-s611.vercel.app'

export interface AutoEmailPayload {
  toEmail:           string
  recipientName:     string
  examTitle:         string
  certificateNumber: string
  score:             number
  issuedAt:          string   // ISO string
}

/**
 * Gmail SMTP로 자격증 이메일 자동 발송
 * - 환경변수 없으면 console.warn만 출력하고 skip (빌드/테스트 환경 대비)
 * - 에러가 나도 throw 하지 않음 → 자격증 발급 흐름을 막지 않음
 */
export async function sendCertificateEmail(payload: AutoEmailPayload): Promise<void> {
  const gmailUser  = process.env.GMAIL_USER
  const gmailAppPw = process.env.GMAIL_APP_PW

  if (!gmailUser || !gmailAppPw) {
    console.warn('[email] GMAIL_USER / GMAIL_APP_PW 환경변수 없음 — 이메일 발송 skip')
    return
  }

  const issueDate = new Date(payload.issuedAt)
    .toLocaleDateString('ko-KR', {
      year: 'numeric', month: '2-digit', day: '2-digit',
      timeZone: 'Asia/Seoul',
    })
    .replace(/\.\s*$/, '')
    .trim()

  const emailData = {
    recipientName:     payload.recipientName,
    examTitle:         payload.examTitle,
    certificateNumber: payload.certificateNumber,
    score:             payload.score,
    issueDate,
    appUrl:            APP_URL,
  }

  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: gmailUser,
        pass: gmailAppPw,
      },
    })

    await transporter.sendMail({
      from:    `KAIA 자격증센터 <${gmailUser}>`,
      to:      payload.toEmail,
      subject: `🏆 [KAIA] ${payload.recipientName}님의 자격증이 발급되었습니다`,
      html:    buildCertificateEmailHtml(emailData),
      text:    buildCertificateEmailText(emailData),
    })

    console.log(`[email] 자격증 이메일 발송 완료 → ${payload.toEmail} (${payload.certificateNumber})`)
  } catch (err) {
    console.error('[email] sendCertificateEmail 오류:', err)
  }
}
