import type { Metadata } from 'next'
import LandingPage from '@/components/landing/LandingPage'

export const metadata: Metadata = {
  title: 'AI 업무 에이전트 구축 기초 과정 | AI 에이전트 협회 아카데미',
  description:
    '반복 업무를 줄이고 AI 에이전트형 업무 체계를 만드는 시작. 컨설팅과 강의 활동까지 확장하세요.',
}

export default function RootPage() {
  return <LandingPage />
}
