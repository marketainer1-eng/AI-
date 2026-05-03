'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { ExamInsert, ExamUpdate, QuestionInsert, QuestionUpdate } from '@/types'

// ─────────────────────────────────────────────────────────────
// 헬퍼: 관리자 권한 확인
// ─────────────────────────────────────────────────────────────
async function requireAdmin() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { supabase, adminError: '인증이 필요합니다.' }

  const { data: profile } = await (supabase as any)
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    return { supabase, adminError: '관리자만 접근 가능합니다.' }
  }

  return { supabase, adminError: null }
}

// ─────────────────────────────────────────────────────────────
// 시험 생성
// ─────────────────────────────────────────────────────────────
export async function createExamAction(formData: FormData) {
  const { supabase, adminError } = await requireAdmin()
  if (adminError) return { error: adminError }

  const questionCountRaw = formData.get('question_count') as string
  const payload: ExamInsert = {
    title:                  formData.get('title') as string,
    description:            (formData.get('description') as string) || null,
    registration_start_at:  formData.get('registration_start_at') as string,
    registration_end_at:    formData.get('registration_end_at') as string,
    exam_start_at:          formData.get('exam_start_at') as string,
    exam_end_at:            formData.get('exam_end_at') as string,
    result_released_at:     (formData.get('result_released_at') as string) || null,
    certificate_issued_at:  (formData.get('certificate_issued_at') as string) || null,
    duration_minutes:       Number(formData.get('duration_minutes')),
    passing_score:          Number(formData.get('passing_score')),
    fee:                    Number(formData.get('fee')),
    max_applicants:         formData.get('max_applicants') ? Number(formData.get('max_applicants')) : null,
    question_count:         questionCountRaw ? Number(questionCountRaw) : null,
    is_active:              formData.get('is_active') === 'true',
  }

  if (!payload.title || !payload.exam_start_at || !payload.exam_end_at) {
    return { error: '필수 항목을 입력해주세요.' }
  }

  const { data, error } = await (supabase as any)
    .from('exams')
    .insert(payload)
    .select()
    .single()

  if (error) {
    console.error('[createExamAction] Supabase error:', JSON.stringify(error))
    return { error: `시험 생성 오류: ${error.message || error.code || '알 수 없는 오류'}` }
  }

  revalidatePath('/admin/exams')
  revalidatePath('/exam/apply')

  return { success: true, exam: data }
}

// ─────────────────────────────────────────────────────────────
// 시험 수정
// ─────────────────────────────────────────────────────────────
export async function updateExamAction(examId: string, formData: FormData) {
  const { supabase, adminError } = await requireAdmin()
  if (adminError) return { error: adminError }

  const questionCountRaw2 = formData.get('question_count') as string
  const payload: ExamUpdate = {
    title:                  formData.get('title') as string,
    description:            (formData.get('description') as string) || null,
    registration_start_at:  formData.get('registration_start_at') as string,
    registration_end_at:    formData.get('registration_end_at') as string,
    exam_start_at:          formData.get('exam_start_at') as string,
    exam_end_at:            formData.get('exam_end_at') as string,
    result_released_at:     (formData.get('result_released_at') as string) || null,
    certificate_issued_at:  (formData.get('certificate_issued_at') as string) || null,
    duration_minutes:       Number(formData.get('duration_minutes')),
    passing_score:          Number(formData.get('passing_score')),
    fee:                    Number(formData.get('fee')),
    max_applicants:         formData.get('max_applicants') ? Number(formData.get('max_applicants')) : null,
    question_count:         questionCountRaw2 ? Number(questionCountRaw2) : null,
    is_active:              formData.get('is_active') === 'true',
  }

  const { data, error } = await (supabase as any)
    .from('exams')
    .update(payload)
    .eq('id', examId)
    .select()
    .single()

  if (error) return { error: '시험 수정 중 오류가 발생했습니다.' }

  revalidatePath('/admin/exams')
  revalidatePath('/exam/apply')
  revalidatePath(`/admin/exams/${examId}/questions`)

  return { success: true, exam: data }
}

// ─────────────────────────────────────────────────────────────
// 시험 삭제
// ─────────────────────────────────────────────────────────────
export async function deleteExamAction(examId: string) {
  const { supabase, adminError } = await requireAdmin()
  if (adminError) return { error: adminError }

  const { error } = await (supabase as any)
    .from('exams')
    .delete()
    .eq('id', examId)

  if (error) return { error: '시험 삭제 중 오류가 발생했습니다.' }

  revalidatePath('/admin/exams')
  revalidatePath('/exam/apply')

  return { success: true }
}

