'use client'

import { useRef, useState, useCallback } from 'react'
import type { CertificateData } from '@/lib/certificate/access'

export type PdfStatus = 'idle' | 'rendering' | 'generating' | 'done' | 'error'
export type EmailStatus = 'idle' | 'generating' | 'sending' | 'done' | 'error'

interface UseCertificatePdfReturn {
  templateRef: React.RefObject<HTMLDivElement | null>
  status: PdfStatus
  emailStatus: EmailStatus
  errorMsg: string | null
  emailMsg: string | null
  download: () => Promise<void>
  sendEmail: () => Promise<void>
}

/**
 * jsPDF + html2canvas 로 자격증 PDF 생성·다운로드 + 이메일 발송
 *
 * 화질 전략:
 *  - scale: 3  → 캔버스 2382×3369 px (고해상도)
 *  - JPEG quality: 0.98
 */
export function useCertificatePdf(data: CertificateData): UseCertificatePdfReturn {
  const templateRef = useRef<HTMLDivElement>(null)
  const [status,      setStatus]      = useState<PdfStatus>('idle')
  const [emailStatus, setEmailStatus] = useState<EmailStatus>('idle')
  const [errorMsg,    setErrorMsg]    = useState<string | null>(null)
  const [emailMsg,    setEmailMsg]    = useState<string | null>(null)

  // ── 캔버스 캡처 공통 함수 ──────────────────────────────────
  const captureCanvas = useCallback(async () => {
    const el = templateRef.current
    if (!el) throw new Error('템플릿 요소를 찾을 수 없습니다.')
    await document.fonts.ready
    const html2canvas = (await import('html2canvas')).default
    return html2canvas(el, {
      scale: 3,
      useCORS: true,
      allowTaint: false,
      backgroundColor: '#ffffff',
      logging: false,
      imageTimeout: 15000,
      windowWidth: 794,
      windowHeight: 1123,
      foreignObjectRendering: false,
    })
  }, [])

  // ── canvas → PDF blob (base64) ────────────────────────────
  const buildPdfBase64 = useCallback(async (canvas: HTMLCanvasElement): Promise<string> => {
    const { jsPDF } = await import('jspdf')
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true,
    })
    const pageW = pdf.internal.pageSize.getWidth()
    const pageH = pdf.internal.pageSize.getHeight()
    const imgData = canvas.toDataURL('image/jpeg', 0.98)
    const canvasRatio = canvas.height / canvas.width
    const imgH = pageW * canvasRatio
    const yOffset = Math.max(0, (pageH - imgH) / 2)
    pdf.addImage(imgData, 'JPEG', 0, yOffset, pageW, imgH)
    pdf.setProperties({
      title:   `소상공인 실전 AI 지도사 자격증 - ${data.user.full_name}`,
      subject: data.exam.title,
      author:  'AI 에이전트 협회',
      creator: '자격증 관리 시스템',
      keywords: `certificate,자격증,${data.cert.certificate_number}`,
    })
    // output('datauristring') → "data:application/pdf;base64,..." 에서 base64 부분만 추출
    const dataUri = pdf.output('datauristring')
    return dataUri.split(',')[1]
  }, [data])

  // ── PDF 다운로드 ───────────────────────────────────────────
  const download = useCallback(async () => {
    if (!templateRef.current) {
      setErrorMsg('템플릿을 찾을 수 없습니다.')
      setStatus('error')
      return
    }
    try {
      setStatus('rendering')
      setErrorMsg(null)
      const canvas = await captureCanvas()
      setStatus('generating')
      const { jsPDF } = await import('jspdf')
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4', compress: true })
      const pageW = pdf.internal.pageSize.getWidth()
      const pageH = pdf.internal.pageSize.getHeight()
      const imgData = canvas.toDataURL('image/jpeg', 0.98)
      const imgH = pageW * (canvas.height / canvas.width)
      pdf.addImage(imgData, 'JPEG', 0, Math.max(0, (pageH - imgH) / 2), pageW, imgH)
      pdf.setProperties({
        title:   `소상공인 실전 AI 지도사 자격증 - ${data.user.full_name}`,
        subject: data.exam.title,
        author:  'AI 에이전트 협회',
        creator: '자격증 관리 시스템',
        keywords: `certificate,자격증,${data.cert.certificate_number}`,
      })
      pdf.save(`자격증_${data.user.full_name}_${data.cert.certificate_number}.pdf`)
      setStatus('done')
      setTimeout(() => setStatus('idle'), 3000)
    } catch (err) {
      console.error('[useCertificatePdf:download]', err)
      setErrorMsg(err instanceof Error ? err.message : 'PDF 생성에 실패했습니다.')
      setStatus('error')
    }
  }, [data, captureCanvas])

  // ── 이메일 발송 ────────────────────────────────────────────
  const sendEmail = useCallback(async () => {
    if (!templateRef.current) {
      setEmailMsg('템플릿을 찾을 수 없습니다.')
      setEmailStatus('error')
      return
    }
    try {
      setEmailStatus('generating')
      setEmailMsg(null)

      // 1. PDF base64 생성
      const canvas = await captureCanvas()
      const pdfBase64 = await buildPdfBase64(canvas)

      // 2. 서버 API 호출
      setEmailStatus('sending')
      const res = await fetch('/api/certificate/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          certificateId: data.cert.id,
          pdfBase64,
        }),
      })
      const json = await res.json()

      if (!res.ok || !json.success) {
        throw new Error(json.error ?? '이메일 발송에 실패했습니다.')
      }

      setEmailStatus('done')
      setEmailMsg('이메일이 성공적으로 발송되었습니다! 📧')
      setTimeout(() => { setEmailStatus('idle'); setEmailMsg(null) }, 4000)
    } catch (err) {
      console.error('[useCertificatePdf:sendEmail]', err)
      setEmailMsg(err instanceof Error ? err.message : '이메일 발송에 실패했습니다.')
      setEmailStatus('error')
    }
  }, [data, captureCanvas, buildPdfBase64])

  return { templateRef, status, emailStatus, errorMsg, emailMsg, download, sendEmail }
}
