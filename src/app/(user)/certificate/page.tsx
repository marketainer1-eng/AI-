import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { CertificateRow } from '@/types'
import { formatDate } from '@/lib/utils/format'

export default async function CertificatePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // 발급된 자격증 조회
  const { data: certificates } = await supabase
    .from('certificates')
    .select(`
      *,
      application:exam_applications(
        score,
        exam:exams(title, exam_start_at, passing_score)
      ),
      user:users(full_name, email)
    `)
    .eq('user_id', user.id)
    .order('issued_at', { ascending: false })

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">자격증</h1>
        <p className="text-gray-500 text-sm mt-1">발급된 자격증을 확인하고 다운로드하세요.</p>
      </div>

      {certificates && certificates.length > 0 ? (
        <div className="space-y-4">
          {(certificates as CertificateRow[]).map((cert) => (
            <div key={cert.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              {/* 자격증 카드 미리보기 */}
              <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-8 text-white text-center">
                <div className="text-4xl mb-2">🏆</div>
                <h2 className="text-2xl font-bold mb-1">자격증</h2>
                <p className="text-indigo-200 text-sm">CERTIFICATE OF QUALIFICATION</p>
              </div>

              <div className="p-6">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">자격증 번호</p>
                    <p className="font-semibold text-gray-900 mt-0.5">{cert.certificate_number}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">발급일</p>
                    <p className="font-semibold text-gray-900 mt-0.5">{formatDate(cert.issued_at)}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">시험명</p>
                    <p className="font-semibold text-gray-900 mt-0.5">
                      {/* @ts-ignore */}
                      {cert.application?.exam?.title ?? '-'}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500">취득 점수</p>
                    <p className="font-semibold text-gray-900 mt-0.5">
                      {/* @ts-ignore */}
                      {cert.application?.score !== null ? `${cert.application?.score}점` : '-'}
                    </p>
                  </div>
                </div>

                <div className="mt-6 flex gap-3">
                  {cert.pdf_url ? (
                    <a
                      href={cert.pdf_url}
                      download
                      className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg text-center transition-colors"
                    >
                      📥 PDF 다운로드
                    </a>
                  ) : (
                    <button
                      disabled
                      className="flex-1 py-2.5 bg-gray-100 text-gray-400 text-sm font-medium rounded-lg cursor-not-allowed"
                    >
                      📥 PDF 준비 중
                    </button>
                  )}
                  <button
                    onClick={() => window.print()}
                    className="px-4 py-2.5 border border-gray-200 text-gray-600 hover:bg-gray-50 text-sm font-medium rounded-lg transition-colors"
                  >
                    🖨 인쇄
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-dashed border-gray-300 p-12 text-center">
          <div className="text-4xl mb-3">🏆</div>
          <h2 className="font-semibold text-gray-900 mb-1">발급된 자격증이 없습니다</h2>
          <p className="text-sm text-gray-500">시험에 합격하면 자격증이 이곳에 표시됩니다.</p>
        </div>
      )}
    </div>
  )
}
