import { Suspense } from 'react'
import LoginForm from '@/components/auth/LoginForm'

export default function LoginPage() {
  return (
    <>
      <h2 className="text-xl font-semibold text-gray-800 mb-6">로그인</h2>
      <Suspense fallback={<div className="h-48 flex items-center justify-center text-gray-400 text-sm">로딩 중...</div>}>
        <LoginForm />
      </Suspense>
    </>
  )
}
