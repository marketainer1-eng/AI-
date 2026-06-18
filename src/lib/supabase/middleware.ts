/**
 * 미들웨어 전용 Supabase 유틸
 *
 * 역할:
 *  1. 매 요청마다 Supabase 세션 토큰을 갱신 (refresh)
 *  2. 로그인 여부 및 사용자 역할에 따라 라우팅 보호
 *
 * 주의:
 *  - middleware.ts 의 `updateSession()` 에서만 호출
 *  - 서버 컴포넌트나 Server Action 에서는 server.ts 를 사용할 것
 */
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import type { Database } from '@/types/database'

// ── 라우팅 규칙 상수 ──────────────────────────────────────────
/** 로그인 없이 접근 가능한 공개 경로 (prefix 매칭) */
const PUBLIC_PATHS = ['/login', '/signup']

/** 로그인이 필요한 보호된 경로 (prefix 매칭) */
const PROTECTED_PATHS = ['/dashboard', '/exam', '/certificate', '/admin']

/** 관리자만 접근 가능한 경로 (prefix 매칭) */
const ADMIN_PATHS = ['/admin']

// ──────────────────────────────────────────────────────────────

function matchesPrefix(pathname: string, prefixes: string[]): boolean {
  return prefixes.some((p) => pathname === p || pathname.startsWith(p + '/'))
}

export async function updateSession(request: NextRequest): Promise<NextResponse> {
  /**
   * supabaseResponse 를 NextResponse.next() 로 초기화하고
   * 이후 setAll() 에서 갱신된 쿠키를 동일 객체에 덮어씀.
   * 이 객체를 최종 반환해야 세션이 올바르게 전달됨.
   */
  const supabaseResponse = NextResponse.next({ request })

  // Supabase 환경변수가 설정되지 않은 경우(예: 공개 랜딩 전용 배포)
  // 세션 처리를 건너뛰고 요청을 그대로 통과시킨다.
  // 보호 경로는 어차피 페이지/서버 액션 단에서 다시 인증을 확인한다.
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!supabaseUrl || !supabaseAnonKey) {
    return supabaseResponse
  }

  const supabase = createServerClient<Database>(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          // 요청 쿠키에 기록 (이후 미들웨어 체인이 참조)
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          // ⚠️ 중요: NextResponse.next()를 새로 만들지 말고
          //   기존 supabaseResponse의 cookies에만 덮어써야
          //   이전에 설정된 헤더/쿠키가 유실되지 않음
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  /**
   * ⚠️  getUser() 를 반드시 호출해야 합니다.
   *     이 호출이 토큰 갱신(refresh)을 트리거합니다.
   *     getSession() 은 토큰을 갱신하지 않으므로 사용 금지.
   */
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  // ── 1. 비로그인 → 보호 경로 접근 시 로그인으로 리다이렉트 ──
  if (!user && matchesPrefix(pathname, PROTECTED_PATHS)) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = '/login'
    redirectUrl.searchParams.set('redirectedFrom', pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // ── 2. 로그인 → 인증 페이지 접근 시 대시보드로 ────────────
  if (user && matchesPrefix(pathname, PUBLIC_PATHS)) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = '/dashboard'
    return NextResponse.redirect(redirectUrl)
  }

  // ── 3. 관리자 전용 경로 접근 권한 확인 ───────────────────
  if (user && matchesPrefix(pathname, ADMIN_PATHS)) {
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (((profile as any)?.role !== 'admin')) {
      const redirectUrl = request.nextUrl.clone()
      redirectUrl.pathname = '/dashboard'
      return NextResponse.redirect(redirectUrl)
    }
  }

  return supabaseResponse
}
