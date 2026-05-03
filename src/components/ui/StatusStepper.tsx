import { ApplicationStatus } from '@/types'
import { cn } from '@/lib/utils/cn'

interface StatusStepperProps {
  currentStatus: ApplicationStatus
}

/**
 * 시험 진행 단계를 표시하는 스텝퍼
 * 흐름: 신청 완료(approved) → 합격/불합격(passed/failed) → 자격증 발급(certificate_ready)
 *
 * waiting_payment 는 즉시 approved 로 전환되고,
 * exam_completed 는 자동채점으로 즉시 passed/failed 로 전환되므로
 * UI 흐름에서 이 두 단계는 표시하지 않습니다.
 */

type StepDef = {
  key: string
  label: string
  icon: string
}

const STEPS: StepDef[] = [
  { key: 'approved',          label: '시험 신청',   icon: '📝' },
  { key: 'passed',            label: '합격·불합격', icon: '📊' },
  { key: 'certificate_ready', label: '자격증 발급', icon: '🏆' },
]

/**
 * 현재 상태에 대응하는 스텝 인덱스 반환
 * - waiting_payment / approved / exam_completed → step 0 (시험 신청)
 * - passed / failed                             → step 1 (합격·불합격)
 * - certificate_ready                           → step 2 (자격증 발급)
 */
function getStepIndex(status: ApplicationStatus): number {
  switch (status) {
    case 'waiting_payment':
    case 'approved':
    case 'exam_completed':
      return 0
    case 'passed':
    case 'failed':
      return 1
    case 'certificate_ready':
      return 2
    default:
      return 0
  }
}

export default function StatusStepper({ currentStatus }: StatusStepperProps) {
  const currentIdx = getStepIndex(currentStatus)
  const isFailed   = currentStatus === 'failed'

  return (
    <div className="w-full py-4">
      <div className="flex items-center justify-between">
        {STEPS.map((step, idx) => {
          const isCompleted = idx < currentIdx
          const isCurrent   = idx === currentIdx
          const isFailedStep = isFailed && idx === 1   // 합격·불합격 단계에서 불합격

          return (
            <div key={step.key} className="flex flex-1 items-center">
              {/* 스텝 원형 */}
              <div className="flex flex-col items-center flex-shrink-0">
                <div
                  className={cn(
                    'w-10 h-10 rounded-full flex items-center justify-center text-lg border-2 transition-all',
                    isCompleted
                      ? 'bg-cyan-600 border-cyan-600 text-white'
                      : isCurrent
                      ? isFailedStep
                        ? 'bg-red-100 border-red-500 text-red-600'
                        : 'bg-cyan-100 border-cyan-500 text-cyan-600'
                      : 'bg-gray-100 border-gray-300 text-gray-300'
                  )}
                >
                  {isCompleted ? (
                    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <span>{step.icon}</span>
                  )}
                </div>

                <span
                  className={cn(
                    'mt-1.5 text-xs font-medium whitespace-nowrap',
                    isCurrent
                      ? isFailedStep
                        ? 'text-red-600'
                        : 'text-cyan-600'
                      : isCompleted
                      ? 'text-cyan-500'
                      : 'text-gray-400'
                  )}
                >
                  {/* 합격·불합격 단계에서 불합격인 경우 라벨 변경 */}
                  {isFailedStep && idx === 1 ? '불합격' : step.label}
                </span>

                {/* 현재 단계 상태 부가 설명 */}
                {isCurrent && (
                  <span className={cn(
                    'mt-0.5 text-[10px] font-medium',
                    isFailedStep ? 'text-red-400' : 'text-cyan-400'
                  )}>
                    {currentStatus === 'approved'          ? '응시 대기'   :
                     currentStatus === 'exam_completed'    ? '채점 중'     :
                     currentStatus === 'passed'            ? '🎉 합격'     :
                     currentStatus === 'failed'            ? '재응시 가능'  :
                     currentStatus === 'certificate_ready' ? '발급 완료'   : ''}
                  </span>
                )}
              </div>

              {/* 연결선 */}
              {idx < STEPS.length - 1 && (
                <div
                  className={cn(
                    'flex-1 h-0.5 mx-3 transition-colors',
                    idx < currentIdx ? 'bg-cyan-500' : 'bg-gray-200'
                  )}
                />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
