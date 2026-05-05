'use client'

import { useState } from 'react'
import { formatDate, formatDateTime } from '@/lib/utils/format'

interface CertRow {
  id: string
  certificate_number: string
  issued_at: string
  pdf_url: string | null
  email_sent_at?: string | null
  user: { full_name: string; email: string } | null
  application: {
    score: number | null
    exam: { title: string } | null
  } | null
}

interface Props {
  certificates: CertRow[]
}

type SendState = 'idle' | 'sending' | 'done' | 'error'

export default function AdminCertificatesClient({ certificates }: Props) {
  const [sendStates, setSendStates]   = useState<Record<string, SendState>>({})
  const [bulkState,  setBulkState]    = useState<SendState>('idle')
  const [bulkMsg,    setBulkMsg]      = useState<string>('')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  // ── 개별 이메일 발송 ────────────────────────────────────────
  async function handleSendOne(certId: string) {
    setSendStates(s => ({ ...s, [certId]: 'sending' }))
    try {
      const res  = await fetch('/api/certificate/send-email', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ certificateId: certId }),
      })
      const json = await res.json()
      if (!res.ok || !json.success) throw new Error(json.error ?? '발송 실패')
      setSendStates(s => ({ ...s, [certId]: 'done' }))
    } catch (e: any) {
      setSendStates(s => ({ ...s, [certId]: 'error' }))
      alert(`발송 실패: ${e.message}`)
    }
  }

  // ── 선택된 항목 일괄 발송 ───────────────────────────────────
  async function handleBulkSend() {
    const ids = [...selectedIds]
    if (ids.length === 0) { alert('발송할 자격증을 선택하세요.'); return }
    if (!confirm(`선택된 ${ids.length}명에게 이메일을 발송하시겠습니까?`)) return

    setBulkState('sending')
    setBulkMsg('')
    try {
      const res  = await fetch('/api/certificate/send-email', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ certificateIds: ids }),
      })
      const json = await res.json()
      if (!res.ok || !json.success) throw new Error(json.error ?? '발송 실패')

      const { succeeded, failed, total } = json.summary
      setBulkMsg(`✅ ${total}명 중 ${succeeded}명 발송 성공${failed > 0 ? `, ${failed}명 실패` : ''}`)
      setBulkState('done')
      // 발송 성공한 항목 상태 업데이트
      const newStates: Record<string, SendState> = {}
      for (const r of json.results) {
        newStates[r.certId] = r.success ? 'done' : 'error'
      }
      setSendStates(s => ({ ...s, ...newStates }))
      setSelectedIds(new Set())
    } catch (e: any) {
      setBulkMsg(`❌ ${e.message}`)
      setBulkState('error')
    }
  }

  // ── 전체 일괄 발송 ──────────────────────────────────────────
  async function handleSendAll() {
    if (!confirm(`전체 ${certificates.length}명에게 이메일을 발송하시겠습니까?\n(이미 발송된 경우에도 재발송됩니다)`)) return
    const allIds = certificates.map(c => c.id)
    setSelectedIds(new Set(allIds))
    setBulkState('sending')
    setBulkMsg('')
    try {
      const res  = await fetch('/api/certificate/send-email', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ certificateIds: allIds }),
      })
      const json = await res.json()
      if (!res.ok || !json.success) throw new Error(json.error ?? '발송 실패')
      const { succeeded, failed, total } = json.summary
      setBulkMsg(`✅ 전체 ${total}명 중 ${succeeded}명 발송 성공${failed > 0 ? `, ${failed}명 실패` : ''}`)
      setBulkState('done')
      const newStates: Record<string, SendState> = {}
      for (const r of json.results) {
        newStates[r.certId] = r.success ? 'done' : 'error'
      }
      setSendStates(s => ({ ...s, ...newStates }))
      setSelectedIds(new Set())
    } catch (e: any) {
      setBulkMsg(`❌ ${e.message}`)
      setBulkState('error')
    }
  }

  // ── 체크박스 토글 ───────────────────────────────────────────
  function toggleSelect(id: string) {
    setSelectedIds(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }
  function toggleAll() {
    if (selectedIds.size === certificates.length) setSelectedIds(new Set())
    else setSelectedIds(new Set(certificates.map(c => c.id)))
  }

  const isBulkBusy = bulkState === 'sending'

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">자격증 관리</h1>
          <p className="text-gray-500 text-sm mt-1">
            발급된 자격증 현황을 확인하고 이메일을 발송하세요.
          </p>
        </div>

        {/* 일괄 발송 버튼 그룹 */}
        <div className="flex gap-2 flex-wrap">
          {selectedIds.size > 0 && (
            <button
              onClick={handleBulkSend}
              disabled={isBulkBusy}
              className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-60 text-white text-sm font-semibold rounded-xl flex items-center gap-2 transition-colors"
            >
              {isBulkBusy
                ? <><BtnSpinner /> 발송 중...</>
                : <>📧 선택 {selectedIds.size}명 발송</>}
            </button>
          )}
          <button
            onClick={handleSendAll}
            disabled={isBulkBusy || certificates.length === 0}
            className="px-4 py-2 bg-teal-600 hover:bg-teal-700 disabled:opacity-60 text-white text-sm font-semibold rounded-xl flex items-center gap-2 transition-colors"
          >
            {isBulkBusy
              ? <><BtnSpinner /> 발송 중...</>
              : <>📨 전체 {certificates.length}명 일괄발송</>}
          </button>
        </div>
      </div>

      {/* 일괄 발송 결과 메시지 */}
      {bulkMsg && (
        <div className={`px-4 py-3 rounded-xl text-sm font-medium border ${
          bulkState === 'done'  ? 'bg-green-50 border-green-200 text-green-700' :
          bulkState === 'error' ? 'bg-red-50 border-red-200 text-red-600' :
          'bg-indigo-50 border-indigo-200 text-indigo-700'
        }`}>
          {bulkMsg}
        </div>
      )}

      {/* 테이블 */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <p className="text-sm text-gray-500">전체 <strong>{certificates.length}</strong>건 발급</p>
          {selectedIds.size > 0 && (
            <p className="text-sm text-indigo-600 font-medium">{selectedIds.size}건 선택됨</p>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={selectedIds.size === certificates.length && certificates.length > 0}
                    onChange={toggleAll}
                    className="rounded border-gray-300 text-indigo-600 cursor-pointer"
                  />
                </th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">자격증 번호</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">수령인</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">시험명</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">점수</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">발급일</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">이메일 발송</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">PDF</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {certificates.map(cert => {
                const state     = sendStates[cert.id] ?? 'idle'
                const isSending = state === 'sending'
                const isSelected = selectedIds.has(cert.id)

                return (
                  <tr key={cert.id}
                    className={`hover:bg-gray-50 transition-colors ${isSelected ? 'bg-indigo-50' : ''}`}
                  >
                    {/* 체크박스 */}
                    <td className="px-4 py-4">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelect(cert.id)}
                        className="rounded border-gray-300 text-indigo-600 cursor-pointer"
                      />
                    </td>

                    {/* 자격증 번호 */}
                    <td className="px-4 py-4 font-mono text-xs text-gray-700 whitespace-nowrap">
                      {cert.certificate_number}
                    </td>

                    {/* 수령인 */}
                    <td className="px-4 py-4">
                      <p className="font-semibold text-gray-900">{cert.user?.full_name ?? '-'}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{cert.user?.email ?? '-'}</p>
                    </td>

                    {/* 시험명 */}
                    <td className="px-4 py-4 text-gray-600 max-w-[180px]">
                      <p className="truncate text-xs">{cert.application?.exam?.title ?? '-'}</p>
                    </td>

                    {/* 점수 */}
                    <td className="px-4 py-4">
                      <span className="text-emerald-600 font-bold text-sm">
                        {cert.application?.score != null ? `${cert.application.score}점` : '-'}
                      </span>
                    </td>

                    {/* 발급일 */}
                    <td className="px-4 py-4 text-gray-500 text-xs whitespace-nowrap">
                      {formatDateTime(cert.issued_at)}
                    </td>

                    {/* 이메일 발송 버튼 */}
                    <td className="px-4 py-4">
                      <div className="flex flex-col gap-1">
                        <button
                          onClick={() => handleSendOne(cert.id)}
                          disabled={isSending || isBulkBusy}
                          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap flex items-center gap-1 ${
                            state === 'done'    ? 'bg-green-100 text-green-700 border border-green-200' :
                            state === 'error'   ? 'bg-red-100 text-red-600 border border-red-200 hover:bg-red-200' :
                            state === 'sending' ? 'bg-indigo-100 text-indigo-400 cursor-not-allowed' :
                            'bg-indigo-50 text-indigo-600 border border-indigo-200 hover:bg-indigo-100'
                          }`}
                        >
                          {isSending && <BtnSpinner />}
                          {state === 'idle'    && '📧 발송'}
                          {state === 'sending' && '발송 중...'}
                          {state === 'done'    && '✅ 발송됨'}
                          {state === 'error'   && '❌ 재시도'}
                        </button>
                        {/* 이전 발송 기록 */}
                        {cert.email_sent_at && state === 'idle' && (
                          <span className="text-[10px] text-gray-400">
                            최근: {formatDate(cert.email_sent_at)}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* PDF 다운로드 */}
                    <td className="px-4 py-4">
                      {cert.pdf_url ? (
                        <a href={cert.pdf_url} download
                          className="text-cyan-600 hover:underline text-xs">
                          다운로드
                        </a>
                      ) : (
                        <span className="text-gray-400 text-xs">—</span>
                      )}
                    </td>
                  </tr>
                )
              })}

              {certificates.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-400">
                    발급된 자격증이 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function BtnSpinner() {
  return (
    <svg className="animate-spin w-3 h-3 shrink-0" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
    </svg>
  )
}
