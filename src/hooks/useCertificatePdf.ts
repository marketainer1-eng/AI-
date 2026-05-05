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
 * jsPDF + html2canvas 를 사용해 자격증 PDF를 생성·다운로드합니다.
 *
 * 화질 전략:
 *  - scale: 3  → 캔버스 2382×3369 px (고해상도)
 *  - JPEG quality: 0.98
 *  - A4: 210×297 mm → 이미지 꽉 채우기 (여백 없음)
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

      // ── 1. Noto Sans KR 폰트 사전 로드 ─────────────────────
      // html2canvas 가 캡처하기 전 폰트가 로드되어 있어야 한글이 정상 렌더됨
      await document.fonts.ready

      // ── 2. html2canvas 캡처 (scale=3 고해상도) ───────────────
      const html2canvas = (await import('html2canvas')).default

      const canvas = await html2canvas(el, {
        scale: 3,                    // 794×1123 → 2382×3369 px
        useCORS: true,
        allowTaint: false,
        backgroundColor: '#ffffff',
        logging: false,
        imageTimeout: 15000,
        // 렌더 대상 요소 크기를 viewport로 설정
        windowWidth:  794,
        windowHeight: 1123,
        // 외부 폰트가 CORS 없이 렌더될 수 있도록
        foreignObjectRendering: false,
      })

      setStatus('generating')

      // ── 3. jsPDF A4 PDF 생성 ─────────────────────────────────
      const { jsPDF } = await import('jspdf')

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        compress: true,
      })

      const pageW = pdf.internal.pageSize.getWidth()   // 210 mm
      const pageH = pdf.internal.pageSize.getHeight()  // 297 mm

      const imgData = canvas.toDataURL('image/jpeg', 0.98)

      // 캔버스 비율 계산 (794:1123 ≈ A4비율 거의 동일)
      const canvasRatio = canvas.height / canvas.width  // ~1.414
      const imgH = pageW * canvasRatio

      // 세로 중앙 또는 상단 정렬 (여백이 있으면 중앙)
      const yOffset = Math.max(0, (pageH - imgH) / 2)

      pdf.addImage(imgData, 'JPEG', 0, yOffset, pageW, imgH)

      // ── 4. 메타데이터 ────────────────────────────────────────
      pdf.setProperties({
        title:    `소상공인 실전 AI 지도사 자격증 - ${data.user.full_name}`,
        subject:  data.exam.title,
        author:   'AI 에이전트 협회',
        creator:  '자격증 관리 시스템',
        keywords: `certificate,자격증,${data.cert.certificate_number}`,
      })

      // ── 5. 파일명: 자격증_홍길동_CERT-2026-000001.pdf ────────
      const fileName = `자격증_${data.user.full_name}_${data.cert.certificate_number}.pdf`
      pdf.save(fileName)

      setStatus('done')
      setTimeout(() => setStatus('idle'), 3000)

    } catch (err) {
      console.error('[useCertificatePdf]', err)
      setErrorMsg(err instanceof Error ? err.message : 'PDF 생성에 실패했습니다.')
      setStatus('error')
    }
  }, [data])

  return { templateRef, status, errorMsg, download }
}
