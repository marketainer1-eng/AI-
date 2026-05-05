export const dynamic = 'force-dynamic'
export const revalidate = 0

import { createClient } from '@/lib/supabase/server'
import AdminCertificatesClient from './AdminCertificatesClient'

export default async function AdminCertificatesPage() {
  const supabase = await createClient()

  const { data: certificates } = await supabase
    .from('certificates')
    .select(`
      *,
      user:users(full_name, email),
      application:exam_applications(
        score,
        exam:exams(title, exam_start_at)
      )
    `)
    .order('issued_at', { ascending: false })

  return (
    <AdminCertificatesClient
      certificates={(certificates ?? []) as any}
    />
  )
}