// ─────────────────────────────────────────────────────────────
// 문제 생성
// ─────────────────────────────────────────────────────────────
export async function createQuestionAction(examId: string, formData: FormData) {
  const { supabase, adminError } = await requireAdmin()
  if (adminError) return { error: adminError }

  // 현재 마지막 order_num 조회
  const { data: lastQ } = await (supabase as any)
    .from('questions')
    .select('order_num')
    .eq('exam_id', examId)
    .order('order_num', { ascending: false })
    .limit(1)
    .maybeSingle()

  const nextOrder = (lastQ?.order_num ?? 0) + 1

  // options 파싱: 줄바꿈 구분
  const optionsRaw = (formData.get('options') as string) || ''
  const options = optionsRaw
    .split('\n')
    .map((o) => o.trim())
    .filter(Boolean)

  const payload: QuestionInsert = {
    exam_id:       examId,
    question_type: formData.get('question_type') as QuestionInsert['question_type'],
    question_text: formData.get('question_text') as string,
    options:       options.length > 0 ? options : null,
    correct_answer: formData.get('correct_answer') as string,
    explanation:   (formData.get('explanation') as string) || null,
    score_weight:  Number(formData.get('score_weight') || 1),
    order_num:     nextOrder,
    is_active:     true,
  }

  if (!payload.question_text || !payload.correct_answer) {
    return { error: '문제와 정답을 입력해주세요.' }
  }

  const { data, error } = await (supabase as any)
    .from('questions')
    .insert(payload)
    .select()
    .single()

  if (error) return { error: '문제 생성 중 오류가 발생했습니다.' }

  revalidatePath(`/admin/exams/${examId}/questions`)

  return { success: true, question: data }
}

// ─────────────────────────────────────────────────────────────
// 문제 수정
// ─────────────────────────────────────────────────────────────
export async function updateQuestionAction(
  examId: string,
  questionId: string,
  formData: FormData
) {
  const { supabase, adminError } = await requireAdmin()
  if (adminError) return { error: adminError }

  const optionsRaw = (formData.get('options') as string) || ''
  const options = optionsRaw
    .split('\n')
    .map((o) => o.trim())
    .filter(Boolean)

  const payload: QuestionUpdate = {
    question_type:  formData.get('question_type') as QuestionUpdate['question_type'],
    question_text:  formData.get('question_text') as string,
    options:        options.length > 0 ? options : null,
    correct_answer: formData.get('correct_answer') as string,
    explanation:    (formData.get('explanation') as string) || null,
    score_weight:   Number(formData.get('score_weight') || 1),
    is_active:      formData.get('is_active') === 'true',
  }

  const { data, error } = await (supabase as any)
    .from('questions')
    .update(payload)
    .eq('id', questionId)
    .select()
    .single()

  if (error) return { error: '문제 수정 중 오류가 발생했습니다.' }

  revalidatePath(`/admin/exams/${examId}/questions`)

  return { success: true, question: data }
}

// ─────────────────────────────────────────────────────────────
// 문제 삭제
// ─────────────────────────────────────────────────────────────
export async function deleteQuestionAction(examId: string, questionId: string) {
  const { supabase, adminError } = await requireAdmin()
  if (adminError) return { error: adminError }

  const { error } = await (supabase as any)
    .from('questions')
    .delete()
    .eq('id', questionId)

  if (error) return { error: '문제 삭제 중 오류가 발생했습니다.' }

  revalidatePath(`/admin/exams/${examId}/questions`)

  return { success: true }
}

// ─────────────────────────────────────────────────────────────
// 문제 순서 변경
// ─────────────────────────────────────────────────────────────
export async function reorderQuestionsAction(
  examId: string,
  orderedIds: string[]
) {
  const { supabase, adminError } = await requireAdmin()
  if (adminError) return { error: adminError }

  // 각 문제의 order_num 일괄 업데이트
  const updates = orderedIds.map((id, index) =>
    (supabase as any)
      .from('questions')
      .update({ order_num: index + 1 })
      .eq('id', id)
  )

  await Promise.all(updates)

  revalidatePath(`/admin/exams/${examId}/questions`)

  return { success: true }
}
