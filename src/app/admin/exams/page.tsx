import { createClient } from '@/lib/supabase/server'
import { ExamRow } from '@/types'
import { formatDate, formatCurrency } from '@/lib/utils/format'

export default async function AdminExamsPage() {
  const supabase = await createClient()

  const { data: exams } = await supabase
    .from('exams')
    .select('*')
    .order('exam_start_at', { ascending: false })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">시험 관리</h1>
          <p className="text-gray-500 text-sm mt-1">시험 회차를 관리하세요.</p>
        </div>
        {/* TODO: 시험 추가 버튼 (모달 또는 별도 페이지) */}
        <button className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors">
          + 시험 추가
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-6 py-3 text-gray-500 font-medium">시험명</th>
                <th className="text-left px-6 py-3 text-gray-500 font-medium">시험일</th>
                <th className="text-left px-6 py-3 text-gray-500 font-medium">시간</th>
                <th className="text-left px-6 py-3 text-gray-500 font-medium">합격 기준</th>
                <th className="text-left px-6 py-3 text-gray-500 font-medium">응시료</th>
                <th className="text-left px-6 py-3 text-gray-500 font-medium">상태</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {(exams as ExamRow[] ?? []).map((exam) => (
                <tr key={exam.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <p className="font-medium text-gray-900">{exam.title}</p>
                    {exam.description && (
                      <p className="text-xs text-gray-400 mt-0.5">{exam.description}</p>
                    )}
                  </td>
                  <td className="px-6 py-4 text-gray-600">{formatDate(exam.exam_start_at)}</td>
                  <td className="px-6 py-4 text-gray-600">{exam.duration_minutes}분</td>
                  <td className="px-6 py-4 text-gray-600">{exam.passing_score}점 이상</td>
                  <td className="px-6 py-4 text-gray-600">{formatCurrency(exam.fee)}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      exam.is_active
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-500'
                    }`}>
                      {exam.is_active ? '활성' : '비활성'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
