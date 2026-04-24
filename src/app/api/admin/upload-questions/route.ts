import { NextRequest, NextResponse } from 'next/server'
import * as XLSX from 'xlsx'
import { createClient } from '@/lib/supabase/server'

// ─────────────────────────────────────────────────────────────
// 타입
// ─────────────────────────────────────────────────────────────
interface ParsedQuestion {
  order_num: number
  question_text: string
  options: string[]          // 보기 목록 (최대 4개, 빈 값 제외)
  correct_answer: string
}

interface UploadResult {
  total: number
  inserted: number
  skipped: number
  errors: string[]
}

// ─────────────────────────────────────────────────────────────
// 관리자 권한 확인
// ─────────────────────────────────────────────────────────────
async function checkAdmin(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false

  const { data: profile } = await (supabase as any)
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  return profile?.role === 'admin'
}

// ─────────────────────────────────────────────────────────────
// 엑셀 파싱
// ─────────────────────────────────────────────────────────────
function parseExcel(buffer: ArrayBuffer): {
  questions: ParsedQuestion[]
  parseErrors: string[]
} {
  const questions: ParsedQuestion[] = []
  const parseErrors: string[] = []

  const workbook = XLSX.read(buffer, { type: 'array' })

  // ── 시트 존재 확인 ─────────────────────────────────────────
  const sheetNames = workbook.SheetNames
  if (sheetNames.length < 2) {
    parseErrors.push('엑셀 파일에 시트1(문제)과 시트2(정답)가 모두 있어야 합니다.')
    return { questions, parseErrors }
  }

  // ── 시트1: 문제 파싱 ───────────────────────────────────────
  // 헤더: 문항번호 | 문제 | 보기1 | 보기2 | 보기3 | 보기4
  const questionSheet = workbook.Sheets[sheetNames[0]]
  const questionRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(
    questionSheet,
    { defval: '' }
  )

  // 헤더 키 정규화 (공백·특수문자 제거)
  const normalizeKey = (k: string) => String(k).trim().replace(/\s+/g, '')

  // ── 시트2: 정답 파싱 ───────────────────────────────────────
  // 헤더: 문항번호 | 정답
  const answerSheet = workbook.Sheets[sheetNames[1]]
  const answerRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(
    answerSheet,
    { defval: '' }
  )

  // 정답 맵 { 문항번호(string) → 정답 }
  const answerMap: Record<string, string> = {}
  for (const row of answerRows) {
    const keys = Object.keys(row).map(normalizeKey)
    const rawKeys = Object.keys(row)

    // 문항번호 키 탐색
    const numKeyRaw = rawKeys.find((k) =>
      normalizeKey(k).includes('문항번호') || normalizeKey(k).includes('번호') || normalizeKey(k) === 'no' || normalizeKey(k).toLowerCase() === 'no'
    )
    // 정답 키 탐색
    const ansKeyRaw = rawKeys.find((k) =>
      normalizeKey(k).includes('정답') || normalizeKey(k).toLowerCase() === 'answer'
    )

    if (!numKeyRaw || !ansKeyRaw) continue

    const num = String(row[numKeyRaw]).trim()
    const ans = String(row[ansKeyRaw]).trim()
    if (num && ans) {
      answerMap[num] = ans
    }
  }

  if (Object.keys(answerMap).length === 0) {
    parseErrors.push('시트2(정답)에서 데이터를 읽을 수 없습니다. 헤더가 "문항번호", "정답"인지 확인하세요.')
    return { questions, parseErrors }
  }

  // ── 문제 행 처리 ───────────────────────────────────────────
  for (let i = 0; i < questionRows.length; i++) {
    const row = questionRows[i]
    const rawKeys = Object.keys(row)

    // 문항번호 키 탐색
    const numKeyRaw = rawKeys.find((k) =>
      normalizeKey(k).includes('문항번호') || normalizeKey(k).includes('번호') || normalizeKey(k).toLowerCase() === 'no'
    )
    // 문제 키 탐색
    const qKeyRaw = rawKeys.find((k) =>
      normalizeKey(k).includes('문제') || normalizeKey(k).toLowerCase() === 'question'
    )
    // 보기 키 탐색 (보기1~4 또는 보기_1~보기_4)
    const optionKeysRaw = [1, 2, 3, 4].map((n) =>
      rawKeys.find((k) =>
        normalizeKey(k) === `보기${n}` ||
        normalizeKey(k) === `보기_${n}` ||
        normalizeKey(k).toLowerCase() === `option${n}` ||
        normalizeKey(k) === `①②③④`[n - 1]
      )
    )

    if (!numKeyRaw) {
      parseErrors.push(`${i + 2}행: 문항번호 열을 찾을 수 없습니다.`)
      continue
    }
    if (!qKeyRaw) {
      parseErrors.push(`${i + 2}행: 문제 열을 찾을 수 없습니다.`)
      continue
    }

    const orderNum = parseInt(String(row[numKeyRaw]).trim(), 10)
    const questionText = String(row[qKeyRaw]).trim()

    if (isNaN(orderNum)) {
      parseErrors.push(`${i + 2}행: 문항번호가 숫자가 아닙니다 (값: ${row[numKeyRaw]})`)
      continue
    }
    if (!questionText) {
      parseErrors.push(`${orderNum}번 문제: 문제 텍스트가 비어 있습니다.`)
      continue
    }

    // 보기 목록 (빈 값 제외)
    const options = optionKeysRaw
      .map((k) => (k ? String(row[k]).trim() : ''))
      .filter(Boolean)

    // 정답 매핑
    const correctAnswer = answerMap[String(orderNum)]
    if (!correctAnswer) {
      parseErrors.push(`${orderNum}번 문제: 시트2(정답)에 해당 문항번호가 없습니다.`)
      continue
    }

    questions.push({
      order_num: orderNum,
      question_text: questionText,
      options,
      correct_answer: correctAnswer,
    })
  }

  // order_num 기준 정렬
  questions.sort((a, b) => a.order_num - b.order_num)

  return { questions, parseErrors }
}

