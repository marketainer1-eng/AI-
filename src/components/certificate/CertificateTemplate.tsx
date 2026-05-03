/**
 * CertificateTemplate
 * PPT 원본 디자인을 배경 이미지로 사용,
 * 이름 / 자격증번호 / 발급일만 정확한 위치에 동적 오버레이
 *
 * PPT 슬라이드: 6858000 x 9677400 EMU (7.50 x 10.58 in)
 * 출력 크기:   794 x 1123 px
 * scale = 794/6858000 = 0.0001158
 *
 * 동적 텍스트 위치 (PPT EMU → px):
 *  - 이름:        left=99, top=376, w=596, h=75  / font=42pt→62px / color=#0F172A
 *  - 자격증번호:  left=193, top=955, w=221, h=21 / font=12pt→18px / color=#1E293B
 *  - 발급일:      left=441, top=954, w=254, h=17 / font=9pt→13px  / color=#64748B
 */

import { forwardRef } from 'react'
import type { CertificateData } from '@/lib/certificate/access'

interface CertificateTemplateProps {
  data: CertificateData
}

const WIDTH  = 794
const HEIGHT = 1123

// PPT EMU → px 변환 (슬라이드: 6858000 x 9677400)
const ex = (emu: number) => Math.round(emu * (794 / 6858000))
const ey = (emu: number) => Math.round(emu * (1123 / 9677400))

// PPT pt → px 변환 (1pt = 12700 EMU, 794px 기준)
// 42pt = 42 * 12700 / 6858000 * 794 ≈ 62px
const ept = (pt: number) => Math.round(pt * 12700 * (794 / 6858000))

const CertificateTemplate = forwardRef<HTMLDivElement, CertificateTemplateProps>(
  ({ data }, ref) => {
    const { cert, user, exam } = data

    // 발급일 포맷: "2026. 05. 03"
    const rawIssued = new Date(cert.issued_at).toLocaleDateString('ko-KR', {
      year:  'numeric',
      month: '2-digit',
      day:   '2-digit',
      timeZone: 'Asia/Seoul',
    })
    // "2026. 05. 03." → "2026. 05. 03"
    const formattedDate = rawIssued.replace(/\.\s*$/, '').trim()

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
            fontFamily: "'Noto Sans KR', 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif",
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

          {/* ──────────────────────────────────────────────────
              동적 오버레이 텍스트
              PPT EMU 좌표 기준 정밀 배치
          ────────────────────────────────────────────────── */}

          {/* 1. 이름
              PPT Shape[14]: left=857707, top=3238805, w=5143500, h=648310
              → px: left=99, top=376, w=596, h=75
              font=42pt → ept(42)=≈62px, color=#0F172A, bold
          */}
          <div style={{
            position: 'absolute',
            left:   `${ex(857707)}px`,
            top:    `${ey(3238805)}px`,
            width:  `${ex(5143500)}px`,
            height: `${ey(648310)}px`,
            display: 'flex',
            alignItems: 'center',
            fontSize:    `${ept(42)}px`,
            fontWeight:  900,
            color:       '#0F172A',
            letterSpacing: '0.15em',
            lineHeight:  1,
            whiteSpace:  'nowrap',
          }}>
            {/* 원본 스타일: 글자 사이 공백 */}
            {user.full_name.split('').join(' ')}
          </div>

          {/* 2. 자격증 번호
              PPT Shape[29]: left=1666951, top=8229600, w=1905610, h=181051
              → px: left=193, top=955, w=221, h=21
              font=12pt → ept(12)=18px, color=#1E293B, bold
          */}
          <div style={{
            position: 'absolute',
            left:   `${ex(1666951)}px`,
            top:    `${ey(8229600)}px`,
            width:  `${ex(1905610)}px`,
            height: `${ey(181051)}px`,
            display: 'flex',
            alignItems: 'center',
            fontSize:    `${ept(12)}px`,
            fontWeight:  700,
            color:       '#1E293B',
            letterSpacing: '0.05em',
            lineHeight:  1,
            whiteSpace:  'nowrap',
          }}>
            {cert.certificate_number}
          </div>

          {/* 3. 발급일
              PPT Shape[31]: left=3810305, top=8220000, w=2190902, h=143561
              → px: left=441, top=954, w=254, h=17
              font=9pt → ept(9)=13px, color=#64748B, bold
              오른쪽 끝을 Director of AI에이전트 협회와 동일하게 맞춤 (justifyContent: flex-end)
          */}
          <div style={{
            position: 'absolute',
            left:   `${ex(3810305)}px`,
            top:    `${ey(8220000)}px`,
            width:  `${ex(2190902)}px`,
            height: `${ey(143561)}px`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            fontSize:    `${ept(9)}px`,
            fontWeight:  700,
            color:       '#64748B',
            letterSpacing: '0.03em',
            lineHeight:  1,
            whiteSpace:  'nowrap',
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
