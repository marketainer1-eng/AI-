/**
 * 브라우저(클라이언트 컴포넌트)용 Supabase 클라이언트
 *
 * - 'use client' 컴포넌트, 커스텀 훅에서 사용
 * - 쿠키 기반 세션을 @supabase/ssr 이 자동 관리
 * - Database 제네릭으로 완전한 타입 추론 지원
 *
 * 사용 예:
 *   const supabase = createClient()
 *   const { data } = await supabase.from('exams').select('*')
 */
import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/database'

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
