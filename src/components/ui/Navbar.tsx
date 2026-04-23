'use client'

import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { UserRole } from '@/types'

interface NavbarProps {
  role?: UserRole
  fullName?: string
}

export default function Navbar({ role, fullName }: NavbarProps) {
  const router = useRouter()
  const pathname = usePathname()

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const navLinks =
    role === 'admin'
      ? [
          { href: '/admin', label: '대시보드' },
          { href: '/admin/applications', label: '신청 관리' },
          { href: '/admin/exams', label: '시험 관리' },
          { href: '/admin/users', label: '회원 관리' },
          { href: '/admin/certificates', label: '자격증 관리' },
        ]
      : [
          { href: '/dashboard', label: '내 현황' },
          { href: '/exam/apply', label: '시험 신청' },
          { href: '/exam/result', label: '결과 조회' },
          { href: '/certificate', label: '자격증' },
        ]

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* 로고 */}
          <Link href={role === 'admin' ? '/admin' : '/dashboard'} className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
                />
              </svg>
            </div>
            <span className="font-bold text-gray-900 text-sm">
              자격증 시험 관리
              {role === 'admin' && (
                <span className="ml-1 text-xs text-indigo-600 font-normal">[관리자]</span>
              )}
            </span>
          </Link>

          {/* 내비게이션 링크 */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  pathname === link.href
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* 사용자 정보 + 로그아웃 */}
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-600 hidden sm:block">
              {fullName}님
            </span>
            <button
              onClick={handleSignOut}
              className="text-sm text-gray-500 hover:text-gray-700 px-3 py-1.5 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
            >
              로그아웃
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}
