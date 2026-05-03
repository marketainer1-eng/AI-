const XLSX = require('xlsx')

// ─── 문제 시트 데이터 ───────────────────────────────────────
const questionRows = [
  ['문항번호', '문제', '보기1', '보기2', '보기3', '보기4'],
]
const answerRows = [
  ['문항번호', '정답'],
]

for (let i = 1; i <= 50; i++) {
  questionRows.push([
    i,
    `${i}번 문제를 여기에 입력하세요.`,
    '보기 1',
    '보기 2',
    '보기 3',
    '보기 4',
  ])
  answerRows.push([i, 1]) // 기본 정답: 1번
}

// ─── 워크북 생성 ────────────────────────────────────────────
const wb = XLSX.utils.book_new()

const qSheet = XLSX.utils.aoa_to_sheet(questionRows)
// 열 너비 설정
qSheet['!cols'] = [
  { wch: 8 },   // 문항번호
  { wch: 50 },  // 문제
  { wch: 20 },  // 보기1
  { wch: 20 },  // 보기2
  { wch: 20 },  // 보기3
  { wch: 20 },  // 보기4
]

const aSheet = XLSX.utils.aoa_to_sheet(answerRows)
aSheet['!cols'] = [
  { wch: 8 },   // 문항번호
  { wch: 8 },   // 정답
]

XLSX.utils.book_append_sheet(wb, qSheet, '문제')
XLSX.utils.book_append_sheet(wb, aSheet, '정답')

XLSX.writeFile(wb, '/home/user/questions_template_50.xlsx')
console.log('✅ 템플릿 생성 완료: questions_template_50.xlsx')
