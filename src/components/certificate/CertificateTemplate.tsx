/**
 * CertificateTemplate - 고급 골드 스타일
 *
 * html2canvas 로 캡처해 PDF 로 변환하는 자격증 DOM 템플릿.
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
            background: 'linear-gradient(160deg, #0a0a0a 0%, #1a1208 40%, #0d0d0d 100%)',
            position: 'relative',
            overflow: 'hidden',
            boxSizing: 'border-box',
          }}
        >

          {/* ── 배경 방사형 골드 글로우 ── */}
          <div style={{
            position: 'absolute',
            top: '30%', left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '600px', height: '600px',
            background: 'radial-gradient(circle, rgba(212,175,55,0.08) 0%, transparent 70%)',
            pointerEvents: 'none',
          }} />

          {/* ── 코너 장식 (좌상) ── */}
          {[
            { top: '18px', left: '18px', borderTop: '2px solid #d4af37', borderLeft: '2px solid #d4af37' },
            { top: '18px', right: '18px', borderTop: '2px solid #d4af37', borderRight: '2px solid #d4af37' },
            { bottom: '18px', left: '18px', borderBottom: '2px solid #d4af37', borderLeft: '2px solid #d4af37' },
            { bottom: '18px', right: '18px', borderBottom: '2px solid #d4af37', borderRight: '2px solid #d4af37' },
          ].map((s, i) => (
            <div key={i} style={{
              position: 'absolute',
              width: '48px', height: '48px',
              ...s,
            }} />
          ))}

          {/* ── 외곽 골드 테두리 ── */}
          <div style={{
            position: 'absolute', inset: '28px',
            border: '1px solid rgba(212,175,55,0.5)',
          }} />
          {/* ── 내부 얇은 테두리 ── */}
          <div style={{
            position: 'absolute', inset: '36px',
            border: '1px solid rgba(212,175,55,0.2)',
          }} />

          {/* ── 상단 골드 그라디언트 띠 ── */}
          <div style={{
            position: 'absolute',
            top: 0, left: 0, right: 0, height: '6px',
            background: 'linear-gradient(90deg, #7b5e1a 0%, #d4af37 30%, #f5e07a 50%, #d4af37 70%, #7b5e1a 100%)',
          }} />
          {/* ── 하단 골드 그라디언트 띠 ── */}
          <div style={{
            position: 'absolute',
            bottom: 0, left: 0, right: 0, height: '6px',
            background: 'linear-gradient(90deg, #7b5e1a 0%, #d4af37 30%, #f5e07a 50%, #d4af37 70%, #7b5e1a 100%)',
          }} />

          {/* ── 배경 문양: 큰 골드 별 ── */}
          <div style={{
            position: 'absolute',
            top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            fontSize: '520px',
            color: 'rgba(212,175,55,0.03)',
            fontWeight: 900,
            userSelect: 'none',
            pointerEvents: 'none',
            lineHeight: 1,
          }}>★</div>

          {/* ── 본문 ── */}
          <div style={{
            position: 'absolute',
            inset: '52px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>

            {/* 상단: 엠블럼 + 기관명 */}
            <div style={{ textAlign: 'center', paddingTop: '8px' }}>
              {/* 골드 원형 엠블럼 */}
              <div style={{
                width: '90px', height: '90px',
                background: 'linear-gradient(135deg, #7b5e1a 0%, #d4af37 40%, #f5e07a 60%, #d4af37 80%, #7b5e1a 100%)',
                borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 14px',
                fontSize: '42px',
                boxShadow: '0 0 24px rgba(212,175,55,0.4), inset 0 0 12px rgba(0,0,0,0.3)',
              }}>
                🏆
              </div>

              {/* 기관명 */}
              <p style={{
                fontSize: '11px',
                color: '#d4af37',
                letterSpacing: '0.4em',
                fontWeight: 700,
                textTransform: 'uppercase',
                margin: '0 0 4px',
              }}>
                ✦ CERTIFICATE OF QUALIFICATION ✦
              </p>
              <p style={{
                fontSize: '11px',
                color: 'rgba(212,175,55,0.5)',
                letterSpacing: '0.25em',
                margin: 0,
              }}>
                자격증센터 공식 인증
              </p>
            </div>

            {/* 중앙 */}
            <div style={{
              textAlign: 'center',
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              gap: '0px',
              width: '100%',
            }}>

              {/* 골드 구분선 */}
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                margin: '0 0 28px',
              }}>
                <div style={{ height: '1px', flex: 1, background: 'linear-gradient(90deg, transparent, #d4af37)' }} />
                <span style={{ color: '#d4af37', fontSize: '14px' }}>✦</span>
                <div style={{ height: '1px', flex: 1, background: 'linear-gradient(90deg, #d4af37, transparent)' }} />
              </div>

              {/* 자격증 제목 */}
              <h1 style={{
                fontSize: '64px',
                fontWeight: 900,
                background: 'linear-gradient(180deg, #f5e07a 0%, #d4af37 50%, #9a7a1a 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                margin: '0 0 6px',
                letterSpacing: '0.15em',
                textShadow: 'none',
              }}>
                자 격 증
              </h1>

              {/* 영문 부제 */}
              <p style={{
                fontSize: '12px',
                color: 'rgba(212,175,55,0.6)',
                letterSpacing: '0.3em',
                margin: '0 0 24px',
                fontWeight: 500,
              }}>CERTIFICATE</p>

              {/* 자격증명 박스 */}
              <div style={{
                background: 'linear-gradient(135deg, rgba(212,175,55,0.12), rgba(212,175,55,0.05))',
                border: '1px solid rgba(212,175,55,0.4)',
                borderRadius: '4px',
                padding: '18px 40px',
                margin: '0 auto 28px',
                display: 'inline-block',
                boxShadow: 'inset 0 1px 0 rgba(212,175,55,0.2), 0 4px 20px rgba(0,0,0,0.3)',
              }}>
                <p style={{
                  margin: 0,
                  fontSize: '24px',
                  fontWeight: 800,
                  color: '#f5e07a',
                  letterSpacing: '0.05em',
                }}>
                  {exam.title}
                </p>
              </div>

              {/* 수여 문구 */}
              <p style={{
                fontSize: '15px',
                color: 'rgba(255,255,255,0.65)',
                margin: '0 0 28px',
                lineHeight: 2.0,
                letterSpacing: '0.05em',
              }}>
                위 사람은 본 시험에서 소정의 절차를 거쳐<br />
                합격 기준을 충족하였으므로 이 자격증을 수여합니다.
              </p>

              {/* 성명 */}
              <div style={{
                display: 'flex', alignItems: 'baseline',
                justifyContent: 'center', gap: '16px',
                margin: '0 0 10px',
              }}>
                <span style={{
                  fontSize: '13px',
                  color: 'rgba(212,175,55,0.6)',
                  letterSpacing: '0.15em',
                }}>성  명</span>
                <span style={{
                  fontSize: '42px',
                  fontWeight: 900,
                  color: '#f5e07a',
                  borderBottom: '2px solid #d4af37',
                  paddingBottom: '4px',
                  letterSpacing: '0.2em',
                  textShadow: '0 0 20px rgba(212,175,55,0.3)',
                }}>
                  {user.full_name}
                </span>
              </div>

              {/* 점수 */}
              {application.score !== null && (
                <p style={{
                  fontSize: '13px',
                  color: 'rgba(212,175,55,0.7)',
                  margin: '0 0 24px',
                  letterSpacing: '0.1em',
                }}>
                  취득 점수&nbsp;
                  <strong style={{ color: '#f5e07a' }}>{application.score}점</strong>
                  &nbsp;／&nbsp;
                  합격 기준 {exam.passing_score}점 이상
                </p>
              )}

              {/* 구분선 */}
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                margin: '0 0 24px',
              }}>
                <div style={{ height: '1px', flex: 1, background: 'linear-gradient(90deg, transparent, rgba(212,175,55,0.4))' }} />
                <span style={{ color: 'rgba(212,175,55,0.4)', fontSize: '10px' }}>✦</span>
                <div style={{ height: '1px', flex: 1, background: 'linear-gradient(90deg, rgba(212,175,55,0.4), transparent)' }} />
              </div>

              {/* 시험일 / 발급일 */}
              <div style={{
                display: 'flex', justifyContent: 'center', gap: '60px',
                fontSize: '13px',
              }}>
                <div style={{ textAlign: 'center' }}>
                  <p style={{ margin: '0 0 6px', fontWeight: 700, color: '#d4af37', letterSpacing: '0.15em', fontSize: '11px' }}>
                    시 험 일
                  </p>
                  <p style={{ margin: 0, color: 'rgba(255,255,255,0.7)', letterSpacing: '0.05em' }}>{examDate}</p>
                </div>
                <div style={{ width: '1px', background: 'rgba(212,175,55,0.3)' }} />
                <div style={{ textAlign: 'center' }}>
                  <p style={{ margin: '0 0 6px', fontWeight: 700, color: '#d4af37', letterSpacing: '0.15em', fontSize: '11px' }}>
                    발 급 일
                  </p>
                  <p style={{ margin: 0, color: 'rgba(255,255,255,0.7)', letterSpacing: '0.05em' }}>{issuedDate}</p>
                </div>
              </div>
            </div>

            {/* 하단: 자격증 번호 + 직인 */}
            <div style={{
              width: '100%',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-end',
              paddingBottom: '8px',
            }}>
              {/* 자격증 번호 */}
              <div>
                <p style={{
                  margin: '0 0 4px',
                  fontSize: '10px',
                  color: 'rgba(212,175,55,0.5)',
                  letterSpacing: '0.2em',
                }}>
                  CERTIFICATE NO.
                </p>
                <p style={{
                  margin: 0,
                  fontSize: '13px',
                  fontWeight: 700,
                  color: '#d4af37',
                  letterSpacing: '0.1em',
                  fontFamily: 'monospace',
                }}>
                  {cert.certificate_number}
                </p>
                <p style={{
                  margin: '4px 0 0',
                  fontSize: '9px',
                  color: 'rgba(255,255,255,0.2)',
                  fontFamily: 'monospace',
                }}>
                  UUID: {cert.id}
                </p>
              </div>

              {/* 골드 직인 */}
              <div style={{ textAlign: 'center' }}>
                <div style={{
                  width: '84px', height: '84px',
                  background: 'linear-gradient(135deg, rgba(212,175,55,0.15), rgba(212,175,55,0.05))',
                  border: '2px solid rgba(212,175,55,0.5)',
                  borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 6px',
                  boxShadow: '0 0 16px rgba(212,175,55,0.2)',
                  flexDirection: 'column',
                  gap: '2px',
                }}>
                  <span style={{ fontSize: '22px' }}>印</span>
                  <span style={{ fontSize: '8px', color: '#d4af37', letterSpacing: '0.1em' }}>자격증센터</span>
                </div>
              </div>
            </div>

          </div>{/* /본문 */}
        </div>{/* /캡처 대상 */}
      </div>
    )
  }
)

CertificateTemplate.displayName = 'CertificateTemplate'
export default CertificateTemplate
