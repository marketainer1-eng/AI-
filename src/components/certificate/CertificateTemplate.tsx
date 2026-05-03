/**
 * CertificateTemplate - KAIA (AI에이전트협회) 공식 자격증
 *
 * html2canvas 로 캡처해 PDF 로 변환하는 자격증 DOM 템플릿.
 * KAIA 로고 기반 청록/시안 컬러 화사한 디자인
 */

import { forwardRef } from 'react'
import type { CertificateData } from '@/lib/certificate/access'

interface CertificateTemplateProps {
  data: CertificateData
}

/** A4 비율 (794 × 1123 px @ 96 dpi) */
const WIDTH  = 794
const HEIGHT = 1123

const CertificateTemplate = forwardRef<HTMLDivElement, CertificateTemplateProps>(
  ({ data }, ref) => {
    const { cert, user, exam, application } = data

    const issuedDate = new Date(cert.issued_at).toLocaleDateString('ko-KR', {
      year: 'numeric', month: 'long', day: 'numeric', timeZone: 'Asia/Seoul',
    })
    const examDate = new Date(exam.exam_start_at).toLocaleDateString('ko-KR', {
      year: 'numeric', month: 'long', day: 'numeric', timeZone: 'Asia/Seoul',
    })

    // KAIA 로고 색상 팔레트 (청록/시안 계열)
    const C = {
      // 주색상
      primary:      '#00C8E0',   // 메인 시안
      primaryLight: '#4DE8F8',   // 밝은 시안
      primaryDark:  '#0096B0',   // 진한 시안
      primaryDeep:  '#006880',   // 딥 틸
      // 보조
      accent:       '#00E5FF',   // 강조 네온
      accentSoft:   '#80F0FF',   // 부드러운 강조
      // 배경
      bgWhite:      '#ffffff',
      bgLight:      '#F0FEFF',
      bgMid:        '#E0FAFF',
      bgAccent:     '#C8F5FF',
      // 텍스트
      textDark:     '#003D50',
      textMid:      '#005A70',
      textGray:     '#4A8A9A',
      textLight:    '#90C8D8',
      // 특수
      gold:         '#FFD700',
      goldLight:    '#FFF0A0',
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
            background: `linear-gradient(150deg, #ffffff 0%, #F2FEFF 35%, #E0FAFF 65%, #CCF6FF 100%)`,
            position: 'relative',
            overflow: 'hidden',
            boxSizing: 'border-box',
          }}
        >

          {/* ── 배경 장식: 대형 원 (우상단) ── */}
          <div style={{
            position: 'absolute',
            top: '-160px', right: '-160px',
            width: '500px', height: '500px',
            borderRadius: '50%',
            background: `radial-gradient(circle, rgba(0,200,224,0.18) 0%, rgba(0,229,255,0.06) 55%, transparent 70%)`,
            pointerEvents: 'none',
          }} />

          {/* ── 배경 장식: 중형 원 (좌하단) ── */}
          <div style={{
            position: 'absolute',
            bottom: '-120px', left: '-120px',
            width: '420px', height: '420px',
            borderRadius: '50%',
            background: `radial-gradient(circle, rgba(0,150,176,0.15) 0%, rgba(0,200,224,0.05) 55%, transparent 70%)`,
            pointerEvents: 'none',
          }} />

          {/* ── 배경 장식: 소형 원 (중앙좌) ── */}
          <div style={{
            position: 'absolute',
            top: '40%', left: '-60px',
            width: '200px', height: '200px',
            borderRadius: '50%',
            background: `radial-gradient(circle, rgba(0,229,255,0.10) 0%, transparent 70%)`,
            pointerEvents: 'none',
          }} />

          {/* ── 상단 그라데이션 띠 (두꺼운) ── */}
          <div style={{
            position: 'absolute',
            top: 0, left: 0, right: 0, height: '10px',
            background: `linear-gradient(90deg, ${C.primaryDeep} 0%, ${C.primaryDark} 15%, ${C.primary} 35%, ${C.accent} 50%, ${C.primary} 65%, ${C.primaryDark} 85%, ${C.primaryDeep} 100%)`,
          }} />

          {/* ── 하단 그라데이션 띠 (두꺼운) ── */}
          <div style={{
            position: 'absolute',
            bottom: 0, left: 0, right: 0, height: '10px',
            background: `linear-gradient(90deg, ${C.primaryDeep} 0%, ${C.primaryDark} 15%, ${C.primary} 35%, ${C.accent} 50%, ${C.primary} 65%, ${C.primaryDark} 85%, ${C.primaryDeep} 100%)`,
          }} />

          {/* ── 좌측 세로 띠 ── */}
          <div style={{
            position: 'absolute',
            top: 0, left: 0, bottom: 0, width: '6px',
            background: `linear-gradient(180deg, ${C.primaryDeep} 0%, ${C.primary} 50%, ${C.primaryDeep} 100%)`,
          }} />

          {/* ── 우측 세로 띠 ── */}
          <div style={{
            position: 'absolute',
            top: 0, right: 0, bottom: 0, width: '6px',
            background: `linear-gradient(180deg, ${C.primaryDeep} 0%, ${C.primary} 50%, ${C.primaryDeep} 100%)`,
          }} />

          {/* ── 외곽 테두리 1 ── */}
          <div style={{
            position: 'absolute', inset: '22px',
            border: `2px solid ${C.primary}`,
            borderRadius: '8px',
            opacity: 0.6,
          }} />

          {/* ── 외곽 테두리 2 (내부 점선) ── */}
          <div style={{
            position: 'absolute', inset: '32px',
            border: `1px dashed ${C.primaryLight}`,
            borderRadius: '6px',
            opacity: 0.35,
          }} />

          {/* ── 네 모서리 장식 (L형) ── */}
          {[
            { top: '18px',    left: '18px',    borderTop: `4px solid ${C.primary}`, borderLeft:  `4px solid ${C.primary}` },
            { top: '18px',    right: '18px',   borderTop: `4px solid ${C.primary}`, borderRight: `4px solid ${C.primary}` },
            { bottom: '18px', left: '18px',    borderBottom: `4px solid ${C.primary}`, borderLeft:  `4px solid ${C.primary}` },
            { bottom: '18px', right: '18px',   borderBottom: `4px solid ${C.primary}`, borderRight: `4px solid ${C.primary}` },
          ].map((s, i) => (
            <div key={i} style={{
              position: 'absolute',
              width: '44px', height: '44px',
              borderRadius: '2px',
              ...s,
            }} />
          ))}

          {/* ── 본문 영역 ── */}
          <div style={{
            position: 'absolute',
            inset: '50px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>

            {/* ── 상단: KAIA 로고 + 협회명 ── */}
            <div style={{ textAlign: 'center', paddingTop: '6px' }}>
              {/* KAIA 로고 이미지 */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/kaia-logo.png"
                alt="KAIA 로고"
                style={{
                  height: '180px',
                  width: 'auto',
                  margin: '0 auto 20px',
                  display: 'block',
                  objectFit: 'contain',
                }}
              />
              {/* 협회명 텍스트 */}
              <p style={{
                fontSize: '22px',
                color: C.primaryDark,
                letterSpacing: '0.2em',
                fontWeight: 700,
                margin: 0,
              }}>
                ✦ AI AGENT ASSOCIATION 공식 인증 ✦
              </p>
            </div>

            {/* ── 중앙 본문 ── */}
            <div style={{
              textAlign: 'center',
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              width: '100%',
            }}>

              {/* 구분선 */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: '14px',
                margin: '20px 0 22px',
              }}>
                <div style={{ height: '1.5px', flex: 1, background: `linear-gradient(90deg, transparent, ${C.primaryLight})` }} />
                <span style={{ color: C.primary, fontSize: '18px' }}>✦</span>
                <div style={{ height: '1.5px', flex: 1, background: `linear-gradient(90deg, ${C.primaryLight}, transparent)` }} />
              </div>

              {/* 자격증 제목 배너 */}
              <div style={{
                background: `linear-gradient(135deg, ${C.primaryDeep} 0%, ${C.primaryDark} 25%, ${C.primary} 55%, ${C.accent} 80%, ${C.primaryLight} 100%)`,
                borderRadius: '12px',
                padding: '0',
                margin: '0 0 6px',
                boxShadow: `0 6px 28px rgba(0,200,224,0.45), inset 0 1px 0 rgba(255,255,255,0.25)`,
                position: 'relative',
                overflow: 'hidden',
                width: '100%',
                height: '70px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                {/* 배너 내부 광택 */}
                <div style={{
                  position: 'absolute',
                  top: 0, left: 0, right: 0, height: '50%',
                  background: 'linear-gradient(180deg, rgba(255,255,255,0.22) 0%, transparent 100%)',
                  borderRadius: '12px 12px 0 0',
                  pointerEvents: 'none',
                }} />
                {/* 좌우 빛 반사 */}
                <div style={{
                  position: 'absolute',
                  bottom: 0, left: 0, right: 0, height: '40%',
                  background: 'linear-gradient(0deg, rgba(0,0,0,0.08) 0%, transparent 100%)',
                  pointerEvents: 'none',
                }} />
                <h1 style={{
                  fontSize: '34px',
                  fontWeight: 900,
                  color: '#ffffff',
                  margin: 0,
                  letterSpacing: '0.3em',
                  textShadow: '0 2px 16px rgba(0,0,0,0.25), 0 0 40px rgba(255,255,255,0.35)',
                  position: 'relative',
                  lineHeight: 1,
                  textAlign: 'center',
                }}>
                  자 격 증
                </h1>
              </div>
              <p style={{
                fontSize: '20px',
                color: C.textLight,
                letterSpacing: '0.42em',
                margin: '0 0 22px',
                fontWeight: 600,
              }}>CERTIFICATE OF QUALIFICATION</p>

              {/* 자격증명 박스 */}
              <div style={{
                background: `linear-gradient(135deg, rgba(0,229,255,0.15) 0%, rgba(0,200,224,0.08) 50%, rgba(0,150,176,0.12) 100%)`,
                border: `2px solid ${C.primary}`,
                borderRadius: '10px',
                padding: '18px 48px',
                margin: '0 auto 24px',
                display: 'inline-block',
                boxShadow: `0 6px 30px rgba(0,200,224,0.22), inset 0 1px 0 rgba(255,255,255,0.9), 0 0 0 1px rgba(0,229,255,0.2)`,
                position: 'relative',
              }}>
                {/* 박스 상단 반짝이 효과 */}
                <div style={{
                  position: 'absolute',
                  top: 0, left: '20%', right: '20%', height: '1px',
                  background: `linear-gradient(90deg, transparent, rgba(255,255,255,0.8), transparent)`,
                }} />
                <p style={{
                  margin: 0,
                  fontSize: '24px',
                  fontWeight: 800,
                  color: C.textDark,
                  letterSpacing: '0.04em',
                }}>
                  {exam.title}
                </p>
              </div>

              {/* 수여 문구 */}
              <p style={{
                fontSize: '15px',
                color: C.textGray,
                margin: '0 0 26px',
                lineHeight: 2.1,
                letterSpacing: '0.06em',
              }}>
                위 사람은 본 시험에서 소정의 절차를 거쳐<br />
                합격 기준을 충족하였으므로 이 자격증을 수여합니다.
              </p>

              {/* 성명 영역 */}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                margin: '0 0 12px',
              }}>
                <span style={{
                  fontSize: '27px',
                  color: C.textGray,
                  letterSpacing: '0.3em',
                  marginBottom: '8px',
                  fontWeight: 600,
                }}>성  명</span>
                {/* 이름 강조 박스 */}
                <div style={{
                  position: 'relative',
                  padding: '4px 36px 8px',
                }}>
                  <span style={{
                    fontSize: '52px',
                    fontWeight: 900,
                    color: C.textDark,
                    letterSpacing: '0.25em',
                    display: 'block',
                    lineHeight: 1.1,
                  }}>
                    {user.full_name}
                  </span>
                  {/* 이름 하단 라인 */}
                  <div style={{
                    position: 'absolute',
                    bottom: 0, left: '10%', right: '10%', height: '3px',
                    background: `linear-gradient(90deg, transparent, ${C.primary}, ${C.accent}, ${C.primary}, transparent)`,
                    borderRadius: '2px',
                  }} />
                </div>
              </div>

              {/* 점수 표시 삭제됨 */}

              {/* 구분선 */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: '14px',
                margin: '0 0 22px',
              }}>
                <div style={{ height: '1px', flex: 1, background: `linear-gradient(90deg, transparent, ${C.textLight})` }} />
                <span style={{ color: C.textLight, fontSize: '10px' }}>◆</span>
                <div style={{ height: '1px', flex: 1, background: `linear-gradient(90deg, ${C.textLight}, transparent)` }} />
              </div>

              {/* 시험일 / 발급일 */}
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                gap: '0',
                fontSize: '13px',
                background: `linear-gradient(135deg, rgba(0,200,224,0.06), rgba(0,229,255,0.03))`,
                border: `1px solid rgba(0,200,224,0.2)`,
                borderRadius: '8px',
                padding: '28px 0',
                overflow: 'hidden',
              }}>
                <div style={{ textAlign: 'center', flex: 1 }}>
                  <p style={{
                    margin: '0 0 10px',
                    fontWeight: 700,
                    color: C.primaryDark,
                    letterSpacing: '0.18em',
                    fontSize: '15px',
                  }}>
                    시  험  일
                  </p>
                  <p style={{ margin: 0, color: C.textDark, letterSpacing: '0.04em', fontSize: '19px' }}>
                    {examDate}
                  </p>
                </div>
                <div style={{ width: '1px', background: `linear-gradient(180deg, transparent, ${C.primaryLight}, transparent)`, margin: '0 8px' }} />
                <div style={{ textAlign: 'center', flex: 1 }}>
                  <p style={{
                    margin: '0 0 10px',
                    fontWeight: 700,
                    color: C.primaryDark,
                    letterSpacing: '0.18em',
                    fontSize: '15px',
                  }}>
                    발  급  일
                  </p>
                  <p style={{ margin: 0, color: C.textDark, letterSpacing: '0.04em', fontSize: '19px' }}>
                    {issuedDate}
                  </p>
                </div>
              </div>

            </div>{/* /중앙 본문 */}

            {/* ── 하단: 자격증 번호 + 직인 ── */}
            <div style={{
              width: '100%',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-end',
              paddingBottom: '6px',
            }}>
              {/* 자격증 번호 */}
              <div>
                <p style={{
                  margin: '0 0 3px',
                  fontSize: '9px',
                  color: C.textLight,
                  letterSpacing: '0.22em',
                  fontFamily: 'monospace',
                  fontWeight: 600,
                }}>
                  CERTIFICATE NO.
                </p>
                <p style={{
                  margin: '0 0 3px',
                  fontSize: '14px',
                  fontWeight: 800,
                  color: C.primary,
                  letterSpacing: '0.12em',
                  fontFamily: 'monospace',
                }}>
                  {cert.certificate_number}
                </p>
                <p style={{
                  margin: 0,
                  fontSize: '8px',
                  color: C.textLight,
                  fontFamily: 'monospace',
                  letterSpacing: '0.04em',
                }}>
                  UUID: {cert.id}
                </p>
              </div>

              {/* KAIA 공식 직인 SVG */}
              <div style={{ textAlign: 'center' }}>
                <svg
                  width="140" height="140"
                  viewBox="0 0 140 140"
                  xmlns="http://www.w3.org/2000/svg"
                  style={{ display: 'block', margin: '0 auto', filter: 'drop-shadow(0 0 10px rgba(0,200,224,0.5))' }}
                >
                  <defs>
                    {/* 외곽 그라데이션 */}
                    <linearGradient id="sealGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%"   stopColor="#006880" />
                      <stop offset="30%"  stopColor="#0096B0" />
                      <stop offset="55%"  stopColor="#00C8E0" />
                      <stop offset="75%"  stopColor="#00E5FF" />
                      <stop offset="100%" stopColor="#0096B0" />
                    </linearGradient>
                    {/* 내부 배경 그라데이션 */}
                    <radialGradient id="innerGrad" cx="50%" cy="40%" r="60%">
                      <stop offset="0%"   stopColor="#ffffff" />
                      <stop offset="60%"  stopColor="#E8FAFE" />
                      <stop offset="100%" stopColor="#C8F5FF" />
                    </radialGradient>
                    {/* 원형 텍스트 경로 */}
                    <path id="outerTextPath"
                      d="M 70,70 m -52,0 a 52,52 0 1,1 104,0 a 52,52 0 1,1 -104,0"
                    />
                    <path id="innerTextPath"
                      d="M 70,70 m -40,0 a 40,40 0 1,0 80,0 a 40,40 0 1,0 -80,0"
                    />
                  </defs>

                  {/* ── 가장 바깥 링 (장식) ── */}
                  <circle cx="70" cy="70" r="68" fill="none" stroke="url(#sealGrad)" strokeWidth="1.5" strokeDasharray="4 3" opacity="0.6" />

                  {/* ── 외곽 두꺼운 링 ── */}
                  <circle cx="70" cy="70" r="63" fill="none" stroke="url(#sealGrad)" strokeWidth="5" />

                  {/* ── 내부 얇은 링 ── */}
                  <circle cx="70" cy="70" r="56" fill="none" stroke="#00C8E0" strokeWidth="1" opacity="0.5" />

                  {/* ── 내부 배경 원 ── */}
                  <circle cx="70" cy="70" r="54" fill="url(#innerGrad)" />

                  {/* ── 별 모양 장식 8개 (외곽) ── */}
                  {[0,45,90,135,180,225,270,315].map((deg, i) => {
                    const rad = (deg * Math.PI) / 180
                    const x = 70 + 59 * Math.cos(rad)
                    const y = 70 + 59 * Math.sin(rad)
                    return <circle key={i} cx={x} cy={y} r="2.2" fill="#00C8E0" opacity="0.9" />
                  })}

                  {/* ── 원형 상단 텍스트: AI 에이전트 협회 ── */}
                  <text fontSize="9" fontWeight="700" fill="#006880" letterSpacing="2.5" fontFamily="'Noto Sans KR', sans-serif">
                    <textPath href="#outerTextPath" startOffset="8%">
                      AI 에이전트 협회 · KAIA · AI AGENT ASSOCIATION ·
                    </textPath>
                  </text>

                  {/* ── 중앙 KAIA 로고 이미지 ── */}
                  <image
                    href="/kaia-logo.png"
                    x="22" y="28"
                    width="96" height="52"
                    preserveAspectRatio="xMidYMid meet"
                  />

                  {/* ── 중앙 하단 "공식인증" 텍스트 ── */}
                  <text
                    x="70" y="94"
                    textAnchor="middle"
                    fontSize="10"
                    fontWeight="800"
                    fill="#0096B0"
                    letterSpacing="3"
                    fontFamily="'Noto Sans KR', sans-serif"
                  >
                    공 식 인 증
                  </text>

                  {/* ── 하단 구분선 ── */}
                  <line x1="34" y1="100" x2="106" y2="100" stroke="#00C8E0" strokeWidth="0.8" opacity="0.6" />

                  {/* ── 하단 텍스트 ── */}
                  <text
                    x="70" y="112"
                    textAnchor="middle"
                    fontSize="7.5"
                    fontWeight="600"
                    fill="#4A8A9A"
                    letterSpacing="1.5"
                    fontFamily="'Noto Sans KR', sans-serif"
                  >
                    OFFICIAL SEAL
                  </text>

                </svg>
                <p style={{
                  margin: '4px 0 0',
                  fontSize: '10px',
                  color: C.primaryDark,
                  letterSpacing: '0.2em',
                  fontWeight: 700,
                }}>직  인</p>
              </div>
            </div>

          </div>{/* /본문 영역 */}
        </div>{/* /캡처 대상 */}
      </div>
    )
  }
)

CertificateTemplate.displayName = 'CertificateTemplate'
export default CertificateTemplate
