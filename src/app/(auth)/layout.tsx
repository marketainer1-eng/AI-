import Image from 'next/image'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 to-cyan-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* 로고 / 서비스 타이틀 */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center mb-4">
            <Image
              src="/kaia-logo.png"
              alt="KAIA 로고"
              width={80}
              height={80}
              className="object-contain drop-shadow-md"
            />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">AI에이전트협회</h1>
          <p className="text-sm text-cyan-600 mt-1 font-medium">KAIA · AI AGENT ASSOCIATION</p>
          <p className="text-xs text-gray-400 mt-1">자격증 시험 응시 사이트</p>
        </div>
        {/* 카드 컨테이너 */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {children}
        </div>
      </div>
    </div>
  )
}
