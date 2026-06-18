'use client'

import { useRef, useState } from 'react'
import styles from './geo.module.css'

/* ────────────────────────────────────────────────────────────
 * 외부 링크 설정
 * 실제 운영 채널이 확정되면 아래 URL만 교체하면 됩니다.
 * (카카오 채널 / 오픈채팅 / 상담 신청 폼 등)
 * ──────────────────────────────────────────────────────────── */
const LINKS = {
  homepage: 'https://aiagent-academy.kr',
  instructor: 'https://aiagent-academy.kr/geo/instructor', // 강사 인증 문의
  certificate: 'https://aiagent-academy.kr/geo/certificate', // 자격 과정 문의
  agency: 'https://aiagent-academy.kr/geo/agency', // GEO 대행 문의
  consult: 'https://aiagent-academy.kr/geo/consult', // 과정 상담 신청
}

/* ── 인라인 SVG 아이콘 (외부 CDN 의존 제거) ───────────────── */
function Icon({ name, className }: { name: string; className?: string }) {
  const common = {
    className,
    width: '1em',
    height: '1em',
    viewBox: '0 0 24 24',
    fill: 'currentColor',
    'aria-hidden': true,
  }
  switch (name) {
    case 'robot':
      return (
        <svg {...common}>
          <path d="M12 2a1 1 0 0 1 1 1v1h3a3 3 0 0 1 3 3v2h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1v1a3 3 0 0 1-3 3H8a3 3 0 0 1-3-3v-1H4a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h1V7a3 3 0 0 1 3-3h3V3a1 1 0 0 1 1-1Zm-3 9a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3Zm6 0a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3Z" />
        </svg>
      )
    case 'star':
      return (
        <svg {...common}>
          <path d="M12 2.5l2.9 5.88 6.49.94-4.7 4.58 1.11 6.46L12 17.9l-5.8 3.05 1.1-6.46-4.69-4.58 6.49-.94L12 2.5Z" />
        </svg>
      )
    case 'chart':
      return (
        <svg {...common}>
          <path d="M3 3h2v18H3V3Zm4 10h3v8H7v-8Zm5-6h3v14h-3V7Zm5 3h3v11h-3V10Z" />
        </svg>
      )
    case 'award':
      return (
        <svg {...common}>
          <path d="M12 2a6 6 0 0 1 3 11.19V14l1.5 7L12 18.5 7.5 21 9 14v-.81A6 6 0 0 1 12 2Zm0 2a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z" />
        </svg>
      )
    case 'layers':
      return (
        <svg {...common}>
          <path d="M12 2l10 5-10 5L2 7l10-5Zm0 7.24L19.53 5.5 12 1.76 4.47 5.5 12 9.24ZM2 12l10 5 10-5 1.8.9L12 19 2.2 12.9 2 12Zm0 5l10 5 10-5 1.8.9L12 24 2.2 17.9 2 17Z" />
        </svg>
      )
    case 'userCheck':
      return (
        <svg {...common}>
          <path d="M10 4a4 4 0 1 1 0 8 4 4 0 0 1 0-8Zm0 10c4.42 0 8 1.79 8 4v2H2v-2c0-2.21 3.58-4 8-4Zm10.3-3.7l-3.6 3.6-1.7-1.7 1.4-1.4.3.3 2.2-2.2 1.4 1.4Z" />
        </svg>
      )
    case 'qr':
      return (
        <svg {...common} viewBox="0 0 24 24">
          <path d="M3 3h8v8H3V3Zm2 2v4h4V5H5Zm-2 8h8v8H3v-8Zm2 2v4h4v-4H5ZM13 3h8v8h-8V3Zm2 2v4h4V5h-4Zm-2 8h2v2h-2v-2Zm2 2h2v2h-2v-2Zm2-2h2v2h-2v-2Zm2 2h2v2h-2v-2Zm-4 2h2v2h-2v-2Zm2 2h2v2h-2v-2Zm2-2h2v2h-2v-2Z" />
        </svg>
      )
    case 'arrow':
      return (
        <svg {...common}>
          <path d="M4 11h12.17l-5.59-5.59L12 4l8 8-8 8-1.41-1.41L16.17 13H4v-2Z" />
        </svg>
      )
    case 'download':
      return (
        <svg {...common}>
          <path d="M12 3v10.17l3.59-3.58L17 11l-5 5-5-5 1.41-1.41L11 13.17V3h2ZM5 19h14v2H5v-2Z" />
        </svg>
      )
    default:
      return null
  }
}

