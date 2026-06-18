import type { Metadata } from 'next'
import { Noto_Sans_KR } from 'next/font/google'
import GeoPoster from './GeoPoster'

const notoSansKr = Noto_Sans_KR({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800', '900'],
  display: 'swap',
  variable: '--font-noto-sans-kr',
})

const TITLE = 'GEO 전략 과정 | AI 에이전트 협회 아카데미'
const DESCRIPTION =
  'SEO를 넘어 GEO로 — AI 검색·추천 시대, 브랜드 노출 전략의 기준을 바꾸는 국내 최초 공식 GEO 자격 과정. 진단부터 전략 설계, 컨설턴트·강사 활동까지.'

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: [
    'GEO',
    'GEO 전략',
    '생성형 AI 검색 최적화',
    'AI 에이전트 협회',
    'GEO 컨설턴트',
    'GEO 자격 과정',
    'SEO',
  ],
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    type: 'website',
    locale: 'ko_KR',
    siteName: 'AI 에이전트 협회 아카데미',
  },
  twitter: {
    card: 'summary_large_image',
    title: TITLE,
    description: DESCRIPTION,
  },
}

export default function GeoLandingPage() {
  return (
    <div className={notoSansKr.className}>
      <GeoPoster />
    </div>
  )
}
