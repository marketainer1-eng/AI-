/**
 * CertificateTemplate — PPT 원본 100% 재현
 *
 * PPT 슬라이드: 6858000 × 9677400 EMU  (7.50 × 10.583 in)
 * 렌더 캔버스:  794 × 1123 px  (A4 96dpi 기준)
 *
 * 변환식
 *   px_x = emu_x × (794 / 6858000)
 *   px_y = emu_y × (1123 / 9677400)
 *   font_px = pt × (794 / 540)   ← 540pt = 7.5in × 72pt/in = 슬라이드 폭
 *
 * 동적 치환 영역
 *   · 합격자 성명  (Shape 12 / Text 10)
 *   · VERIFY NO.  (Shape 27 / Text 21)  ← certificate_number
 *   · ISSUE DATE  (Shape 29 / Text 23)
 */

import { forwardRef } from 'react'
import type { CertificateData } from '@/lib/certificate/access'

/* ─── 캔버스 크기 ───────────────────────────────────────────── */
const W = 794   // px
const H = 1123  // px

/* ─── EMU → px 변환 ─────────────────────────────────────────── */
const ex = (emu: number) => emu * (W / 6858000)
const ey = (emu: number) => emu * (H / 9677400)

/* ─── pt → px  (슬라이드 폭 540pt 기준) ────────────────────── */
const ep = (pt: number) => pt * (W / 540)

/* ─── 색상 팔레트 (PPT 원본) ────────────────────────────────── */
const C = {
  teal:      '#00BFA5',
  dark:      '#0F172A',
  navy:      '#1E293B',
  slate:     '#334155',
  muted:     '#64748B',
  light:     '#94A3B8',
  white:     '#FFFFFF',
}

interface Props { data: CertificateData }