// ─────────────────────────────────────────────────────────────
// POST /api/admin/upload-questions
// ─────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()

    // 권한 확인
    const isAdmin = await checkAdmin(supabase)
    if (!isAdmin) {
      return NextResponse.json({ error: '관리자만 접근 가능합니다.' }, { status: 403 })
    }

    // FormData 파싱
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const examId = formData.get('examId') as string | null
    const replaceExisting = formData.get('replaceExisting') === 'true'

    if (!file) {
      return NextResponse.json({ error: '파일이 없습니다.' }, { status: 400 })
    }
    if (!examId) {
      return NextResponse.json({ error: 'examId가 없습니다.' }, { status: 400 })
    }

    // 파일 타입 확인
    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.ms-excel',                                           // .xls
      'application/octet-stream',
    ]
    const fileName = file.name.toLowerCase()
    if (!fileName.endsWith('.xlsx') && !fileName.endsWith('.xls')) {
      return NextResponse.json(
        { error: '.xlsx 또는 .xls 파일만 업로드 가능합니다.' },
        { status: 400 }
      )
    }

    // 파일 크기 제한 (5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: '파일 크기는 5MB 이하여야 합니다.' }, { status: 400 })
    }

    // 시험 존재 확인
    const { data: exam } = await (supabase as any)
      .from('exams')
      .select('id, title')
      .eq('id', examId)
      .single()

    if (!exam) {
      return NextResponse.json({ error: '해당 시험을 찾을 수 없습니다.' }, { status: 404 })
    }

    // 엑셀 파싱
    const arrayBuffer = await file.arrayBuffer()
    const { questions: parsed, parseErrors } = parseExcel(arrayBuffer)

    if (parsed.length === 0) {
      return NextResponse.json({
        error: '유효한 문제를 파싱할 수 없습니다.',
        parseErrors,
      }, { status: 400 })
    }

    const result: UploadResult = {
      total: parsed.length,
      inserted: 0,
      skipped: 0,
      errors: [...parseErrors],
    }

    // 기존 문제 삭제 옵션
    if (replaceExisting) {
      await (supabase as any)
        .from('questions')
        .delete()
        .eq('exam_id', examId)
    }

    // 기존 최대 order_num 조회 (replaceExisting=false 일 때 이어서 추가)
    let baseOrderNum = 0
    if (!replaceExisting) {
      const { data: lastQ } = await (supabase as any)
        .from('questions')
        .select('order_num')
        .eq('exam_id', examId)
        .order('order_num', { ascending: false })
        .limit(1)
        .maybeSingle()
      baseOrderNum = lastQ?.order_num ?? 0
    }

    // 문제 타입 자동 판별
    const detectType = (q: ParsedQuestion): 'multiple_choice' | 'true_false' | 'short_answer' => {
      if (q.options.length >= 2) return 'multiple_choice'
      const ans = q.correct_answer.toUpperCase()
      if (ans === 'O' || ans === 'X' || ans === '○' || ans === '×') return 'true_false'
      return 'short_answer'
    }

    // DB 일괄 삽입
    const insertRows = parsed.map((q, idx) => ({
      exam_id: examId,
      question_type: detectType(q),
      question_text: q.question_text,
      options: q.options.length > 0 ? q.options : null,
      correct_answer: q.correct_answer,
      explanation: null,
      score_weight: 1,
      order_num: baseOrderNum + (replaceExisting ? q.order_num : idx + 1),
      is_active: true,
    }))

    const { data: inserted, error: insertError } = await (supabase as any)
      .from('questions')
      .insert(insertRows)
      .select('id')

    if (insertError) {
      return NextResponse.json({
        error: 'DB 저장 중 오류가 발생했습니다.',
        detail: insertError.message,
        parseErrors,
      }, { status: 500 })
    }

    result.inserted = inserted?.length ?? 0
    result.skipped = result.total - result.inserted

    return NextResponse.json({
      success: true,
      examTitle: exam.title,
      result,
    })

  } catch (err: unknown) {
    console.error('[upload-questions] 오류:', err)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
