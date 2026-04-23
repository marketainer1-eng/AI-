import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

/**
 * 미들웨어 전용 Supabase 클라이언트
 * 세션 갱신 및 쿠키 관리를 담당
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // 세션 갱신 (필수 - 삭제 금지)
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname

  // ── 인증이 필요한 경로 정의 ──────────────────────────────
  const protectedPaths = ['/dashboard', '/exam', '/certificate', '/admin']
  const authPaths = ['/login', '/signup']
  const adminPaths = ['/admin']

  const isProtected = protectedPaths.some((p) => pathname.startsWith(p))
  const isAuthPage = authPaths.some((p) => pathname.startsWith(p))
  const isAdminPage = adminPaths.some((p) => pathname.startsWith(p))

  // 비로그인 상태에서 보호된 경로 접근 → 로그인 페이지로
  if (!user && isProtected) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = '/login'
    redirectUrl.searchParams.set('redirectedFrom', pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // 로그인 상태에서 인증 페이지 접근 → 대시보드로
  if (user && isAuthPage) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = '/dashboard'
    return NextResponse.redirect(redirectUrl)
  }

  // 관리자 페이지 접근 권한 확인
  if (user && isAdminPage) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      const redirectUrl = request.nextUrl.clone()
      redirectUrl.pathname = '/dashboard'
      return NextResponse.redirect(redirectUrl)
    }
  }

  return supabaseResponse
}
