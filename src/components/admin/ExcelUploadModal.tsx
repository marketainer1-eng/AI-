'use client'

import { useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'

interface ExcelUploadModalProps {
  examId: string
  examTitle: string
  onClose: () => void
}

type UploadState = 'idle' | 'dragging' | 'uploading' | 'success' | 'error'

interface UploadResult {
  total: number
  inserted: number
  skipped: number
  errors: string[]
}

export default function ExcelUploadModal({
  examId,
  examTitle,
  onClose,
}: ExcelUploadModalProps) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [state, setState] = useState<UploadState>('idle')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [replaceExisting, setReplaceExisting] = useState(false)
  const [result, setResult] = useState<UploadResult | null>(null)
  const [errorMsg, setErrorMsg] = useState<string>('')

  // ── 파일 검증 ──────────────────────────────────────────────
  const validateFile = (file: File): string | null => {
    if (!file.name.match(/\.(xlsx|xls)$/i)) {
      return '.xlsx 또는 .xls 파일만 업로드 가능합니다.'
    }
    if (file.size > 5 * 1024 * 1024) {
      return '파일 크기는 5MB 이하여야 합니다.'
    }
    return null
  }

  const handleFileSelect = (file: File) => {
    const err = validateFile(file)
    if (err) {
      setErrorMsg(err)
      setState('error')
      return
    }
    setSelectedFile(file)
    setErrorMsg('')
    setState('idle')
  }

  // ── 드래그 앤 드롭 ─────────────────────────────────────────
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setState('dragging')
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setState(selectedFile ? 'idle' : 'idle')
  }, [selectedFile])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) handleFileSelect(file)
    else setState('idle')
  }, [])

  // ── 업로드 실행 ────────────────────────────────────────────
  const handleUpload = async () => {
    if (!selectedFile) return

    setState('uploading')
    setErrorMsg('')
    setResult(null)

    const formData = new FormData()
    formData.append('file', selectedFile)
    formData.append('examId', examId)
    formData.append('replaceExisting', String(replaceExisting))

    try {
      const res = await fetch('/api/admin/upload-questions', {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()

      if (!res.ok || data.error) {
        setErrorMsg(data.error ?? '업로드 중 오류가 발생했습니다.')
        if (data.parseErrors?.length) {
          setResult({ total: 0, inserted: 0, skipped: 0, errors: data.parseErrors })
        }
        setState('error')
        return
      }

      setResult(data.result)
      setState('success')
      router.refresh()
    } catch {
      setErrorMsg('네트워크 오류가 발생했습니다. 다시 시도해주세요.')
      setState('error')
    }
  }

  const reset = () => {
    setSelectedFile(null)
    setErrorMsg('')
    setResult(null)
    setState('idle')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">

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

          {/* ── 엑셀 형식 안내 ── */}
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-xs text-blue-700 space-y-2">
            <p className="font-semibold text-blue-800 flex items-center gap-1.5">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              엑셀 파일 형식 안내
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white rounded-lg p-2.5 border border-blue-100">
                <p className="font-medium text-blue-700 mb-1">📋 시트1: 문제</p>
                <p className="text-blue-600 leading-relaxed">
                  문항번호 | 문제 | 보기1 | 보기2 | 보기3 | 보기4
                </p>
              </div>
              <div className="bg-white rounded-lg p-2.5 border border-blue-100">
                <p className="font-medium text-blue-700 mb-1">✅ 시트2: 정답</p>
                <p className="text-blue-600 leading-relaxed">
                  문항번호 | 정답
                </p>
              </div>
            </div>
            <ul className="text-blue-600 space-y-0.5 list-disc list-inside">
              <li>보기가 없으면 O/X 또는 단답형으로 자동 인식</li>
              <li>정답은 보기 텍스트 그대로 입력 (예: 보기1 내용)</li>
              <li>O/X 문제는 정답에 <strong>O</strong> 또는 <strong>X</strong> 입력</li>
            </ul>
          </div>

          {/* ── 파일 업로드 영역 ── */}
          {state !== 'success' && (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => !selectedFile && fileInputRef.current?.click()}
              className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer ${
                state === 'dragging'
                  ? 'border-indigo-400 bg-indigo-50'
                  : selectedFile
                  ? 'border-green-300 bg-green-50 cursor-default'
                  : 'border-gray-200 hover:border-indigo-300 hover:bg-gray-50'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) handleFileSelect(file)
                }}
              />

              {selectedFile ? (
                /* 파일 선택됨 */
                <div className="space-y-2">
                  <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center mx-auto">
                    <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <p className="text-sm font-medium text-gray-900">{selectedFile.name}</p>
                  <p className="text-xs text-gray-400">
                    {(selectedFile.size / 1024).toFixed(1)} KB
                  </p>
                  <button
                    onClick={(e) => { e.stopPropagation(); reset() }}
                    className="text-xs text-red-500 hover:text-red-700 underline"
                  >
                    파일 다시 선택
                  </button>
                </div>
              ) : (
                /* 파일 미선택 */
                <div className="space-y-2">
                  <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center mx-auto">
                    <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                  </div>
                  <p className="text-sm text-gray-600">
                    엑셀 파일을 드래그하거나 <span className="text-indigo-600 font-medium">클릭하여 선택</span>
                  </p>
                  <p className="text-xs text-gray-400">.xlsx, .xls · 최대 5MB</p>
                </div>
              )}
            </div>
          )}

          {/* ── 기존 문제 처리 옵션 ── */}
          {state !== 'success' && (
            <label className="flex items-start gap-3 cursor-pointer group">
              <div className="relative mt-0.5">
                <input
                  type="checkbox"
                  checked={replaceExisting}
                  onChange={(e) => setReplaceExisting(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-5 h-5 rounded border-2 border-gray-300 peer-checked:border-red-500 peer-checked:bg-red-500 flex items-center justify-center transition-all">
                  {replaceExisting && (
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414L8.414 15l-4.121-4.121a1 1 0 011.414-1.414L8.414 12.172l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">
                  기존 문제 모두 삭제 후 업로드
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  체크 해제 시 기존 문제에 이어서 추가됩니다.
                  {replaceExisting && (
                    <span className="text-red-500 ml-1 font-medium">⚠️ 기존 문제가 모두 삭제됩니다!</span>
                  )}
                </p>
              </div>
            </label>
          )}

          {/* ── 업로드 중 ── */}
          {state === 'uploading' && (
            <div className="flex flex-col items-center gap-3 py-4">
              <div className="w-10 h-10 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin" />
              <p className="text-sm text-gray-600">문제를 등록하는 중...</p>
            </div>
          )}

          {/* ── 성공 결과 ── */}
          {state === 'success' && result && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-xl">
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-semibold text-green-800">업로드 완료!</p>
                  <p className="text-xs text-green-600 mt-0.5">문제가 성공적으로 등록되었습니다.</p>
                </div>
              </div>

              {/* 통계 */}
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-2xl font-bold text-gray-800">{result.total}</p>
                  <p className="text-xs text-gray-500 mt-0.5">전체 문제</p>
                </div>
                <div className="bg-green-50 rounded-xl p-3">
                  <p className="text-2xl font-bold text-green-700">{result.inserted}</p>
                  <p className="text-xs text-green-600 mt-0.5">등록 완료</p>
                </div>
                <div className="bg-orange-50 rounded-xl p-3">
                  <p className="text-2xl font-bold text-orange-600">{result.skipped}</p>
                  <p className="text-xs text-orange-500 mt-0.5">건너뜀</p>
                </div>
              </div>

              {/* 파싱 경고 */}
              {result.errors.length > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3">
                  <p className="text-xs font-medium text-yellow-800 mb-1.5">⚠️ 처리 중 발생한 경고</p>
                  <ul className="space-y-1">
                    {result.errors.slice(0, 5).map((err, i) => (
                      <li key={i} className="text-xs text-yellow-700">• {err}</li>
                    ))}
                    {result.errors.length > 5 && (
                      <li className="text-xs text-yellow-500">외 {result.errors.length - 5}개...</li>
                    )}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* ── 에러 메시지 ── */}
          {state === 'error' && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 space-y-2">
              <p className="text-sm font-medium text-red-700">❌ {errorMsg}</p>
              {result?.errors && result.errors.length > 0 && (
                <ul className="space-y-1">
                  {result.errors.slice(0, 5).map((err, i) => (
                    <li key={i} className="text-xs text-red-600">• {err}</li>
                  ))}
                  {result.errors.length > 5 && (
                    <li className="text-xs text-red-400">외 {result.errors.length - 5}개...</li>
                  )}
                </ul>
              )}
              <button
                onClick={reset}
                className="text-xs text-red-600 hover:text-red-800 underline"
              >
                다시 시도
              </button>
            </div>
          )}

          {/* ── 액션 버튼 ── */}
          <div className="flex justify-end gap-3 pt-1">
            {state === 'success' ? (
              <button
                onClick={onClose}
                className="px-5 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
              >
                닫기
              </button>
            ) : (
              <>
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  취소
                </button>
                <button
                  onClick={handleUpload}
                  disabled={!selectedFile || state === 'uploading'}
                  className="px-5 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg transition-colors flex items-center gap-2"
                >
                  {state === 'uploading' ? (
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
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
