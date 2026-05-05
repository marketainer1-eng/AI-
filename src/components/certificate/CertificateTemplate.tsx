/**
 * CertificateTemplate — PPT 원본 100% CSS 재현
 *
 * PPT 슬라이드: 6858000 × 9677400 EMU  (7.50 × 10.583 in)
 * 렌더 캔버스:  794 × 1123 px  (A4 96dpi 기준)
 *
 * 변환식
 *   px_x = emu_x × (794 / 6858000)
 *   px_y = emu_y × (1123 / 9677400)
 *   font_px = pt × (794 / 540)   ← 540pt = 7.5in × 72pt/in = 슬라이드 폭
 *
 * PPT 구조
 *   Shape 0  : 전체 배경 #E2E8F0 (연회색)
 *   Shape 1  : 좌상단 장식 원 #00BFA5 (teal) — 화면 밖으로 걸쳐있음
 *   Image 0  : 내부 흰색 카드 배경 이미지 (white card)
 *   Image 1  : 상단 얇은 teal 라인
 *   Shape 4  : 흰색 내부 카드 영역
 *   Shape 5  : QR 영역 흰색 박스
 *   이후 레이어: 텍스트, 아이콘, QR 등
 *
 * 동적 치환 영역
 *   · 합격자 성명  (Text 10)
 *   · VERIFY NO.  (Text 21) ← certificate_number
 *   · ISSUE DATE  (Text 23)
 */

import { forwardRef } from 'react'
import type { CertificateData } from '@/lib/certificate/access'

/* ─── 캔버스 크기 ───────────────────────────────────────────── */
const W = 794   // px
const H = 1123  // px

/* ─── EMU → px 변환 ─────────────────────────────────────────── */
const ex = (emu: number) => Math.round(emu * (W / 6858000) * 100) / 100
const ey = (emu: number) => Math.round(emu * (H / 9677400) * 100) / 100

/* ─── pt → px  (슬라이드 폭 540pt 기준) ────────────────────── */
const ep = (pt: number) => Math.round(pt * (W / 540) * 100) / 100

