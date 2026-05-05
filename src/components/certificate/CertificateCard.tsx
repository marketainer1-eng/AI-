'use client'

import { useEffect, useState } from 'react'
import CertificateTemplate from './CertificateTemplate'
import { useCertificatePdf } from '@/hooks/useCertificatePdf'
import type { CertificateData, CertAccessReason } from '@/lib/certificate/access'
import { formatDate, formatDateTime } from '@/lib/utils/format'

interface CertificateCardProps {
  data: CertificateData
  accessReason: CertAccessReason
  msUntilIssue?: number | null
  issuedAt?: string | null
}

// ─── 발급 대기 카운트다운 훅 ──────────────────────────────────
function useCountdown(initialMs: number | null) {
  const [ms, setMs] = useState(initialMs ?? 0)
  useEffect(() => {
    if (!initialMs || initialMs <= 0) return
    const end = Date.now() + initialMs
    const id = setInterval(() => {
      const left = Math.max(0, end - Date.now())
      setMs(left)
      if (left === 0) { clearInterval(id); setTimeout(() => window.location.reload(), 800) }
    }, 1000)
    return () => clearInterval(id)
  }, [initialMs])
  const total = Math.ceil(ms / 1000)
  return {
    days: Math.floor(total / 86400), hours: Math.floor((total % 86400) / 3600),
    minutes: Math.floor((total % 3600) / 60), seconds: total % 60, total,
  }
}

// ─── 버튼 상태 설정 ───────────────────────────────────────────
const PDF_BTN: Record<string, { label: string; cls: string }> = {
  idle:       { label: '📥 PDF 다운로드',  cls: 'bg-cyan-600 hover:bg-cyan-700 text-white' },
  rendering:  { label: '🖼️ 렌더링 중...', cls: 'bg-cyan-400 text-white cursor-not-allowed' },
  generating: { label: '⚙️ PDF 생성 중...', cls: 'bg-cyan-400 text-white cursor-not-allowed' },
  done:       { label: '✅ 다운로드 완료!', cls: 'bg-green-600 text-white' },
  error:      { label: '❌ 다시 시도',      cls: 'bg-red-500 hover:bg-red-600 text-white' },
}
const EMAIL_BTN: Record<string, { label: string; cls: string }> = {
  idle:       { label: '📧 이메일 발송',    cls: 'bg-indigo-500 hover:bg-indigo-600 text-white' },
  generating: { label: '⚙️ PDF 생성 중...', cls: 'bg-indigo-300 text-white cursor-not-allowed' },
  sending:    { label: '✉️ 발송 중...',     cls: 'bg-indigo-300 text-white cursor-not-allowed' },
  done:       { label: '✅ 발송 완료!',     cls: 'bg-green-600 text-white' },
  error:      { label: '❌ 재시도',          cls: 'bg-red-500 hover:bg-red-600 text-white' },
}

