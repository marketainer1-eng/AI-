'use client'

import { useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'

interface ExcelUploadModalProps {
  examId: string
  examTitle: string
  onClose: () => void
}

type UploadStatus = 'idle' | 'dragging' | 'parsing' | 'uploading' | 'success' | 'error'

interface UploadResult {
  inserted: number
  parseErrors: string[]
  examTitle: string
}

export default function ExcelUploadModal({
  examId,
  examTitle,
  onClose,
}: ExcelUploadModalProps) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [status, setStatus] = useState<UploadStatus>('idle')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [replaceMode, setReplaceMode] = useState(false)
  const [result, setResult] = useState<UploadResult | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // ── 파일 선택 처리 ──────────────────────────────────────────
  const handleFileSelect = useCallback((file: File) => {
    if (!file.name.match(/\.(xlsx|xls)$/i)) {
      setErrorMsg('.xlsx 또는 .xls 파일만 업로드 가능합니다.')
      return
    }
    setSelectedFile(file)
    setErrorMsg(null)
    setStatus('idle')
  }, [])

  // ── 드래그 앤 드롭 ──────────────────────────────────────────
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setStatus('dragging')
  }
  const handleDragLeave = () => {
    if (status === 'dragging') setStatus('idle')
  }
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setStatus('idle')
    const file = e.dataTransfer.files[0]
    if (file) handleFileSelect(file)
  }

  // ── 업로드 실행 ─────────────────────────────────────────────
  const handleUpload = async () => {
    if (!selectedFile) return

    setStatus('uploading')
    setErrorMsg(null)

    try {
      const formData = new FormData()
      formData.append('file', selectedFile)
      formData.append('exam_id', examId)
      formData.append('replace', String(replaceMode))

      const res = await fetch('/api/admin/upload-questions', {
        method: 'POST',
        body: formData,
      })

      const json = await res.json()

      if (!res.ok || json.error) {
        setErrorMsg(json.error ?? '업로드 실패')
        setStatus('error')
        return
      }

      setResult(json)
      setStatus('success')
      router.refresh()

    } catch (err) {
      setErrorMsg('네트워크 오류가 발생했습니다.')
      setStatus('error')
    }
  }

  const isUploading = status === 'uploading'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg">

        {/* ── 헤더 ── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-base font-semibold text-gray-900">엑셀로 문제 일괄 등록</h2>
            <p className="text-xs text-gray-400 mt-0.5 truncate max-w-xs">{examTitle}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">

          {/* ── 성공 화면 ── */}
          {status === 'success' && result && (
            <div className="text-center py-4">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-1">등록 완료!</h3>
              <p className="text-gray-500 text-sm">
                <span className="text-cyan-600 font-bold text-xl">{result.inserted}</span>개 문제가 등록되었습니다.
              </p>

              {result.parseErrors.length > 0 && (
                <div className="mt-4 text-left p-3 bg-yellow-50 border border-yellow-200 rounded-xl">
                  <p className="text-xs font-semibold text-yellow-800 mb-2">
                    ⚠️ 일부 행이 스킵되었습니다 ({result.parseErrors.length}건)
                  </p>
                  <ul className="text-xs text-yellow-700 space-y-0.5 max-h-32 overflow-y-auto">
                    {result.parseErrors.map((e, i) => (
                      <li key={i}>• {e}</li>
                    ))}
                  </ul>
                </div>
              )}

              <button
                onClick={onClose}
                className="mt-5 px-6 py-2.5 bg-cyan-600 text-white text-sm font-medium rounded-xl hover:bg-cyan-700 transition-colors"
              >
                닫기
              </button>
            </div>
          )}

          {/* ── 업로드 UI ── */}
          {status !== 'success' && (
            <>
              {/* 엑셀 형식 안내 */}
              <div className="bg-cyan-50 border border-cyan-100 rounded-xl p-4">
                <p className="text-xs font-semibold text-cyan-800 mb-2">📋 엑셀 파일 형식 안내</p>
                <div className="grid grid-cols-2 gap-3 text-xs text-cyan-700">
                  <div>
                    <p className="font-medium mb-1">시트1: 문제</p>
                    <ul className="space-y-0.5 text-cyan-600">
                      <li>• A열: 문항번호</li>
                      <li>• B열: 문제</li>
                      <li>• C열: 보기1</li>
                      <li>• D열: 보기2</li>
                      <li>• E열: 보기3</li>
                      <li>• F열: 보기4</li>
                    </ul>
                  </div>
                  <div>
                    <p className="font-medium mb-1">시트2: 정답</p>
                    <ul className="space-y-0.5 text-cyan-600">
                      <li>• A열: 문항번호</li>
                      <li>• B열: 정답 (1~4)</li>
                    </ul>
                    <p className="mt-2 text-[10px] text-cyan-500">
                      * 정답 번호는 보기1=1, 보기2=2, 보기3=3, 보기4=4
                    </p>
                  </div>
                </div>
              </div>

              {/* 파일 드롭존 */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => !isUploading && fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                  status === 'dragging'
                    ? 'border-cyan-400 bg-cyan-50'
                    : selectedFile
                    ? 'border-green-400 bg-green-50'
                    : 'border-gray-200 hover:border-cyan-300 hover:bg-gray-50'
                } ${isUploading ? 'pointer-events-none opacity-60' : ''}`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls"
                  className="sr-only"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) handleFileSelect(file)
                  }}
                />

                {selectedFile ? (
                  <div>
                    <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center mx-auto mb-3">
                      <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <p className="text-sm font-semibold text-gray-800">{selectedFile.name}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {(selectedFile.size / 1024).toFixed(1)} KB
                    </p>
                    <p className="text-xs text-cyan-500 mt-2">클릭하여 다른 파일 선택</p>
                  </div>
                ) : (
                  <div>
                    <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center mx-auto mb-3">
                      <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                          d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                    </div>
                    <p className="text-sm font-medium text-gray-700">
                      엑셀 파일을 드래그하거나 클릭하여 업로드
                    </p>
                    <p className="text-xs text-gray-400 mt-1">.xlsx, .xls 지원</p>
                  </div>
                )}
              </div>

              {/* 교체/추가 모드 선택 */}
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-xs font-semibold text-gray-700 mb-3">업로드 방식</p>
                <div className="grid grid-cols-2 gap-3">
                  <label className={`flex items-start gap-2.5 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                    !replaceMode ? 'border-cyan-400 bg-cyan-50' : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}>
                    <input
                      type="radio"
                      name="mode"
                      checked={!replaceMode}
                      onChange={() => setReplaceMode(false)}
                      className="mt-0.5 accent-cyan-600"
                    />
                    <div>
                      <p className="text-xs font-semibold text-gray-800">추가</p>
                      <p className="text-[10px] text-gray-500 mt-0.5">기존 문제 유지 후 추가</p>
                    </div>
                  </label>
                  <label className={`flex items-start gap-2.5 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                    replaceMode ? 'border-red-400 bg-red-50' : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}>
                    <input
                      type="radio"
                      name="mode"
                      checked={replaceMode}
                      onChange={() => setReplaceMode(true)}
                      className="mt-0.5 accent-red-500"
                    />
                    <div>
                      <p className="text-xs font-semibold text-gray-800">교체</p>
                      <p className="text-[10px] text-gray-500 mt-0.5">기존 문제 삭제 후 교체</p>
                    </div>
                  </label>
                </div>
                {replaceMode && (
                  <p className="text-xs text-red-500 mt-2">
                    ⚠️ 교체 모드: 이 시험의 기존 문제가 모두 삭제됩니다.
                  </p>
                )}
              </div>

              {/* 에러 메시지 */}
              {errorMsg && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                  ❌ {errorMsg}
                </div>
              )}

              {/* 버튼 */}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-2.5 text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
                >
                  취소
                </button>
                <button
                  onClick={handleUpload}
                  disabled={!selectedFile || isUploading}
                  className="flex-1 py-2.5 text-sm font-semibold text-white bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50 rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  {isUploading ? (
                    <>
                      <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                      </svg>
                      등록 중...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                      </svg>
                      문제 등록
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