/* ─── 색상 팔레트 (PPT 원본) ────────────────────────────────── */
const C = {
  teal:      '#00BFA5',   // 포인트 컬러
  bgGray:    '#E2E8F0',   // 전체 배경
  dark:      '#0F172A',   // 성명
  navy:      '#1E293B',   // 제목, 자격증번호
  slate:     '#334155',   // 본문
  muted:     '#64748B',   // 부제목, VERIFY NO., ISSUE DATE
  light:     '#94A3B8',   // 보조 텍스트
  white:     '#FFFFFF',
  divider:   '#E2E8F0',   // 구분선
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
          /* Shape 0: 전체 배경 #E2E8F0 */
          backgroundColor: C.bgGray,
          fontFamily: "'Noto Sans KR', 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif",
        }}
      >

        {/* ── [Shape 1] 좌상단 장식 원 (teal) ── */}
        {/* left=-952805, top=-952805, width=2857500, height=2857500 */}
        <div style={{
          position: 'absolute',
          left:   `${ex(-952805)}px`,
          top:    `${ey(-952805)}px`,
          width:  `${ex(2857500)}px`,
          height: `${ey(2857500)}px`,
          borderRadius: '50%',
          backgroundColor: C.teal,
        }} />

        {/* ── [Shape 4] 내부 흰색 카드 ── */}
        {/* left=571500, top=724205, width=5715000, height=8382305 */}
        <div style={{
          position: 'absolute',
          left:   `${ex(571500)}px`,
          top:    `${ey(724205)}px`,
          width:  `${ex(5715000)}px`,
          height: `${ey(8382305)}px`,
          backgroundColor: C.white,
          borderRadius: `${ep(4)}px`,
        }} />

        {/* ── [Image 1] 상단 teal 라인 ── */}
        {/* left=381305, top=381305, width=6096305, height=152705 */}
        <div style={{
          position: 'absolute',
          left:   `${ex(381305)}px`,
          top:    `${ey(381305)}px`,
          width:  `${ex(6096305)}px`,
          height: `${ey(152705)}px`,
          backgroundColor: C.teal,
          borderRadius: `${ep(2)}px`,
        }} />

        {/* ── [Layer 2] 우측 상단 KAIA 로고 ── */}
        {/* left=4953305, top=952805, width=952805, height=952805 */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/cert-assets/logo.jpg" alt="KAIA"
          style={{
            position: 'absolute',
            left:   `${ex(4953305)}px`,
            top:    `${ey(952805)}px`,
            width:  `${ex(952805)}px`,
            height: `${ey(952805)}px`,
            objectFit: 'contain', display: 'block',
          }} />

        {/* ── [Text 6] "Certificate of Qualification" ── */}
        {/* left=857707, top=1047902, font=12pt bold, color=#00BFA5 */}
        <div style={{
          position: 'absolute',
          left:     `${ex(857707)}px`,
          top:      `${ey(1047902)}px`,
          width:    `${ex(4000500)}px`,
          height:   `${ey(181051)}px`,
          display:  'flex', alignItems: 'center',
          fontSize: `${ep(12)}px`, fontWeight: 700,
          color:    C.teal,
          letterSpacing: '0.04em',
          fontFamily: "'Montserrat', 'Arial', sans-serif",
          whiteSpace: 'nowrap',
        }}>
          Certificate of Qualification
        </div>

        {/* ── [Text 7] "Practical AI / Instructor" ── */}
        {/* left=857707, top=1429207, font=28pt bold, color=#1E293B */}
        <div style={{
          position: 'absolute',
          left:     `${ex(857707)}px`,
          top:      `${ey(1429207)}px`,
          width:    `${ex(4000500)}px`,
          height:   `${ey(838505)}px`,
          display:  'flex', flexDirection: 'column', justifyContent: 'center',
          fontSize: `${ep(28)}px`, fontWeight: 800,
          color:    C.navy,
          letterSpacing: '-0.01em',
          lineHeight: 1.2,
          fontFamily: "'Montserrat', 'Arial', sans-serif",
        }}>
          <span>Practical AI</span>
          <span>Instructor</span>
        </div>

        {/* ── [Text 8] "for Small Business" ── */}
        {/* left=857707, top=2337206, font=15pt bold, color=#64748B */}
        <div style={{
          position: 'absolute',
          left:     `${ex(857707)}px`,
          top:      `${ey(2337206)}px`,
          width:    `${ex(4000500)}px`,
          height:   `${ey(228600)}px`,
          display:  'flex', alignItems: 'center',
          fontSize: `${ep(15)}px`, fontWeight: 700,
          color:    C.muted,
          letterSpacing: '0.02em',
          fontFamily: "'Montserrat', 'Arial', sans-serif",
        }}>
          for Small Business
        </div>

        {/* ── [Text 9] "This certifies that" ── */}
        {/* left=857707, top=2952598, font=12pt, color=#94A3B8 */}
        <div style={{
          position: 'absolute',
          left:     `${ex(857707)}px`,
          top:      `${ey(2952598)}px`,
          width:    `${ex(5143500)}px`,
          height:   `${ey(191110)}px`,
          display:  'flex', alignItems: 'center',
          fontSize: `${ep(12)}px`, fontWeight: 400,
          color:    C.light,
        }}>
          This certifies that
        </div>

        {/* ══ [DYNAMIC 1] 합격자 성명 ══ */}
        {/* Text 10: left=857707, top=3238805, font=42pt bold, color=#0F172A */}
        <div style={{
          position: 'absolute',
          left:     `${ex(857707)}px`,
          top:      `${ey(3238805)}px`,
          width:    `${ex(5143500)}px`,
          height:   `${ey(648310)}px`,
          display:  'flex', alignItems: 'center',
          fontSize: `${ep(42)}px`, fontWeight: 900,
          color:    C.dark,
          letterSpacing: '0.18em',
          whiteSpace: 'nowrap',
          fontFamily: "'Noto Sans KR', 'Apple SD Gothic Neo', sans-serif",
        }}>
          {nameSpaced}
        </div>

        {/* ── [Text 11] 본문 3줄 ── */}
        {/* left=857707, top=4286707, font=13pt, color=#334155 */}
        <div style={{
          position: 'absolute',
          left:     `${ex(857707)}px`,
          top:      `${ey(4286707)}px`,
          width:    `${ex(5143500)}px`,
          height:   `${ey(876910)}px`,
          display:  'flex', flexDirection: 'column', justifyContent: 'center',
          fontSize: `${ep(13)}px`, fontWeight: 400,
          color:    C.slate,
          lineHeight: 1.65,
        }}>
          <span>귀하는 인공지능 기술을 활용한 생성형 AI를 활용한</span>
          <span>상세페이지, 영상 제작, 소상공인 맞춤형 업무별 프롬프트 설계 역량을</span>
          <span>
            인정받아{' '}
            <span style={{ fontWeight: 700, color: C.teal }}>
              &apos;소상공인 실전 AI 지도사&apos;
            </span>
            {' '}자격을 취득하였습니다.
          </span>
        </div>

        {/* ── [Text 13] "주요 역량 분야 KEY COMPETENCIES" ── */}
        {/* left=857707, top=5333695 */}
        <div style={{
          position: 'absolute',
          left:   `${ex(857707)}px`,
          top:    `${ey(5333695)}px`,
          width:  `${ex(5143500)}px`,
          height: `${ey(229514)}px`,
          display: 'flex', alignItems: 'center', gap: `${ep(6)}px`,
          backgroundColor: C.white,
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

        {/* ── [Shape 12] 구분선 #E2E8F0 ── */}
        {/* left=857707, top=5638190, width=5143500, height=19202 */}
        <div style={{
          position: 'absolute',
          left:   `${ex(857707)}px`,
          top:    `${ey(5638190)}px`,
          width:  `${ex(5143500)}px`,
          height: `${Math.max(1, ey(19202))}px`,
          backgroundColor: C.divider,
        }} />

        {/* ── [Shape 14 + Image 4] 역량1: 원+아이콘+텍스트 ── */}
        {/* Circle: left=857707, top=5905195, w=342900, h=342900 */}
        <div style={{
          position: 'absolute',
          left:   `${ex(857707)}px`,
          top:    `${ey(5905195)}px`,
          width:  `${ex(342900)}px`,
          height: `${ey(342900)}px`,
          borderRadius: '50%',
          backgroundColor: C.teal,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/cert-assets/icon1.png" alt=""
            style={{ width: `${ex(152705)}px`, height: `${ey(152705)}px`, objectFit: 'contain' }} />
        </div>
        {/* Text 15: left=1333195, top=5982005 */}
        <div style={{
          position: 'absolute',
          left:     `${ex(1333195)}px`,
          top:      `${ey(5982005)}px`,
          width:    `${ex(4668012)}px`,
          height:   `${ey(228600)}px`,
          display:  'flex', alignItems: 'center',
          fontSize: `${ep(12)}px`, fontWeight: 400, color: C.slate,
        }}>
          생성형 AI를 활용한 상세페이지 제작
        </div>

        {/* ── [Shape 16 + Image 5] 역량2 ── */}
        <div style={{
          position: 'absolute',
          left:   `${ex(857707)}px`,
          top:    `${ey(6439205)}px`,
          width:  `${ex(342900)}px`,
          height: `${ey(342900)}px`,
          borderRadius: '50%',
          backgroundColor: C.teal,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/cert-assets/icon2.png" alt=""
            style={{ width: `${ex(190195)}px`, height: `${ey(152705)}px`, objectFit: 'contain' }} />
        </div>
        {/* Text 17 */}
        <div style={{
          position: 'absolute',
          left:     `${ex(1333195)}px`,
          top:      `${ey(6515100)}px`,
          width:    `${ex(4668012)}px`,
          height:   `${ey(228600)}px`,
          display:  'flex', alignItems: 'center',
          fontSize: `${ep(12)}px`, fontWeight: 400, color: C.slate,
        }}>
          소상공인 맞춤형 업무별 프롬프트 설계
        </div>

        {/* ── [Shape 18 + Image 6] 역량3 ── */}
        <div style={{
          position: 'absolute',
          left:   `${ex(857707)}px`,
          top:    `${ey(6972300)}px`,
          width:  `${ex(342900)}px`,
          height: `${ey(342900)}px`,
          borderRadius: '50%',
          backgroundColor: C.teal,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/cert-assets/icon3.png" alt=""
            style={{ width: `${ex(152705)}px`, height: `${ey(152705)}px`, objectFit: 'contain' }} />
        </div>
        {/* Text 19 */}
        <div style={{
          position: 'absolute',
          left:     `${ex(1333195)}px`,
          top:      `${ey(7048195)}px`,
          width:    `${ex(4668012)}px`,
          height:   `${ey(228600)}px`,
          display:  'flex', alignItems: 'center',
          fontSize: `${ep(12)}px`, fontWeight: 400, color: C.slate,
        }}>
          생성형 AI 활용한 영상 제작
        </div>

        {/* ── 하단 구분선 (Image 2) ── */}
        {/* left=857707, top=7715707, width=5143500, height=9144 */}
        <div style={{
          position: 'absolute',
          left:   `${ex(857707)}px`,
          top:    `${ey(7715707)}px`,
          width:  `${ex(5143500)}px`,
          height: `${Math.max(1, ey(9144))}px`,
          backgroundColor: C.divider,
        }} />

        {/* ── [Shape 5] QR 영역 흰색 박스 ── */}
        {/* left=857707, top=8001000, width=666598, height=666598 */}
        <div style={{
          position: 'absolute',
          left:   `${ex(857707)}px`,
          top:    `${ey(8001000)}px`,
          width:  `${ex(666598)}px`,
          height: `${ey(666598)}px`,
          backgroundColor: C.white,
          border: `1px solid ${C.divider}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {/* ── [Image 7] QR 이미지 ── */}
          {/* left=1014070, top=8134502, width=352044, height=400507 */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/cert-assets/qr-placeholder.png" alt="QR"
            style={{
              width:  `${ex(352044)}px`,
              height: `${ey(400507)}px`,
              objectFit: 'contain', display: 'block',
            }} />
        </div>

        {/* ── [Text 20] "VERIFY NO." 레이블 ── */}
        {/* left=1666951, top=8048549, font=9pt bold, color=#64748B */}
        <div style={{
          position: 'absolute',
          left:     `${ex(1666951)}px`,
          top:      `${ey(8048549)}px`,
          width:    `${ex(1905610)}px`,
          height:   `${ey(143561)}px`,
          display:  'flex', alignItems: 'center',
          fontSize: `${ep(9)}px`, fontWeight: 700,
          color:    C.muted,
          fontFamily: "'Montserrat', 'Arial', sans-serif",
          letterSpacing: '0.05em',
        }}>
          VERIFY NO.
        </div>

        {/* ══ [DYNAMIC 2] 자격증 번호 ══ */}
        {/* Text 21: left=1666951, top=8258176, font=12pt bold, color=#1E293B */}
        <div style={{
          position: 'absolute',
          left:     `${ex(1666951)}px`,
          top:      `${ey(8258176)}px`,
          width:    `${ex(1905610)}px`,
          height:   `${ey(181051)}px`,
          display:  'flex', alignItems: 'center',
          fontSize: `${ep(12)}px`, fontWeight: 700,
          color:    C.navy,
          fontFamily: "'Montserrat', 'Arial', sans-serif",
          letterSpacing: '0.04em',
          whiteSpace: 'nowrap',
        }}>
          {cert.certificate_number}
        </div>

        {/* ── [Text 22] URL ── */}
        {/* left=1666951, top=8506208, font=8pt, color=#00BFA5 */}
        <div style={{
          position: 'absolute',
          left:     `${ex(1666951)}px`,
          top:      `${ey(8506208)}px`,
          width:    `${ex(1905610)}px`,
          height:   `${ey(133502)}px`,
          display:  'flex', alignItems: 'center',
          fontSize: `${ep(8)}px`, fontWeight: 400,
          color:    C.teal,
          fontFamily: "'Montserrat', 'Arial', sans-serif",
          letterSpacing: '0.02em',
        }}>
          http://aiagent.io.kr/
        </div>

        {/* ══ [DYNAMIC 3] ISSUE DATE ══ */}
        {/* Text 23: left=3810305, top=8220000, font=9pt bold, color=#64748B, right-aligned */}
        <div style={{
          position: 'absolute',
          left:     `${ex(3810305)}px`,
          top:      `${ey(8220000)}px`,
          width:    `${ex(2190902)}px`,
          height:   `${ey(143561)}px`,
          display:  'flex', alignItems: 'center', justifyContent: 'flex-end',
          fontSize: `${ep(9)}px`, fontWeight: 700,
          color:    C.muted,
          fontFamily: "'Montserrat', 'Arial', sans-serif",
          letterSpacing: '0.03em',
          whiteSpace: 'nowrap',
        }}>
          ISSUE DATE: {issueDate}
        </div>

        {/* ── [Text 25] Director 서명 ── */}
        {/* left=3810305, top=8415908, font=9pt, color=#1E293B, right-aligned */}
        <div style={{
          position: 'absolute',
          left:     `${ex(3810305)}px`,
          top:      `${ey(8415908)}px`,
          width:    `${ex(2190902)}px`,
          height:   `${ey(181051)}px`,
          display:  'flex', alignItems: 'center', justifyContent: 'flex-end',
          fontSize: `${ep(9)}px`, fontWeight: 400,
          color:    C.navy,
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
