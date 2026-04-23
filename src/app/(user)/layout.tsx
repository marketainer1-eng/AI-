import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Navbar from '@/components/ui/Navbar'
import type { UserRole } from '@/types'

export default async function UserLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // supabase.from() 의 제네릭 추론을 위해 명시적 타입 단언 사용
  const { data: profile } = await supabase
    .from('users')
    .select('full_name, role')
    .eq('id', user.id)
    .single() as { data: { full_name: string; role: UserRole } | null; error: unknown }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar role={profile?.role} fullName={profile?.full_name} />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  )
}
