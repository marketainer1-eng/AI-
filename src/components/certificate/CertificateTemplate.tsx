/**
 * CertificateTemplate - PDF 디자인 기반 공식 자격증
 * "소상공인 실전 AI 자격증.pdf" 레이아웃 재현
 */

import { forwardRef } from 'react'
import type { CertificateData } from '@/lib/certificate/access'

interface CertificateTemplateProps {
  data: CertificateData
}

/** A4 세로 비율 (794 × 1123 px @ 96 dpi) */
const WIDTH  = 794
const HEIGHT = 1123

const CertificateTemplate = forwardRef<HTMLDivElement, CertificateTemplateProps>(
  ({ data }, ref) => {
    const { cert, user, exam, application } = data

    const issuedDate = new Date(cert.issued_at).toLocaleDateString('ko-KR', {
      year: 'numeric', month: '2-digit', day: '2-digit', timeZone: 'Asia/Seoul',
    }).replace(/\. /g, '. ').replace(/\.$/, '')

    const examDate = new Date(exam.exam_start_at).toLocaleDateString('ko-KR', {
      year: 'numeric', month: '2-digit', day: '2-digit', timeZone: 'Asia/Seoul',
    })

    // 색상 팔레트 (PDF 기반)
    const C = {
      cyan:       '#00C8E0',
      cyanDark:   '#0096B0',
      cyanDeep:   '#006880',
      cyanLight:  '#80EEFF',
      navy:       '#003D50',
      navyMid:    '#005A70',
      gray:       '#5A7A88',
      grayLight:  '#A0BEC8',
      bgMint:     '#F0FEFF',
      bgCircle:   'rgba(0,200,224,0.07)',
      white:      '#ffffff',
    }

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
            fontFamily: "'Noto Sans KR', 'Apple SD Gothic Neo', sans-serif",
            background: C.white,
            position: 'relative',
            overflow: 'hidden',
            boxSizing: 'border-box',
          }}
        >

          {/* ── 배경 대형 원 장식 (좌상단) ── */}
          <div style={{
            position: 'absolute',
            top: '-180px', left: '-180px',
            width: '520px', height: '520px',
            borderRadius: '50%',
            background: `radial-gradient(circle, rgba(0,200,224,0.10) 0%, rgba(0,200,224,0.03) 60%, transparent 75%)`,
            pointerEvents: 'none',
          }} />
          {/* ── 배경 소형 원 (좌중단) ── */}
          <div style={{
            position: 'absolute',
            top: '380px', left: '-100px',
            width: '280px', height: '280px',
            borderRadius: '50%',
            background: `radial-gradient(circle, rgba(0,200,224,0.07) 0%, transparent 70%)`,
            pointerEvents: 'none',
          }} />

          {/* ── 상단 청록색 두꺼운 바 ── */}
          <div style={{
            position: 'absolute',
            top: 0, left: 0, right: 0,
            height: '14px',
            background: `linear-gradient(90deg, ${C.cyanDeep} 0%, ${C.cyanDark} 30%, ${C.cyan} 60%, ${C.cyanLight} 100%)`,
          }} />

          {/* ── 외곽 카드 프레임 ── */}
          <div style={{
            position: 'absolute',
            inset: '26px',
            border: '1.5px solid rgba(0,200,224,0.25)',
            borderRadius: '10px',
            pointerEvents: 'none',
          }} />

          {/* ── 본문 패딩 영역 ── */}
          <div style={{
            position: 'absolute',
            top: '40px', left: '54px', right: '54px', bottom: '36px',
            display: 'flex',
            flexDirection: 'column',
          }}>

            {/* ── 1. 상단: Certificate 라벨 + 우측 로고 ── */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              marginBottom: '10px',
              paddingTop: '10px',
            }}>
              {/* 좌측 Certificate of Qualification */}
              <p style={{
                margin: 0,
                fontSize: '11px',
                fontWeight: 700,
                color: C.cyan,
                letterSpacing: '0.28em',
                textTransform: 'uppercase',
              }}>
                Certificate of Qualification
              </p>
              {/* 우측 KAIA 로고 */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/kaia-logo.png"
                alt="KAIA"
                style={{
                  height: '44px',
                  width: 'auto',
                  objectFit: 'contain',
                  display: 'block',
                }}
              />
            </div>

            {/* ── 2. 메인 타이틀 ── */}
            <div style={{ marginBottom: '18px' }}>
              <h1 style={{
                margin: '0 0 2px',
                fontSize: '52px',
                fontWeight: 900,
                color: C.navy,
                lineHeight: 1.1,
                letterSpacing: '-0.01em',
              }}>
                Practical AI
              </h1>
              <h1 style={{
                margin: '0 0 4px',
                fontSize: '52px',
                fontWeight: 900,
                color: C.navy,
                lineHeight: 1.1,
                letterSpacing: '-0.01em',
              }}>
                Instructor
              </h1>
              <p style={{
                margin: 0,
                fontSize: '22px',
                fontWeight: 700,
                color: C.gray,
                letterSpacing: '0.02em',
              }}>
                for Small Business
              </p>
            </div>

            {/* ── 3. 구분선 ── */}
            <div style={{
              height: '1.5px',
              background: `linear-gradient(90deg, ${C.cyan} 0%, rgba(0,200,224,0.15) 100%)`,
              marginBottom: '18px',
            }} />

            {/* ── 4. This certifies that + 이름 ── */}
            <div style={{ marginBottom: '16px' }}>
              <p style={{
                margin: '0 0 6px',
                fontSize: '13px',
                color: C.grayLight,
                letterSpacing: '0.05em',
              }}>
                This certifies that
              </p>
              <h2 style={{
                margin: 0,
                fontSize: '56px',
                fontWeight: 900,
                color: C.navy,
                letterSpacing: '0.18em',
                lineHeight: 1.0,
              }}>
                {user.full_name.split('').join(' ')}
              </h2>
            </div>

            {/* ── 5. 취득 설명 문구 ── */}
            <p style={{
              margin: '0 0 20px',
              fontSize: '13.5px',
              color: C.gray,
              lineHeight: 1.85,
              letterSpacing: '0.02em',
            }}>
              귀하는 인공지능 기술을 활용한 생성형 AI를 활용한 상세페이지, 영상 제작,
              소상공인 맞춤형 업무별 프롬프트 설계 역량을 인정받아&nbsp;
              <span style={{ color: C.cyan, fontWeight: 700 }}>
                &#39;{exam.title}&#39;
              </span>
              &nbsp;자격을 취득하였습니다.
            </p>

            {/* ── 6. 주요 역량 분야 ── */}
            <div style={{ marginBottom: '20px' }}>
              {/* 섹션 제목 */}
              <div style={{
                display: 'flex',
                alignItems: 'baseline',
                gap: '10px',
                marginBottom: '10px',
              }}>
                <span style={{
                  fontSize: '15px',
                  fontWeight: 800,
                  color: C.navy,
                }}>주요 역량 분야</span>
                <span style={{
                  fontSize: '10px',
                  fontWeight: 600,
                  color: C.grayLight,
                  letterSpacing: '0.15em',
                }}>KEY COMPETENCIES</span>
              </div>
              {/* 구분선 */}
              <div style={{
                height: '1px',
                background: `linear-gradient(90deg, ${C.grayLight}, transparent)`,
                marginBottom: '14px',
              }} />

              {/* 역량 항목들 */}
              {[
                { icon: '✏️', text: '생성형 AI를 활용한 상세페이지 제작' },
                { icon: '🤖', text: '소상공인 맞춤형 업무별 프롬프트 설계' },
                { icon: '🎬', text: '생성형 AI 활용한 영상 제작' },
              ].map((item, i) => (
                <div key={i} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                  marginBottom: '10px',
                }}>
                  {/* 원형 아이콘 배지 */}
                  <div style={{
                    width: '36px', height: '36px',
                    borderRadius: '50%',
                    background: `rgba(0,200,224,0.10)`,
                    border: `1.5px solid rgba(0,200,224,0.3)`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    fontSize: '16px',
                  }}>
                    {item.icon}
                  </div>
                  <span style={{
                    fontSize: '14px',
                    fontWeight: 600,
                    color: C.navyMid,
                    letterSpacing: '0.02em',
                  }}>
                    {item.text}
                  </span>
                </div>
              ))}
            </div>

            {/* ── 7. 하단 구분선 ── */}
            <div style={{
              height: '1px',
              background: `linear-gradient(90deg, rgba(0,200,224,0.4), transparent)`,
              marginBottom: '16px',
            }} />

            {/* ── 8. 하단: VERIFY NO + QR 아이콘 / ISSUE DATE + Director ── */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              flex: 1,
            }}>

              {/* 좌측: QR 아이콘 + VERIFY NO */}
              <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                {/* QR 스타일 인증 심볼 SVG */}
                <svg width="64" height="64" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
                  {/* 외곽 사각 */}
                  <rect x="1" y="1" width="62" height="62" rx="8" ry="8"
                    fill="none" stroke="#003D50" strokeWidth="2.5"/>
                  {/* 좌상 블록 */}
                  <rect x="8"  y="8"  width="18" height="18" rx="2" fill="#003D50"/>
                  <rect x="11" y="11" width="12" height="12" rx="1" fill="white"/>
                  <rect x="14" y="14" width="6"  height="6"  rx="0.5" fill="#003D50"/>
                  {/* 우상 블록 */}
                  <rect x="38" y="8"  width="18" height="18" rx="2" fill="#003D50"/>
                  <rect x="41" y="11" width="12" height="12" rx="1" fill="white"/>
                  <rect x="44" y="14" width="6"  height="6"  rx="0.5" fill="#003D50"/>
                  {/* 좌하 블록 */}
                  <rect x="8"  y="38" width="18" height="18" rx="2" fill="#003D50"/>
                  <rect x="11" y="41" width="12" height="12" rx="1" fill="white"/>
                  <rect x="14" y="44" width="6"  height="6"  rx="0.5" fill="#003D50"/>
                  {/* 중앙 도트 패턴 */}
                  <rect x="30" y="8"  width="5" height="5" rx="1" fill="#00C8E0"/>
                  <rect x="30" y="16" width="5" height="5" rx="1" fill="#00C8E0"/>
                  <rect x="8"  y="30" width="5" height="5" rx="1" fill="#00C8E0"/>
                  <rect x="16" y="30" width="5" height="5" rx="1" fill="#00C8E0"/>
                  <rect x="30" y="30" width="5" height="5" rx="1" fill="#003D50"/>
                  <rect x="38" y="30" width="5" height="5" rx="1" fill="#00C8E0"/>
                  <rect x="46" y="30" width="5" height="5" rx="1" fill="#003D50"/>
                  <rect x="38" y="38" width="5" height="5" rx="1" fill="#00C8E0"/>
                  <rect x="46" y="46" width="5" height="5" rx="1" fill="#003D50"/>
                  <rect x="38" y="54" width="5" height="5" rx="1" fill="#00C8E0"/>
                  <rect x="30" y="46" width="5" height="5" rx="1" fill="#003D50"/>
                  <rect x="54" y="38" width="5" height="5" rx="1" fill="#00C8E0"/>
                </svg>

                <div>
                  <p style={{
                    margin: '0 0 3px',
                    fontSize: '10px',
                    color: C.grayLight,
                    letterSpacing: '0.15em',
                    fontWeight: 600,
                  }}>VERIFY NO.</p>
                  <p style={{
                    margin: '0 0 4px',
                    fontSize: '16px',
                    fontWeight: 800,
                    color: C.navy,
                    letterSpacing: '0.08em',
                    fontFamily: 'monospace',
                  }}>
                    {cert.certificate_number}
                  </p>
                  <p style={{
                    margin: 0,
                    fontSize: '10px',
                    color: C.cyan,
                    fontWeight: 600,
                    letterSpacing: '0.03em',
                  }}>
                    http://aiagent.io.kr/
                  </p>
                </div>
              </div>

              {/* 우측: ISSUE DATE + Director + 직인 */}
              <div style={{ textAlign: 'right' }}>
                <p style={{
                  margin: '0 0 4px',
                  fontSize: '11px',
                  color: C.gray,
                  letterSpacing: '0.05em',
                }}>
                  ISSUE DATE: {issuedDate}
                </p>

                {/* 서명선 */}
                <div style={{
                  height: '1px',
                  background: C.grayLight,
                  marginBottom: '6px',
                  width: '200px',
                  marginLeft: 'auto',
                }} />

                <p style={{
                  margin: '0 0 10px',
                  fontSize: '12px',
                  fontWeight: 700,
                  color: C.navy,
                  letterSpacing: '0.04em',
                }}>
                  Director of AI 에이전트 협회
                </p>

                {/* 직인 SVG */}
                <svg
                  width="100" height="100"
                  viewBox="0 0 100 100"
                  xmlns="http://www.w3.org/2000/svg"
                  style={{ display: 'block', marginLeft: 'auto', filter: 'drop-shadow(0 0 6px rgba(0,200,224,0.35))' }}
                >
                  <defs>
                    <linearGradient id="sg2" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%"   stopColor="#006880"/>
                      <stop offset="50%"  stopColor="#00C8E0"/>
                      <stop offset="100%" stopColor="#006880"/>
                    </linearGradient>
                    <path id="tp2" d="M50,50 m-38,0 a38,38 0 1,1 76,0 a38,38 0 1,1 -76,0"/>
                  </defs>
                  {/* 점선 외곽 */}
                  <circle cx="50" cy="50" r="48" fill="none" stroke="#00C8E0" strokeWidth="1" strokeDasharray="3 2.5" opacity="0.5"/>
                  {/* 외곽 링 */}
                  <circle cx="50" cy="50" r="44" fill="none" stroke="url(#sg2)" strokeWidth="4"/>
                  {/* 내부 링 */}
                  <circle cx="50" cy="50" r="38" fill="none" stroke="#00C8E0" strokeWidth="0.8" opacity="0.4"/>
                  {/* 내부 배경 */}
                  <circle cx="50" cy="50" r="37" fill="#F0FEFF"/>
                  {/* 별 장식 12개 */}
                  {Array.from({length: 12}).map((_, i) => {
                    const angle = (i * 30 - 90) * Math.PI / 180
                    const x = 50 + 41 * Math.cos(angle)
                    const y = 50 + 41 * Math.sin(angle)
                    return <circle key={i} cx={x} cy={y} r="1.8" fill="#00C8E0" opacity="0.8"/>
                  })}
                  {/* 원형 텍스트 */}
                  <text fontSize="7" fontWeight="700" fill="#006880" letterSpacing="1.8"
                    fontFamily="'Noto Sans KR', sans-serif">
                    <textPath href="#tp2" startOffset="5%">
                      AI 에이전트 협회 · KAIA · AI AGENT ASSOCIATION ·
                    </textPath>
                  </text>
                  {/* 중앙 로고 이미지 */}
                  <image href="/kaia-logo.png" x="14" y="22" width="72" height="38"
                    preserveAspectRatio="xMidYMid meet"/>
                  {/* 공식인증 텍스트 */}
                  <text x="50" y="74" textAnchor="middle"
                    fontSize="7.5" fontWeight="800" fill="#0096B0" letterSpacing="2.5"
                    fontFamily="'Noto Sans KR', sans-serif">
                    공 식 인 증
                  </text>
                  {/* 하단 선 */}
                  <line x1="24" y1="79" x2="76" y2="79" stroke="#00C8E0" strokeWidth="0.7" opacity="0.5"/>
                  {/* OFFICIAL SEAL */}
                  <text x="50" y="88" textAnchor="middle"
                    fontSize="6" fontWeight="600" fill="#4A8A9A" letterSpacing="1.2"
                    fontFamily="sans-serif">
                    OFFICIAL SEAL
                  </text>
                </svg>
              </div>
            </div>

          </div>{/* /본문 */}

          {/* ── 하단 청록 얇은 바 ── */}
          <div style={{
            position: 'absolute',
            bottom: 0, left: 0, right: 0,
            height: '6px',
            background: `linear-gradient(90deg, ${C.cyanDeep}, ${C.cyan}, ${C.cyanLight})`,
          }} />

        </div>{/* /캡처 대상 */}
      </div>
    )
  }
)

CertificateTemplate.displayName = 'CertificateTemplate'
export default CertificateTemplate
