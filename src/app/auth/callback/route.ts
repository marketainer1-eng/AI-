/**
 * Supabase 이메일 인증 콜백 라우트
 *
 * Supabase가 이메일 인증 링크를 보낼 때 redirect URL로 이 경로를 사용합니다.
 * code를 받아 세션으로 교환한 뒤 /dashboard로 리다이렉트합니다.
 *
 * Supabase Dashboard → Authentication → URL Configuration →
 *   Site URL: https://your-domain.com
 *   Redirect URLs에 추가: https://your-domain.com/auth/callback
 */
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import type { Database } from '@/types/database'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'
  const error = searchParams.get('error')
  const errorDescription = searchParams.get('error_description')

  // Supabase가 에러를 파라미터로 보낸 경우
  if (error) {
    console.error('[auth/callback] error:', error, errorDescription)
    const loginUrl = new URL('/login', origin)
    loginUrl.searchParams.set('error', error)
    return NextResponse.redirect(loginUrl)
  }

  if (code) {
    const cookieStore = await cookies()

    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) => {
                cookieStore.set(name, value, options)
              })
            } catch {
              // 서버 컴포넌트에서 호출 시 발생할 수 있는 에러 무시
            }
          },
        },
      }
    )

    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

    if (!exchangeError) {
      // 세션 교환 성공 → 원래 목적지 또는 대시보드로 이동
      const redirectTo = next.startsWith('/') ? new URL(next, origin) : new URL('/dashboard', origin)
      return NextResponse.redirect(redirectTo)
    }

    console.error('[auth/callback] exchangeCodeForSession error:', exchangeError)
  }

  // code 없거나 교환 실패 → 로그인으로
  return NextResponse.redirect(new URL('/login', origin))
}