const CertificateTemplate = forwardRef<HTMLDivElement, Props>(({ data }, ref) => {
  const { cert, user } = data

  /* 발급일 포맷: "2026. 05. 03" */
  const issueDate = new Date(cert.issued_at)
    .toLocaleDateString('ko-KR', {
      year: 'numeric', month: '2-digit', day: '2-digit',
      timeZone: 'Asia/Seoul',
    })
    .replace(/\.\s*$/, '')
    .trim()

  /* 성명 글자 사이 공백 (원본 스타일) */
  const nameSpaced = user.full_name.split('').join(' ')

  return (
    /* 화면 밖 숨김 컨테이너 */
    <div
      style={{ position: 'fixed', top: '-9999px', left: '-9999px',
               zIndex: -1, pointerEvents: 'none' }}
      aria-hidden="true"
    >
      {/* ══════════ 자격증 캔버스 ══════════ */}
      <div
        ref={ref}
        style={{
          width: `${W}px`, height: `${H}px`,
          position: 'relative', overflow: 'hidden',
          boxSizing: 'border-box',
          backgroundColor: C.white,
          fontFamily: "'Noto Sans KR', 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif",
        }}
      >

        {/* ── [Layer 0] 배경 전체 이미지 (PPT Image 0) ── */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/cert-assets/bg.png" alt=""
          style={{ position: 'absolute', top: 0, left: 0,
                   width: `${W}px`, height: `${H}px`,
                   objectFit: 'fill', display: 'block' }} />

        {/* ── [Layer 1] 상단 얇은 가로선 이미지 (PPT Image 1) ── */}
        {/* left=30, top=30, w=480, h=12 */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/cert-assets/top-line.png" alt=""
          style={{
            position: 'absolute',
            left: `${ex(381305)}px`, top: `${ey(381305)}px`,
            width: `${ex(6096305)}px`, height: `${ey(152705)}px`,
            display: 'block',
          }} />

        {/* ── [Layer 2] 우측 상단 KAIA 로고 (PPT Image 3) ── */}
        {/* left=390, top=75, w=75, h=75 */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/cert-assets/logo.jpg" alt="KAIA"
          style={{
            position: 'absolute',
            left: `${ex(4953305)}px`, top: `${ey(952805)}px`,
            width: `${ex(952805)}px`, height: `${ey(952805)}px`,
            objectFit: 'contain', display: 'block',
          }} />

        {/* ── [Layer 3] 텍스트: "Certificate of Qualification" ── */}
        {/* Shape 8 / Text 6: left=67.5, top=82.5, font=12pt bold, color=teal */}
        <div style={{
          position: 'absolute',
          left: `${ex(857707)}px`, top: `${ey(1047902)}px`,
          width: `${ex(4000500)}px`,
          fontSize: `${ep(12)}px`, fontWeight: 700,
          color: C.teal, letterSpacing: '0.04em',
          lineHeight: 1, whiteSpace: 'nowrap',
          fontFamily: "'Montserrat', 'Arial', sans-serif",
        }}>
          Certificate of Qualification
        </div>

        {/* ── [Layer 4] 텍스트: "Practical AI / Instructor" ── */}
        {/* Shape 9 / Text 7: left=67.5, top=112.5, font=28pt bold, color=#1E293B */}
        <div style={{
          position: 'absolute',
          left: `${ex(857707)}px`, top: `${ey(1429207)}px`,
          width: `${ex(4000500)}px`,
          fontSize: `${ep(28)}px`, fontWeight: 800,
          color: C.navy, letterSpacing: '-0.01em',
          lineHeight: 1.15,
          fontFamily: "'Montserrat', 'Arial', sans-serif",
        }}>
          Practical AI<br />Instructor
        </div>

        {/* ── [Layer 5] 텍스트: "for Small Business" ── */}
        {/* Shape 10 / Text 8: left=67.5, top=184, font=15pt bold, color=#64748B */}
        <div style={{
          position: 'absolute',
          left: `${ex(857707)}px`, top: `${ey(2337206)}px`,
          width: `${ex(4000500)}px`,
          fontSize: `${ep(15)}px`, fontWeight: 700,
          color: C.muted, letterSpacing: '0.02em',
          lineHeight: 1,
          fontFamily: "'Montserrat', 'Arial', sans-serif",
        }}>
          for Small Business
        </div>

        {/* ── [Layer 6] 텍스트: "This certifies that" ── */}
        {/* Shape 11 / Text 9: left=67.5, top=232.5, font=12pt, color=#94A3B8 */}
        <div style={{
          position: 'absolute',
          left: `${ex(857707)}px`, top: `${ey(2952598)}px`,
          width: `${ex(5143500)}px`,
          fontSize: `${ep(12)}px`, fontWeight: 400,
          color: C.light,
          lineHeight: 1,
        }}>
          This certifies that
        </div>

        {/* ══ [DYNAMIC 1] 합격자 성명 ══ */}
        {/* Shape 12 / Text 10: left=67.5, top=255, font=42pt bold, color=#0F172A */}
        <div style={{
          position: 'absolute',
          left: `${ex(857707)}px`, top: `${ey(3238805)}px`,
          width: `${ex(5143500)}px`, height: `${ey(648310)}px`,
          display: 'flex', alignItems: 'center',
          fontSize: `${ep(42)}px`, fontWeight: 900,
          color: C.dark,
          letterSpacing: '0.18em',
          lineHeight: 1,
          whiteSpace: 'nowrap',
        }}>
          {nameSpaced}
        </div>

        {/* ── [Layer 7] 본문 텍스트 (3줄) ── */}
        {/* Shape 13 / Text 11: left=67.5, top=337.5, font=13pt, color=#334155 */}
        <div style={{
          position: 'absolute',
          left: `${ex(857707)}px`, top: `${ey(4286707)}px`,
          width: `${ex(5143500)}px`,
          fontSize: `${ep(13)}px`, fontWeight: 400,
          color: C.slate, lineHeight: 1.65,
        }}>
          귀하는 인공지능 기술을 활용한 생성형 AI를 활용한{' '}
          <br />
          상세페이지, 영상 제작, 소상공인 맞춤형 업무별 프롬프트 설계 역량을{' '}
          <br />
          인정받아{' '}
          <span style={{ fontWeight: 700, color: C.teal }}>
            {'\'소상공인 실전 AI 지도사\''}
          </span>{' '}
          자격을 취득하였습니다.
        </div>

        {/* ── [Layer 8] "주요 역량 분야 KEY COMPETENCIES" ── */}
        {/* Shape 15 / Text 13: left=67.5, top=420 */}
        <div style={{
          position: 'absolute',
          left: `${ex(857707)}px`, top: `${ey(5333695)}px`,
          width: `${ex(5143500)}px`,
          lineHeight: 1,
          display: 'flex', alignItems: 'baseline', gap: `${ep(4)}px`,
        }}>
          <span style={{
            fontSize: `${ep(12)}px`, fontWeight: 700, color: C.navy,
          }}>주요 역량 분야</span>
          <span style={{
            fontSize: `${ep(9)}px`, fontWeight: 700, color: C.light,
            fontFamily: "'Montserrat', 'Arial', sans-serif",
            letterSpacing: '0.05em',
          }}>KEY COMPETENCIES</span>
        </div>

        {/* ── [Layer 9] 구분선 (PPT Image 2) ── */}
        {/* left=67.5, top=444, w=405, h=1.5 */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/cert-assets/divider.png" alt=""
          style={{
            position: 'absolute',
            left: `${ex(857707)}px`, top: `${ey(5638190)}px`,
            width: `${ex(5143500)}px`, height: `${ey(19202)}px`,
            display: 'block',
          }} />

        {/* ── [Layer 10] 역량1 아이콘 + 텍스트 ── */}
        {/* Shape 16(circle): left=67.5, top=465, 27×27  /  Image 4: left=75, top=472.5, 12×12 */}
        {/* 동그라미 배경 */}
        <div style={{
          position: 'absolute',
          left: `${ex(857707)}px`, top: `${ey(5905195)}px`,
          width: `${ex(342900)}px`, height: `${ey(342900)}px`,
          borderRadius: '50%', backgroundColor: C.teal,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/cert-assets/icon1.png" alt=""
            style={{ width: `${ex(152705)}px`, height: `${ey(152705)}px`, objectFit: 'contain' }} />
        </div>
        <div style={{
          position: 'absolute',
          left: `${ex(1333195)}px`, top: `${ey(5982005)}px`,
          width: `${ex(4668012)}px`,
          fontSize: `${ep(12)}px`, fontWeight: 400, color: C.slate,
          lineHeight: 1,
        }}>
          생성형 AI를 활용한 상세페이지 제작
        </div>

        {/* ── [Layer 11] 역량2 아이콘 + 텍스트 ── */}
        <div style={{
          position: 'absolute',
          left: `${ex(857707)}px`, top: `${ey(6439205)}px`,
          width: `${ex(342900)}px`, height: `${ey(342900)}px`,
          borderRadius: '50%', backgroundColor: C.teal,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/cert-assets/icon2.png" alt=""
            style={{ width: `${ex(190195)}px`, height: `${ey(152705)}px`, objectFit: 'contain' }} />
        </div>
        <div style={{
          position: 'absolute',
          left: `${ex(1333195)}px`, top: `${ey(6515100)}px`,
          width: `${ex(4668012)}px`,
          fontSize: `${ep(12)}px`, fontWeight: 400, color: C.slate,
          lineHeight: 1,
        }}>
          소상공인 맞춤형 업무별 프롬프트 설계
        </div>

        {/* ── [Layer 12] 역량3 아이콘 + 텍스트 ── */}
        <div style={{
          position: 'absolute',
          left: `${ex(857707)}px`, top: `${ey(6972300)}px`,
          width: `${ex(342900)}px`, height: `${ey(342900)}px`,
          borderRadius: '50%', backgroundColor: C.teal,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/cert-assets/icon3.png" alt=""
            style={{ width: `${ex(152705)}px`, height: `${ey(152705)}px`, objectFit: 'contain' }} />
        </div>
        <div style={{
          position: 'absolute',
          left: `${ex(1333195)}px`, top: `${ey(7048195)}px`,
          width: `${ex(4668012)}px`,
          fontSize: `${ep(12)}px`, fontWeight: 400, color: C.slate,
          lineHeight: 1,
        }}>
          생성형 AI 활용한 영상 제작
        </div>

        {/* ── [Layer 13] QR 플레이스홀더 (PPT Image 7) ── */}
        {/* left=79.85, top=640.51, w=27.72, h=31.54 */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/cert-assets/qr-placeholder.png" alt="QR"
          style={{
            position: 'absolute',
            left: `${ex(1014070)}px`, top: `${ey(8134502)}px`,
            width: `${ex(352044)}px`, height: `${ey(400507)}px`,
            objectFit: 'contain', display: 'block',
          }} />

        {/* ── [Layer 14] "VERIFY NO." 레이블 ── */}
        {/* Shape 26 / Text 20: left=131.3, top=633.7, font=9pt bold, color=#64748B */}
        <div style={{
          position: 'absolute',
          left: `${ex(1666951)}px`, top: `${ey(8048549)}px`,
          width: `${ex(1905610)}px`,
          fontSize: `${ep(9)}px`, fontWeight: 700,
          color: C.muted,
          fontFamily: "'Montserrat', 'Arial', sans-serif",
          letterSpacing: '0.05em',
          lineHeight: 1,
        }}>
          VERIFY NO.
        </div>

        {/* ══ [DYNAMIC 2] 자격증 번호 ══ */}
        {/* Shape 27 / Text 21: left=131.3, top=650.3, font=12pt bold, color=#1E293B */}
        <div style={{
          position: 'absolute',
          left: `${ex(1666951)}px`, top: `${ey(8258176)}px`,
          width: `${ex(1905610)}px`,
          fontSize: `${ep(12)}px`, fontWeight: 700,
          color: C.navy,
          fontFamily: "'Montserrat', 'Arial', sans-serif",
          letterSpacing: '0.04em',
          lineHeight: 1,
          whiteSpace: 'nowrap',
        }}>
          {cert.certificate_number}
        </div>

        {/* ── [Layer 15] URL ── */}
        {/* Shape 28 / Text 22: left=131.3, top=669.8, font=8pt, color=teal */}
        <div style={{
          position: 'absolute',
          left: `${ex(1666951)}px`, top: `${ey(8506208)}px`,
          width: `${ex(1905610)}px`,
          fontSize: `${ep(8)}px`, fontWeight: 400,
          color: C.teal,
          fontFamily: "'Montserrat', 'Arial', sans-serif",
          letterSpacing: '0.02em',
          lineHeight: 1,
        }}>
          http://aiagent.io.kr/
        </div>

        {/* ══ [DYNAMIC 3] ISSUE DATE ══ */}
        {/* Shape 29 / Text 23: left=300, top=647.2, font=9pt bold, color=#64748B, right-aligned */}
        <div style={{
          position: 'absolute',
          left: `${ex(3810305)}px`, top: `${ey(8220000)}px`,
          width: `${ex(2190902)}px`,
          display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
          fontSize: `${ep(9)}px`, fontWeight: 700,
          color: C.muted,
          fontFamily: "'Montserrat', 'Arial', sans-serif",
          letterSpacing: '0.03em',
          lineHeight: 1,
          whiteSpace: 'nowrap',
        }}>
          ISSUE DATE: {issueDate}
        </div>

        {/* ── [Layer 16] Director 서명 ── */}
        {/* Shape 30 / Text 25: left=300, top=662.7, font=9pt, color=#1E293B, right-aligned */}
        <div style={{
          position: 'absolute',
          left: `${ex(3810305)}px`, top: `${ey(8415908)}px`,
          width: `${ex(2190902)}px`,
          display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
          fontSize: `${ep(9)}px`, fontWeight: 400,
          color: C.navy,
          lineHeight: 1,
          whiteSpace: 'nowrap',
        }}>
          Director of AI 에이전트 협회
        </div>

      </div>{/* end 자격증 캔버스 */}
    </div>
  )
})

CertificateTemplate.displayName = 'CertificateTemplate'
export default CertificateTemplate
