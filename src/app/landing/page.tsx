import type { Metadata } from 'next'
import LandingClient from './LandingClient'
// 페이지 레벨로 import 하여 globals.css(Tailwind) 이후에 로드되도록 보장합니다.
// (라우트 세그먼트 CSS 이므로 /landing 경로에서만 적용됩니다.)
import './style.css'

export const metadata: Metadata = {
  title:
    'AI 에이전트를 활용한 데이터 분석 및 마케팅 분석 과정 | AI 에이전트 협회 아카데미',
  description:
    '숫자를 읽는 사람을 넘어, AI 에이전트로 실행을 설계하는 사람으로. 데이터 분석부터 멀티에이전트 오케스트레이션까지. 국가공인 자격 연계 실전 과정.',
}

/**
 * AI 에이전트 협회 아카데미 단독 랜딩페이지 (/landing)
 *
 * 원본 정적 사이트를 그대로 이식했습니다.
 * - 폰트 / 아이콘 / 스타일은 원본과 동일하게 외부 링크 및 정적 CSS 로 로드합니다.
 * - 인터랙션 동작은 LandingClient 에서 처리합니다.
 */
export default function LandingPage() {
  return (
    <>
      {/* 원본 index.html <head> 의 외부 리소스 (Next.js 가 <head> 로 호이스팅) */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link
        rel="preconnect"
        href="https://fonts.gstatic.com"
        crossOrigin="anonymous"
      />
      <link
        href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;500;600;700;800;900&family=Inter:wght@400;500;600;700;800;900&display=swap"
        rel="stylesheet"
      />
      <link
        rel="stylesheet"
        href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css"
      />

      <LandingClient />
    </>
  )
}
