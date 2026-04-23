import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

/**
 * 루트 경로: 로그인 여부에 따라 리다이렉트
 */
export default async function RootPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    // 역할에 따라 분기
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role === 'admin') redirect('/admin')
    else redirect('/dashboard')
  }

  redirect('/login')
}
