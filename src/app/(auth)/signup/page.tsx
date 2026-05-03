'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type Step = 'form' | 'verify_email' | 'done'

export default function SignupPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    passwordConfirm: '',
    full_name: '',
    phone: '',
  })
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState<Step>('form')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (formData.password !== formData.passwordConfirm) {
      setError('비밀번호가 일치하지 않습니다.')
      return
    }
    if (formData.password.length < 6) {
      setError('비밀번호는 6자 이상이어야 합니다.')
      return
    }

    setLoading(true)

    try {
      const supabase = createClient()

      const { data, error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.full_name,
            phone: formData.phone,
          },
        },
      })

      if (signUpError) {
        const msg = signUpError.message
        if (msg === 'User already registered' || msg.includes('already registered')) {
          setError('이미 가입된 이메일입니다.')
        } else if (msg.includes('Password should be') || msg.includes('password')) {
          setError('비밀번호는 6자 이상이어야 합니다.')
        } else if (msg.includes('Unable to validate') || msg.includes('fetch') || msg.includes('network')) {
          setError('서버에 연결할 수 없습니다. 잠시 후 다시 시도해주세요.')
        } else {
          setError(`회원가입 오류: ${msg}`)
        }
        setLoading(false)
        return
      }

      // 세션이 바로 생성된 경우 (이메일 인증 비활성화된 Supabase 프로젝트)
      if (data?.session) {
        router.refresh()
        await new Promise((r) => setTimeout(r, 100))
        router.push('/dashboard')
        return
      }

      // 세션 없음이지만 user가 있는 경우 → 이메일 인증 OFF인데 세션이 늦게 생성되는 경우
      // 자동 로그인 시도
      if (data?.user) {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        })
        if (!signInError) {
          router.refresh()
          await new Promise((r) => setTimeout(r, 100))
          router.push('/dashboard')
          return
        }
      }

      // 세션 없음 = 이메일 인증 필요 → 안내 화면으로 전환
      setStep('verify_email')
      setLoading(false)

    } catch (err: unknown) {
      // 네트워크 오류, Supabase URL 미설정 등 예외 상황
      console.error('[signup] 예외 발생:', err)
      const message = err instanceof Error ? err.message : String(err)
      if (message.includes('fetch') || message.includes('Failed to fetch') || message.includes('network')) {
        setError('네트워크 오류가 발생했습니다. 인터넷 연결을 확인해주세요.')
      } else {
        setError('회원가입 중 오류가 발생했습니다. 다시 시도해주세요.')
      }
      setLoading(false)
    }
  }

  // ── 이메일 인증 안내 화면 ─────────────────────────────────────
  if (step === 'verify_email') {
    return (
      <div className="text-center">
        <div className="w-16 h-16 bg-cyan-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-gray-800 mb-2">이메일을 확인해주세요</h2>
        <p className="text-sm text-gray-600 mb-1">
          <span className="font-medium text-cyan-600">{formData.email}</span> 으로
        </p>
        <p className="text-sm text-gray-600 mb-6">
          인증 링크를 보냈습니다. 링크를 클릭하면 자동으로 로그인됩니다.
        </p>
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-700 mb-6 text-left">
          <p className="font-medium mb-1">📬 메일이 안 보이나요?</p>
          <ul className="space-y-1 list-disc list-inside">
            <li>스팸/프로모션 폴더를 확인해주세요</li>
            <li>1~2분 정도 기다려보세요</li>
            <li>그래도 안 오면 아래에서 다시 시도해주세요</li>
          </ul>
        </div>
        <Link
          href="/login"
          className="block w-full py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white font-medium rounded-lg text-sm transition-colors text-center"
        >
          로그인 페이지로 이동
        </Link>
        <button
          onClick={() => { setStep('form'); setError(null) }}
          className="mt-3 text-sm text-gray-500 hover:text-gray-700 underline"
        >
          다시 시도하기
        </button>
      </div>
    )
  }

  // ── 회원가입 폼 ───────────────────────────────────────────────
  return (
    <>
      <h2 className="text-xl font-semibold text-gray-800 mb-6">회원가입</h2>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">이름</label>
          <input
            type="text"
            required
            value={formData.full_name}
            onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
            placeholder="홍길동"
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">이메일</label>
          <input
            type="email"
            required
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="example@email.com"
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">연락처</label>
          <input
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            placeholder="010-0000-0000"
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">비밀번호</label>
          <input
            type="password"
            required
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            placeholder="6자 이상"
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">비밀번호 확인</label>
          <input
            type="password"
            required
            value={formData.passwordConfirm}
            onChange={(e) => setFormData({ ...formData, passwordConfirm: e.target.value })}
            placeholder="비밀번호 재입력"
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 bg-cyan-600 hover:bg-cyan-700 disabled:bg-cyan-400 text-white font-medium rounded-lg text-sm transition-colors"
        >
          {loading ? '가입 처리 중...' : '회원가입'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-500">
        이미 계정이 있으신가요?{' '}
        <Link href="/login" className="text-cyan-600 hover:text-cyan-700 font-medium">
          로그인
        </Link>
      </p>
    </>
  )
}
