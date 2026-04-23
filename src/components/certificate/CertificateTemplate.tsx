/**
 * CertificateTemplate
 *
 * html2canvas 로 캡처해 PDF 로 변환하는 자격증 DOM 템플릿.
 * 화면에는 숨겨두고(sr-only 와 유사한 off-screen 배치),
 * ref 를 외부에 노출해 캡처 시 사용합니다.
 */

import { forwardRef } from 'react'
import type { CertificateData } from '@/lib/certificate/access'

interface CertificateTemplateProps {
  data: CertificateData
}

/** A4 비율 (794 × 1123 px @ 96 dpi) — html2canvas scale 2 적용 시 실제 1588×2246 */
const WIDTH  = 794
const HEIGHT = 1123

const CertificateTemplate = forwardRef<HTMLDivElement, CertificateTemplateProps>(
  ({ data }, ref) => {
    const { cert, user, exam, application } = data

    const issuedDate = new Date(cert.issued_at).toLocaleDateString('ko-KR', {
      year: 'numeric', month: 'long', day: 'numeric',
    })
    const examDate = new Date(exam.exam_start_at).toLocaleDateString('ko-KR', {
      year: 'numeric', month: 'long', day: 'numeric',
    })

    return (
      /* 화면 밖으로 절대 배치 — 레이아웃에 영향 없음 */
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
            background: '#ffffff',
            position: 'relative',
            overflow: 'hidden',
            boxSizing: 'border-box',
          }}
        >
          {/* ── 외곽 이중 테두리 ── */}
          <div style={{
            position: 'absolute', inset: '24px',
            border: '3px solid #4338ca',
            borderRadius: '4px',
          }} />
          <div style={{
            position: 'absolute', inset: '32px',
            border: '1px solid #a5b4fc',
            borderRadius: '2px',
          }} />

          {/* ── 배경 워터마크 ── */}
          <div style={{
            position: 'absolute',
            top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            fontSize: '200px',
            color: '#e0e7ff',
            fontWeight: 900,
            letterSpacing: '-0.05em',
            userSelect: 'none',
            pointerEvents: 'none',
            whiteSpace: 'nowrap',
          }}>
            ✦
          </div>

          {/* ── 상단 장식 띠 ── */}
          <div style={{
            position: 'absolute',
            top: 0, left: 0, right: 0,
            height: '8px',
            background: 'linear-gradient(90deg, #4338ca 0%, #7c3aed 50%, #4338ca 100%)',
          }} />

          {/* ── 하단 장식 띠 ── */}
          <div style={{
            position: 'absolute',
            bottom: 0, left: 0, right: 0,
            height: '8px',
            background: 'linear-gradient(90deg, #4338ca 0%, #7c3aed 50%, #4338ca 100%)',
          }} />

          {/* ── 본문 영역 ── */}
          <div style={{
            position: 'absolute',
            inset: '48px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>

            {/* 상단: 로고 + 기관명 */}
            <div style={{ textAlign: 'center', paddingTop: '16px' }}>
              <div style={{
                width: '72px', height: '72px',
                background: 'linear-gradient(135deg, #4338ca, #7c3aed)',
                borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 12px',
                fontSize: '36px',
              }}>
                🏆
              </div>
              <p style={{
                fontSize: '13px',
                color: '#6366f1',
                letterSpacing: '0.25em',
                fontWeight: 600,
                textTransform: 'uppercase',
                margin: 0,
              }}>
                CERTIFICATE OF QUALIFICATION
              </p>
            </div>

            {/* 중앙: 핵심 내용 */}
            <div style={{ textAlign: 'center', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '0px' }}>

              {/* 자격증 제목 */}
              <h1 style={{
                fontSize: '48px',
                fontWeight: 900,
                color: '#1e1b4b',
                margin: '0 0 8px',
                letterSpacing: '-0.02em',
              }}>
                자 격 증
              </h1>

              {/* 구분선 */}
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px',
                margin: '16px 0',
              }}>
                <div style={{ height: '1px', width: '80px', background: '#c7d2fe' }} />
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#6366f1' }} />
                <div style={{ height: '1px', width: '80px', background: '#c7d2fe' }} />
              </div>

              {/* 자격증명 */}
              <div style={{
                background: 'linear-gradient(135deg, #ede9fe, #e0e7ff)',
                border: '1px solid #c7d2fe',
                borderRadius: '8px',
                padding: '16px 48px',
                margin: '0 auto 32px',
                display: 'inline-block',
              }}>
                <p style={{ margin: 0, fontSize: '26px', fontWeight: 800, color: '#3730a3' }}>
                  {exam.title}
                </p>
              </div>

              {/* 수여 문구 */}
              <p style={{ fontSize: '16px', color: '#4b5563', margin: '0 0 24px', lineHeight: 1.8 }}>
                위 사람은 본 시험에서 소정의 절차를 거쳐<br />
                합격 기준을 충족하였으므로 이 자격증을 수여합니다.
              </p>

              {/* 성명 */}
              <div style={{
                display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: '12px',
                margin: '0 0 8px',
              }}>
                <span style={{ fontSize: '14px', color: '#6b7280' }}>성명</span>
                <span style={{
                  fontSize: '36px', fontWeight: 900, color: '#111827',
                  borderBottom: '2px solid #6366f1',
                  paddingBottom: '2px',
                  letterSpacing: '0.1em',
                }}>
                  {user.full_name}
                </span>
              </div>

              {/* 점수 */}
              {application.score !== null && (
                <p style={{ fontSize: '14px', color: '#6b7280', margin: '0 0 32px' }}>
                  취득 점수: <strong style={{ color: '#4338ca' }}>{application.score}점</strong>
                  {'  '}|{'  '}
                  합격 기준: {exam.passing_score}점 이상
                </p>
              )}

              {/* 구분선 */}
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px',
                margin: '8px 0 32px',
              }}>
                <div style={{ height: '1px', width: '120px', background: '#e5e7eb' }} />
              </div>

              {/* 시험일 / 발급일 */}
              <div style={{
                display: 'flex', justifyContent: 'center', gap: '48px',
                fontSize: '14px', color: '#6b7280',
              }}>
                <div style={{ textAlign: 'center' }}>
                  <p style={{ margin: '0 0 4px', fontWeight: 600, color: '#374151' }}>시험일</p>
                  <p style={{ margin: 0 }}>{examDate}</p>
                </div>
                <div style={{ width: '1px', background: '#e5e7eb' }} />
                <div style={{ textAlign: 'center' }}>
                  <p style={{ margin: '0 0 4px', fontWeight: 600, color: '#374151' }}>발급일</p>
                  <p style={{ margin: 0 }}>{issuedDate}</p>
                </div>
              </div>
            </div>

            {/* 하단: 자격증 번호 + 직인 자리 */}
            <div style={{
              width: '100%',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-end',
              paddingBottom: '16px',
            }}>
              {/* 자격증 번호 */}
              <div>
                <p style={{ margin: '0 0 4px', fontSize: '11px', color: '#9ca3af', letterSpacing: '0.1em' }}>
                  CERTIFICATE NO.
                </p>
                <p style={{
                  margin: 0, fontSize: '12px', fontWeight: 700,
                  color: '#4338ca', letterSpacing: '0.05em',
                  fontFamily: 'monospace',
                }}>
                  {cert.certificate_number}
                </p>
                <p style={{ margin: '4px 0 0', fontSize: '10px', color: '#d1d5db', fontFamily: 'monospace' }}>
                  UUID: {cert.id}
                </p>
              </div>

              {/* 기관 직인 자리 */}
              <div style={{ textAlign: 'center' }}>
                <div style={{
                  width: '80px', height: '80px',
                  border: '2px solid #e5e7eb',
                  borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 6px',
                  color: '#d1d5db', fontSize: '28px',
                }}>
                  印
                </div>
                <p style={{ margin: 0, fontSize: '12px', color: '#9ca3af', fontWeight: 600 }}>
                  자격증센터
                </p>
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