export default function CertificateCard({ data, accessReason, msUntilIssue, issuedAt }: CertificateCardProps) {
  const { templateRef, status, emailStatus, errorMsg, emailMsg, download, sendEmail } = useCertificatePdf(data)
  const countdown = useCountdown(accessReason === 'before_issue_date' ? (msUntilIssue ?? null) : null)

  const { cert, user, exam, application } = data
  const isPending = accessReason !== 'granted'
  const isBusy    = status === 'rendering' || status === 'generating'
  const isEmailBusy = emailStatus === 'generating' || emailStatus === 'sending'

  return (
    <>
      {/* PDF 캡처용 숨김 템플릿 */}
      <CertificateTemplate ref={templateRef} data={data} />

      <article className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
        {/* 상단 배너 */}
        <div className="bg-gradient-to-r from-cyan-600 via-teal-600 to-cyan-700 px-8 py-10 text-white text-center relative overflow-hidden">
          <div className="absolute inset-0 opacity-10"
            style={{ backgroundImage: 'repeating-linear-gradient(45deg,transparent,transparent 10px,rgba(255,255,255,.3) 10px,rgba(255,255,255,.3) 11px)' }} />
          <div className="relative">
            <div className="text-5xl mb-3">🏆</div>
            <h2 className="text-2xl font-extrabold tracking-tight mb-1">{exam.title}</h2>
            <p className="text-cyan-200 text-sm tracking-widest uppercase">Certificate of Qualification</p>
          </div>
        </div>

        {/* 자격증 정보 */}
        <div className="px-8 py-6">
          <dl className="grid grid-cols-2 gap-x-6 gap-y-4 text-sm mb-6">
            <MetaItem label="이름"       value={user.full_name} highlight />
            <MetaItem label="자격증 번호" value={cert.certificate_number} mono />
            <MetaItem label="발급일"     value={formatDate(cert.issued_at)} />
            <MetaItem label="취득 점수"  value={application.score !== null ? `${application.score}점` : '-'} />
            <MetaItem label="합격 기준"  value={`${exam.passing_score}점 이상`} />
            <MetaItem label="시험일"     value={formatDate(exam.exam_start_at)} />
          </dl>

          {/* UUID */}
          <div className="bg-gray-50 rounded-xl px-4 py-3 mb-5">
            <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider mb-1">UUID (고유 식별자)</p>
            <p className="text-xs font-mono text-gray-600 break-all">{cert.id}</p>
          </div>

          {/* 잠금 상태 */}
          {isPending && <LockNotice reason={accessReason} countdown={countdown} issuedAt={issuedAt ?? null} />}

          {/* PDF 에러 */}
          {status === 'error' && errorMsg && (
            <div className="mb-4 px-4 py-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600">{errorMsg}</div>
          )}

          {/* 이메일 결과 메시지 */}
          {emailMsg && (
            <div className={`mb-4 px-4 py-3 rounded-xl text-sm border ${
              emailStatus === 'done'  ? 'bg-green-50 border-green-100 text-green-700' :
              emailStatus === 'error' ? 'bg-red-50 border-red-100 text-red-600' :
              'bg-indigo-50 border-indigo-100 text-indigo-700'
            }`}>
              {emailMsg}
            </div>
          )}

          {/* 버튼 영역 */}
          <div className="flex gap-2 flex-wrap">
            {/* PDF 다운로드 */}
            <button
              onClick={download}
              disabled={isPending || isBusy}
              className={`flex-1 min-w-[140px] py-3 text-sm font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 ${
                isPending ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : PDF_BTN[status]?.cls
              }`}
            >
              {isPending ? <>🔒 발급일 이전</> : (
                <>
                  {isBusy && <Spinner />}
                  {PDF_BTN[status]?.label}
                </>
              )}
            </button>

            {/* 이메일 발송 */}
            {!isPending && (
              <button
                onClick={sendEmail}
                disabled={isEmailBusy || isBusy}
                className={`flex-1 min-w-[140px] py-3 text-sm font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 ${
                  EMAIL_BTN[emailStatus]?.cls
                }`}
              >
                {isEmailBusy && <Spinner />}
                {EMAIL_BTN[emailStatus]?.label}
              </button>
            )}

            {/* 인쇄 */}
            <button
              onClick={() => window.print()}
              disabled={isPending}
              className="px-4 py-3 border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 text-sm font-medium rounded-xl transition-colors"
              title="인쇄"
            >🖨️</button>
          </div>

          {/* 진행 안내 */}
          {(isBusy || isEmailBusy) && (
            <p className="mt-2 text-xs text-center text-gray-400">
              {emailStatus === 'generating' ? 'PDF를 생성하고 있습니다...' :
               emailStatus === 'sending'    ? '이메일을 발송하고 있습니다...' :
               status === 'rendering'       ? '자격증 이미지를 렌더링하고 있습니다...' :
               'PDF 파일을 생성하고 있습니다...'}
            </p>
          )}
        </div>
      </article>
    </>
  )
}

// ─── 하위 컴포넌트 ────────────────────────────────────────────
function Spinner() {
  return (
    <svg className="animate-spin w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
    </svg>
  )
}

function LockNotice({ reason, countdown, issuedAt }: {
  reason: CertAccessReason
  countdown: ReturnType<typeof useCountdown>
  issuedAt: string | null
}) {
  if (reason === 'before_issue_date') {
    return (
      <div className="mb-5 bg-amber-50 border border-amber-100 rounded-xl p-5">
        <div className="flex items-start gap-3 mb-4">
          <span className="text-2xl">⏰</span>
          <div>
            <p className="font-semibold text-amber-800 text-sm">발급일 이전입니다</p>
            {issuedAt && <p className="text-xs text-amber-600 mt-0.5">발급 예정: {formatDateTime(issuedAt)}</p>}
          </div>
        </div>
        {countdown.total > 0 && (
          <div className="flex justify-center gap-3">
            {countdown.days > 0 && <CDUnit value={countdown.days} label="일" />}
            <CDUnit value={countdown.hours} label="시간" />
            <CDUnit value={countdown.minutes} label="분" />
            <CDUnit value={countdown.seconds} label="초" />
          </div>
        )}
        <p className="text-[10px] text-amber-400 text-center mt-3">발급 시각이 되면 자동으로 새로고침됩니다.</p>
      </div>
    )
  }
  if (reason === 'not_issued') {
    return (
      <div className="mb-5 bg-cyan-50 border border-cyan-100 rounded-xl p-4 flex items-center gap-3 text-sm text-cyan-700">
        <span className="text-xl">⏳</span>
        관리자가 자격증 발급을 처리하고 있습니다. 잠시 후 다시 확인해주세요.
      </div>
    )
  }
  return null
}

function CDUnit({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <div className="w-12 h-12 bg-white border border-amber-200 rounded-lg shadow-sm flex items-center justify-center">
        <span className="text-xl font-mono font-bold text-amber-700 tabular-nums">{String(value).padStart(2, '0')}</span>
      </div>
      <span className="text-[10px] text-amber-400 mt-1">{label}</span>
    </div>
  )
}

function MetaItem({ label, value, highlight, mono }: { label: string; value: string; highlight?: boolean; mono?: boolean }) {
  return (
    <div>
      <dt className="text-[10px] text-gray-400 font-medium uppercase tracking-wider mb-0.5">{label}</dt>
      <dd className={`text-sm font-semibold ${highlight ? 'text-cyan-700 text-base' : 'text-gray-800'} ${mono ? 'font-mono' : ''}`}>{value}</dd>
    </div>
  )
}
