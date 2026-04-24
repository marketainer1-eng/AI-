import { NextRequest, NextResponse } from 'next/server'
import * as XLSX from 'xlsx'
import { createClient } from '@/lib/supabase/server'

// ─── 엑셀 파싱 결과 타입 ─────────────────────────────────────
interface ParsedQuestion {
  order_num: number
  question_text: string
  options: string[]        // 보기1~4
  correct_answer: string   // 정답 보기 텍스트
}

interface ParseResult {
  questions: ParsedQuestion[]
  errors: string[]
}

// ─── 엑셀 파싱 ───────────────────────────────────────────────
function parseExcel(buffer: ArrayBuffer): ParseResult {
  const errors: string[] = []

  const wb = XLSX.read(buffer, { type: 'array' })

  // 시트 존재 여부 확인
  const qSheetName = wb.SheetNames.find((n) => n.includes('문제')) ?? wb.SheetNames[0]
  const aSheetName = wb.SheetNames.find((n) => n.includes('정답')) ?? wb.SheetNames[1]

  if (!qSheetName) {
    errors.push('문제 시트를 찾을 수 없습니다.')
    return { questions: [], errors }
  }
  if (!aSheetName) {
    errors.push('정답 시트를 찾을 수 없습니다.')
    return { questions: [], errors }
  }

  const qSheet = wb.Sheets[qSheetName]
  const aSheet = wb.Sheets[aSheetName]

  // 헤더 포함 배열로 파싱
  const qRows = XLSX.utils.sheet_to_json<(string | number)[]>(qSheet, { header: 1 })
  const aRows = XLSX.utils.sheet_to_json<(string | number)[]>(aSheet, { header: 1 })

  // 헤더 행 제거 (첫 번째 행)
  const qData = qRows.slice(1).filter((row) => row.length > 0 && row[0] !== undefined && row[0] !== '')
  const aData = aRows.slice(1).filter((row) => row.length > 0 && row[0] !== undefined && row[0] !== '')

  // 정답 맵 생성: { 문항번호 → 정답번호(1-based) }
  const answerMap = new Map<number, number>()
  aData.forEach((row, idx) => {
    const num = Number(row[0])
    const ans = Number(row[1])
    if (isNaN(num) || isNaN(ans)) {
      errors.push(`정답 시트 ${idx + 2}행: 문항번호 또는 정답이 숫자가 아닙니다.`)
      return
    }
    answerMap.set(num, ans)
  })

  const questions: ParsedQuestion[] = []

  qData.forEach((row, idx) => {
    const rowNum = idx + 2  // 헤더 제외 실제 행 번호

    const orderNum   = Number(row[0])
    const questionText = String(row[1] ?? '').trim()
    const opt1 = String(row[2] ?? '').trim()
    const opt2 = String(row[3] ?? '').trim()
    const opt3 = String(row[4] ?? '').trim()
    const opt4 = String(row[5] ?? '').trim()

    if (isNaN(orderNum)) {
      errors.push(`문제 시트 ${rowNum}행: 문항번호가 숫자가 아닙니다.`)
      return
    }
    if (!questionText) {
      errors.push(`문제 시트 ${rowNum}행: 문제가 비어있습니다.`)
      return
    }

    const options = [opt1, opt2, opt3, opt4].filter(Boolean)

    if (options.length === 0) {
      errors.push(`${orderNum}번 문제: 보기가 없습니다.`)
      return
    }

    // 정답 번호 → 보기 텍스트 변환
    const answerIdx = answerMap.get(orderNum)
    if (answerIdx === undefined) {
      errors.push(`${orderNum}번 문제: 정답 시트에 정답이 없습니다.`)
      return
    }

    const correctAnswer = options[answerIdx - 1]  // 1-based → 0-based
    if (!correctAnswer) {
      errors.push(`${orderNum}번 문제: 정답 번호(${answerIdx})에 해당하는 보기가 없습니다.`)
      return
    }

    questions.push({
      order_num: orderNum,
      question_text: questionText,
      options,
      correct_answer: correctAnswer,
    })
  })

  // 문항번호 순 정렬
  questions.sort((a, b) => a.order_num - b.order_num)

  return { questions, errors }
}

// ─── POST /api/admin/upload-questions ───────────────────────
export async function POST(req: NextRequest) {
  try {
    // 1. 관리자 권한 확인
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
    }

    const { data: profile } = await (supabase as any)
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: '관리자만 접근 가능합니다.' }, { status: 403 })
    }

    // 2. FormData 파싱
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const examId = formData.get('exam_id') as string | null
    const replaceMode = formData.get('replace') === 'true'  // 기존 문제 교체 여부

    if (!file) {
      return NextResponse.json({ error: '파일이 없습니다.' }, { status: 400 })
    }
    if (!examId) {
      return NextResponse.json({ error: 'exam_id가 없습니다.' }, { status: 400 })
    }

    // 3. 파일 타입 검증
    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.ms-excel',                                           // .xls
    ]
    if (!allowedTypes.includes(file.type) && !file.name.match(/\.(xlsx|xls)$/i)) {
      return NextResponse.json({ error: '.xlsx 또는 .xls 파일만 업로드 가능합니다.' }, { status: 400 })
    }

    // 4. 시험 존재 확인
    const { data: exam } = await (supabase as any)
      .from('exams')
      .select('id, title')
      .eq('id', examId)
      .single()

    if (!exam) {
      return NextResponse.json({ error: '시험을 찾을 수 없습니다.' }, { status: 404 })
    }

    // 5. 엑셀 파싱
    const buffer = await file.arrayBuffer()
    const { questions, errors } = parseExcel(buffer)

    if (questions.length === 0) {
      return NextResponse.json({
        error: '등록 가능한 문제가 없습니다.',
        parseErrors: errors,
      }, { status: 400 })
    }

    // 6. 기존 문제 삭제 (교체 모드)
    if (replaceMode) {
      await (supabase as any)
        .from('questions')
        .delete()
        .eq('exam_id', examId)
    }

    // 7. 현재 마지막 order_num 조회 (추가 모드일 때)
    let baseOrder = 0
    if (!replaceMode) {
      const { data: lastQ } = await (supabase as any)
        .from('questions')
        .select('order_num')
        .eq('exam_id', examId)
        .order('order_num', { ascending: false })
        .limit(1)
        .maybeSingle()

      baseOrder = lastQ?.order_num ?? 0
    }

    // 8. DB 저장
    const insertRows = questions.map((q, idx) => ({
      exam_id:        examId,
      question_type:  q.options.length > 0 ? 'multiple_choice' : 'short_answer',
      question_text:  q.question_text,
      options:        q.options,
      correct_answer: q.correct_answer,
      explanation:    null,
      score_weight:   1,
      order_num:      replaceMode ? q.order_num : baseOrder + idx + 1,
      is_active:      true,
    }))

    const { data: inserted, error: insertError } = await (supabase as any)
      .from('questions')
      .insert(insertRows)
      .select()

    if (insertError) {
      console.error('Insert error:', insertError)
      return NextResponse.json({
        error: 'DB 저장 중 오류가 발생했습니다.',
        detail: insertError.message,
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      inserted: inserted?.length ?? questions.length,
      parseErrors: errors,  // 파싱 중 발생한 경고 (일부 행 스킵)
      examTitle: exam.title,
    })

  } catch (err) {
    console.error('Upload error:', err)
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}
