/**
 * POST /api/auth/session-refresh
 *
 * 클라이언트가 결과 페이지로 이동하기 전에
 * Supabase 세션 쿠키를 강제로 갱신(refresh)하는 엔드포인트.
 *
 * 시험 제출(POST /api/exam/submit) 응답 후 바로 window.location.href 로
 * 이동하면 미들웨어가 세션을 인식하지 못해 /login 으로 리다이렉트되는
 * 문제를 방지합니다.
 */

import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/types'

export async function POST() {
  try {
    const cookieStore = await cookies()

    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => cookieStore.getAll(),
          setAll: (list) =>
            list.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            ),
        },
      }
    )

    // getUser() 호출이 토큰 refresh를 트리거하고
    // 갱신된 쿠키가 Set-Cookie 헤더로 응답에 포함됨
    const { data: { user } } = await supabase.auth.getUser()

    return NextResponse.json({
      ok: true,
      authenticated: !!user,
    })
  } catch (err) {
    console.error('[session-refresh] error:', err)
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}
