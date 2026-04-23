import { createClient } from '@/lib/supabase/server'
import AdminExamsClient from '@/components/admin/AdminExamsClient'
import type { ExamRow } from '@/types'

export default async function AdminExamsPage() {
  const supabase = await createClient()

  const { data: exams } = await supabase
    .from('exams')
    .select('*')
    .order('exam_start_at', { ascending: false })

  return <AdminExamsClient exams={(exams ?? []) as ExamRow[]} />
}
