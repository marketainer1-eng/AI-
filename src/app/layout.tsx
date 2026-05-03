import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '자격증 시험 관리 시스템',
  description: '시험 신청부터 자격증 발급까지 한 번에',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ko">
      <body className="antialiased">
        {children}
      </body>
    </html>
  )
}
