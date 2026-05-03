'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectedFrom = searchParams.get('redirectedFrom') || '/dashboard'

  const [formData, setFormData] = useState({ email: '', password: '' })
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      })

      if (error) {
        const msg = error.message
        if (msg.includes('Invalid login') || msg.includes('invalid_credentials') || msg.includes('Email not confirmed')) {
          setError('이메일 또는 비밀번호가 올바르지 않습니다.')
        } else if (msg.includes('fetch') || msg.includes('network')) {
          setError('서버에 연결할 수 없습니다. 잠시 후 다시 시도해주세요.')
        } else {
          setError(`로그인 오류: ${msg}`)
        }
        setLoading(false)
        return
      }

      // refresh()로 서버 컴포넌트(세션 포함)를 갱신한 뒤 이동
      router.refresh()
      await new Promise((r) => setTimeout(r, 100))
      router.push(redirectedFrom)

    } catch (err: unknown) {
      console.error('[login] 예외 발생:', err)
      const message = err instanceof Error ? err.message : String(err)
      if (message.includes('fetch') || message.includes('Failed to fetch')) {
        setError('네트워크 오류가 발생했습니다. 인터넷 연결을 확인해주세요.')
      } else {
        setError('로그인 중 오류가 발생했습니다. 다시 시도해주세요.')
      }
      setLoading(false)
    }
  }

  return (
    <>
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">이메일</label>
          <input
            type="email"
            required
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="example@email.com"
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">비밀번호</label>
          <input
            type="password"
            required
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            placeholder="••••••••"
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 bg-cyan-600 hover:bg-cyan-700 disabled:bg-cyan-400 text-white font-medium rounded-lg text-sm transition-colors"
        >
          {loading ? '로그인 중...' : '로그인'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-500">
        계정이 없으신가요?{' '}
        <Link href="/signup" className="text-cyan-600 hover:text-cyan-700 font-medium">
          회원가입
        </Link>
      </p>
    </>
  )
}
