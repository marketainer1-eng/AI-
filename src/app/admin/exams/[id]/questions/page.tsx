export const dynamic = 'force-dynamic'
export const revalidate = 0

import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import AdminQuestionsClient from '@/components/admin/AdminQuestionsClient'
import type { ExamRow, QuestionRow } from '@/types'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function AdminQuestionsPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()

  // 시험 정보 조회
  const { data: exam } = await supabase
    .from('exams')
    .select('*')
    .eq('id', id)
    .single()

  if (!exam) notFound()

  // 문제 목록 조회
  const { data: questions } = await (supabase as any)
    .from('questions')
    .select('*')
    .eq('exam_id', id)
    .order('order_num', { ascending: true })

  return (
    <AdminQuestionsClient
      exam={exam as ExamRow}
      questions={(questions ?? []) as QuestionRow[]}
    />
  )
}
