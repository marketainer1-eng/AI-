/**
 * CertificateTemplate
 * PPT 원본 디자인을 배경 이미지로 사용,
 * 이름 / 자격증번호 / 발급일만 정확한 위치에 동적 오버레이
 *
 * PDF 좌표계: 540 x 762 pt  →  794 x 1123 px
 * scale_x = 794/540 = 1.4704
 * scale_y = 1123/762 = 1.4738
 */

import { forwardRef } from 'react'
import type { CertificateData } from '@/lib/certificate/access'

interface CertificateTemplateProps {
  data: CertificateData
}

const WIDTH  = 794
const HEIGHT = 1123

// PDF pt → px 변환 헬퍼
const sx = (pt: number) => Math.round(pt * (794 / 540))
const sy = (pt: number) => Math.round(pt * (1123 / 762))

const CertificateTemplate = forwardRef<HTMLDivElement, CertificateTemplateProps>(
  ({ data }, ref) => {
    const { cert, user, exam } = data

    // 발급일 포맷: "2026. 05. 03"
    const issuedDate = new Date(cert.issued_at).toLocaleDateString('ko-KR', {
      year:  'numeric',
      month: '2-digit',
      day:   '2-digit',
      timeZone: 'Asia/Seoul',
    }).replace(/\./g, '.').replace(/\s/g, ' ').trim()
    // → "2026. 05. 03" 형태로
    const [y, m, d] = issuedDate.split('. ')
    const formattedDate = `${y}. ${m?.replace('.','') ?? m}. ${d?.replace('.','') ?? d}`

    return (
      <div
        style={{
          position: 'fixed',
          top: '-9999px',
          left: '-9999px',
          zIndex: -1,
          pointerEvents: 'none',
        }}
        aria-hidden="true"
      >
        <div
          ref={ref}
          style={{
            width:  `${WIDTH}px`,
            height: `${HEIGHT}px`,
            position: 'relative',
            overflow: 'hidden',
            boxSizing: 'border-box',
            fontFamily: "'Noto Sans KR', 'Apple SD Gothic Neo', sans-serif",
          }}
        >
          {/* ── PPT 원본 배경 이미지 ── */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/cert-bg.png"
            alt=""
            style={{
              position: 'absolute',
              top: 0, left: 0,
              width:  `${WIDTH}px`,
              height: `${HEIGHT}px`,
              display: 'block',
              pointerEvents: 'none',
            }}
          />

          {/* ──────────────────────────────────────
              동적 오버레이 텍스트
              PDF 원본 좌표 기준으로 정밀 배치
          ────────────────────────────────────── */}

          {/* 1. 이름
              PDF: left=68, top=259, font=42pt, color=#0F172A, bold
              px:  left=sx(68)=100, top=sy(259)=382
          */}
          <div style={{
            position: 'absolute',
            left: `${sx(68)}px`,
            top:  `${sy(259)}px`,
            width: `${sx(472)}px`,   // 540-68=472pt
            fontSize: `${sy(42)}px`,
            fontWeight: 900,
            color: '#0F172A',
            letterSpacing: '0.15em',
            lineHeight: 1,
            whiteSpace: 'nowrap',
          }}>
            {/* 이름 글자 사이 띄어쓰기 (원본 스타일) */}
            {user.full_name.split('').join(' ')}
          </div>

          {/* 2. 자격증 번호
              PDF: left=131, top=648, font=12pt, color=#1E293B, bold
              px:  left=sx(131)=193, top=sy(648)=955
          */}
          <div style={{
            position: 'absolute',
            left: `${sx(131)}px`,
            top:  `${sy(648)}px`,
            width: `${sx(175)}px`,
            fontSize: `${sy(12)}px`,
            fontWeight: 700,
            color: '#1E293B',
            letterSpacing: '0.05em',
            lineHeight: 1,
            whiteSpace: 'nowrap',
          }}>
            {cert.certificate_number}
          </div>

          {/* 3. 발급일
              PDF: left=357, top=647, font=9pt, color=#64748B, bold
              px:  left=sx(357)=525, top=sy(647)=954
          */}
          <div style={{
            position: 'absolute',
            left: `${sx(357)}px`,
            top:  `${sy(647)}px`,
            width: `${sx(175)}px`,
            fontSize: `${sy(9)}px`,
            fontWeight: 700,
            color: '#64748B',
            letterSpacing: '0.03em',
            lineHeight: 1,
            whiteSpace: 'nowrap',
          }}>
            ISSUE DATE: {formattedDate}
          </div>

        </div>
      </div>
    )
  }
)

CertificateTemplate.displayName = 'CertificateTemplate'
export default CertificateTemplate
