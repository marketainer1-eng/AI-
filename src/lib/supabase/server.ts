/**
 * 서버(서버 컴포넌트 / Server Action / Route Handler)용 Supabase 클라이언트
 *
 * - async 함수: Next.js 의 `cookies()` 가 비동기이므로 await 필요
 * - 서버에서만 실행되므로 민감한 쿠키 접근 가능
 * - Database 제네릭으로 완전한 타입 추론 지원
 *
 * 사용 예:
 *   const supabase = await createClient()
 *   const { data: { user } } = await supabase.auth.getUser()
 */
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/types/database'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        /** 현재 요청의 모든 쿠키를 배열로 반환 */
        getAll() {
          return cookieStore.getAll()
        },
        /** 응답 쿠키에 세션 정보 기록 */
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          } catch {
            /**
             * 서버 컴포넌트 렌더링 중 쿠키를 set 하면 에러가 발생할 수 있음.
             * 미들웨어(middleware.ts)가 세션 갱신을 담당하므로 여기서는 무시.
             */
          }
        },
      },
    }
  )
}

/**
 * 서비스 롤 클라이언트 (관리자 전용 서버 작업)
 *
 * ⚠️  RLS 를 완전히 우회합니다 — 서버 코드에서만 사용할 것.
 *    절대 클라이언트 번들에 포함되지 않도록 주의.
 *
 * 사용 예 (Server Action 내부):
 *   const supabase = createServiceClient()
 *   await supabase.from('certificates').insert({ ... })
 */
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

export function createServiceClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
}