export default function GeoPoster() {
  const posterRef = useRef<HTMLElement>(null)
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    if (!posterRef.current || saving) return
    setSaving(true)
    try {
      const { default: html2canvas } = await import('html2canvas')
      const canvas = await html2canvas(posterRef.current, {
        backgroundColor: '#0a1628',
        scale: 2,
        useCORS: true,
      })
      const link = document.createElement('a')
      link.download = 'geo-academy-poster.png'
      link.href = canvas.toDataURL('image/png')
      link.click()
    } catch (err) {
      console.error('포스터 이미지 저장 실패:', err)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className={styles.page}>
      <article ref={posterRef} className={styles.poster}>
        {/* ① 상단 브랜드 */}
        <header className={styles.brandBar}>
          <div className={styles.brandLogoWrap}>
            <Icon name="robot" />
          </div>
          <div className={styles.brandText}>
            <div className={styles.brandName}>AI AGENT ASSOCIATION</div>
            <div className={styles.brandSub}>AI 에이전트 협회 아카데미</div>
          </div>
          <div className={styles.courseBadge}>GEO 전략 과정</div>
        </header>

        {/* ② 메인 헤드라인 */}
        <section className={styles.hero}>
          <div className={styles.heroTag}>
            <Icon name="star" />
            국내 최초 공식 GEO 자격 과정
          </div>
          <h1 className={styles.heroHeadline}>
            AI 검색·추천 시대,
            <br />
            <em>브랜드 노출 전략의 기준</em>을
            <br />
            바꾸는 GEO 과정
          </h1>
          <p className={styles.heroSub}>
            <strong>SEO를 넘어 GEO로</strong> — 진단부터 전략 설계까지
            <br />
            컨설턴트·강사 활동까지 확장하는 실전 커리큘럼
          </p>
        </section>

        <div className={styles.divider} />

        {/* ③ 핵심 키워드 4카드 */}
        <section className={styles.section}>
          <div className={styles.sectionTitle}>Core Curriculum</div>
          <div className={styles.cardGrid}>
            <div className={styles.kwCard}>
              <div className={styles.kwIcon}>🔍</div>
              <div className={styles.kwName}>GEO 진단</div>
              <div className={styles.kwDesc}>
                AI 추천 엔진 기준
                <br />
                브랜드 노출 현황 분석
              </div>
            </div>
            <div className={styles.kwCard}>
              <div className={styles.kwIcon}>🧭</div>
              <div className={styles.kwName}>전략 설계</div>
              <div className={styles.kwDesc}>
                생성형 AI 검색 최적화
                <br />
                맞춤 전략 수립
              </div>
            </div>
            <div className={styles.kwCard}>
              <div className={styles.kwIcon}>🎓</div>
              <div className={styles.kwName}>컨설턴트 자격</div>
              <div className={styles.kwDesc}>
                공식 GEO 컨설턴트
                <br />
                협회 인증 취득
              </div>
            </div>
            <div className={styles.kwCard}>
              <div className={styles.kwIcon}>🎤</div>
              <div className={styles.kwName}>강사 활동 확장</div>
              <div className={styles.kwDesc}>
                강사 인증 연결
                <br />
                교육·대행 듀얼 운영
              </div>
            </div>
          </div>
        </section>

        <div className={styles.divider} />

        {/* ④ 차별점 3줄 */}
        <section className={styles.diffSection}>
          <div className={styles.sectionTitle}>Why GEO Academy</div>
          <div className={styles.diffList}>
            <div className={styles.diffItem}>
              <span className={styles.diffIcon}>
                <Icon name="chart" />
              </span>
              <div className={styles.diffText}>
                협회 개발 <span>GEO 진단 사이트</span> 제공 — 실전 즉시 활용
              </div>
            </div>
            <div className={styles.diffItem}>
              <span className={styles.diffIcon}>
                <Icon name="award" />
              </span>
              <div className={styles.diffText}>
                <span>컨설턴트 자격 + 강사 인증</span> 동시 연결 가능
              </div>
            </div>
            <div className={styles.diffItem}>
              <span className={styles.diffIcon}>
                <Icon name="layers" />
              </span>
              <div className={styles.diffText}>
                교육 + 대행 <span>듀얼 운영</span> 모델로 수익 구조 확장
              </div>
            </div>
          </div>
        </section>

        {/* ⑤ 임팩트 배너 */}
        <div className={styles.impactBanner}>
          <div className={styles.impactQuote}>
            <strong>
              직접 배우고 싶다면 교육으로,
              <br />
              빠르게 적용하고 싶다면 대행으로
            </strong>
            GEO 하나로 두 가지 비즈니스 모델이 완성됩니다
          </div>
          <div className={styles.impactTag}>✦ AI AGENT ASSOCIATION ACADEMY ✦</div>
        </div>

        {/* ⑥ CTA */}
        <section className={styles.ctaSection}>
          <div className={styles.ctaLabel}>지금 바로 시작하세요</div>
          <a
            className={styles.ctaMainBtn}
            href={LINKS.instructor}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Icon name="userCheck" />
            강사 인증 문의 →
          </a>
          <div className={styles.ctaGrid}>
            <a
              className={styles.ctaSubBtn}
              href={LINKS.certificate}
              target="_blank"
              rel="noopener noreferrer"
            >
              자격 과정
              <br />
              문의
            </a>
            <a
              className={styles.ctaSubBtn}
              href={LINKS.agency}
              target="_blank"
              rel="noopener noreferrer"
            >
              GEO 대행
              <br />
              문의
            </a>
            <a
              className={styles.ctaSubBtn}
              href={LINKS.consult}
              target="_blank"
              rel="noopener noreferrer"
            >
              과정 상담
              <br />
              신청
            </a>
          </div>
          <a
            className={styles.qrRow}
            href={LINKS.homepage}
            target="_blank"
            rel="noopener noreferrer"
          >
            <div className={styles.qrBox}>
              <Icon name="qr" />
            </div>
            <div className={styles.qrInfo}>
              <div className={styles.qrTitle}>공식 홈페이지 바로가기</div>
              <div className={styles.qrUrl}>aiagent-academy.kr / GEO 과정 안내</div>
            </div>
            <div className={styles.qrArrow}>
              <Icon name="arrow" />
            </div>
          </a>
        </section>

        {/* 푸터 */}
        <footer className={styles.posterFooter}>
          <span className={styles.footerLogo}>
            AI AGENT ASSOCIATION ACADEMY © 2025
          </span>
          <div className={styles.footerDots}>
            <div className={styles.footerDot} />
            <div className={styles.footerDot} />
            <div className={styles.footerDot} />
          </div>
        </footer>
      </article>

      {/* 이미지로 저장 (SNS 공유용) */}
      <div className={styles.saveBar}>
        <button
          type="button"
          className={styles.saveBtn}
          onClick={handleSave}
          disabled={saving}
        >
          <Icon name="download" />
          {saving ? '이미지 생성 중…' : '포스터 이미지로 저장'}
        </button>
      </div>
    </div>
  )
}
