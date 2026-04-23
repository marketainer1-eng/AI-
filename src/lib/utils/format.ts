/** 날짜 포맷 유틸리티 */
export function formatDate(dateString: string): string {
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(dateString))
}

/** 날짜 + 시간 포맷 유틸리티 */
export function formatDateTime(dateString: string): string {
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(dateString))
}

/** 금액 포맷 유틸리티 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('ko-KR', {
    style: 'currency',
    currency: 'KRW',
  }).format(amount)
}

/** 자격증 번호 생성 (예: CERT-2024-000001) */
export function generateCertificateNumber(id: number): string {
  const year = new Date().getFullYear()
  const padded = String(id).padStart(6, '0')
  return `CERT-${year}-${padded}`
}
