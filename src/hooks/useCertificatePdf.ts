'use client'

import { useRef, useState, useCallback } from 'react'
import type { CertificateData } from '@/lib/certificate/access'

export type PdfStatus = 'idle' | 'rendering' | 'generating' | 'done' | 'error'

interface UseCertificatePdfReturn {
  templateRef: React.RefObject<HTMLDivElement | null>
  status: PdfStatus
  errorMsg: string | null
  download: () => Promise<void>
}

/**
 * jsPDF + html2canvas 를 lazy import 해 자격증 PDF를 생성·다운로드합니다.
 * Cloudflare Workers 환경(서버)에서는 실행되지 않으므로 동적 import 필수.
 */
export function useCertificatePdf(data: CertificateData): UseCertificatePdfReturn {
  const templateRef = useRef<HTMLDivElement>(null)
  const [status, setStatus]     = useState<PdfStatus>('idle')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const download = useCallback(async () => {
    const el = templateRef.current
    if (!el) {
      setErrorMsg('템플릿을 찾을 수 없습니다.')
      setStatus('error')
      return
    }

    try {
      setStatus('rendering')
      setErrorMsg(null)

      // ── 1. html2canvas 로 DOM 캡처 ──────────────────────────
      const html2canvas = (await import('html2canvas')).default
      const canvas = await html2canvas(el, {
        scale: 2,           // 고해상도 (2×)
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        // 한글 폰트 렌더링을 위해 windowWidth/Height 명시
        windowWidth:  el.scrollWidth,
        windowHeight: el.scrollHeight,
      })

      setStatus('generating')

      // ── 2. jsPDF 로 A4 PDF 생성 ──────────────────────────────
      const { jsPDF } = await import('jspdf')

      // A4 mm: 210 × 297
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        compress: true,
      })

      const pageW = pdf.internal.pageSize.getWidth()   // 210
      const pageH = pdf.internal.pageSize.getHeight()  // 297

      const imgData = canvas.toDataURL('image/jpeg', 0.95)

      // 캔버스 비율 유지하며 페이지 꽉 채우기
      const canvasRatio = canvas.height / canvas.width
      const imgH = pageW * canvasRatio
      const yOffset = Math.max(0, (pageH - imgH) / 2) // 세로 중앙 정렬

      pdf.addImage(imgData, 'JPEG', 0, yOffset, pageW, imgH)

      // ── 3. 메타데이터 삽입 ───────────────────────────────────
      pdf.setProperties({
        title:   `자격증 - ${data.user.full_name}`,
        subject: data.exam.title,
        author:  '자격증센터',
        creator: '자격증센터 시스템',
        keywords: `certificate,${data.cert.certificate_number}`,
      })

      // ── 4. 파일명: 자격증_홍길동_CERT-2025-000001.pdf ────────
      const safeTitle = data.exam.title.replace(/[^\wㄱ-힣]/g, '_')
      const fileName  = `자격증_${data.user.full_name}_${safeTitle}_${data.cert.certificate_number}.pdf`
      pdf.save(fileName)

      setStatus('done')

      // 3초 후 idle 복귀
      setTimeout(() => setStatus('idle'), 3000)

    } catch (err) {
      console.error('[useCertificatePdf]', err)
      setErrorMsg(err instanceof Error ? err.message : 'PDF 생성에 실패했습니다.')
      setStatus('error')
    }
  }, [data])

  return { templateRef, status, errorMsg, download }
}
