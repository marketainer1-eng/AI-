import { ExamStatus, EXAM_STATUS_LABEL, EXAM_STATUS_FLOW } from '@/types'
import { cn } from '@/lib/utils/cn'

interface StatusStepperProps {
  currentStatus: ExamStatus
}

// 흐름에서 현재 단계 인덱스 반환 (failed는 passed와 같은 위치)
function getStepIndex(status: ExamStatus): number {
  if (status === 'failed') return EXAM_STATUS_FLOW.indexOf('passed')
  return EXAM_STATUS_FLOW.indexOf(status)
}

export default function StatusStepper({ currentStatus }: StatusStepperProps) {
  const currentIdx = getStepIndex(currentStatus)

  return (
    <div className="w-full py-4">
      <div className="flex items-center justify-between">
        {EXAM_STATUS_FLOW.map((step, idx) => {
          const isCompleted = idx < currentIdx
          const isCurrent = idx === currentIdx
          const isFailed = currentStatus === 'failed' && idx === currentIdx

          return (
            <div key={step} className="flex flex-1 items-center">
              {/* 스텝 원형 */}
              <div className="flex flex-col items-center flex-shrink-0">
                <div
                  className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all',
                    isCompleted
                      ? 'bg-indigo-600 border-indigo-600 text-white'
                      : isCurrent
                      ? isFailed
                        ? 'bg-red-100 border-red-500 text-red-600'
                        : 'bg-indigo-100 border-indigo-500 text-indigo-600'
                      : 'bg-gray-100 border-gray-300 text-gray-400'
                  )}
                >
                  {isCompleted ? (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    idx + 1
                  )}
                </div>
                <span
                  className={cn(
                    'mt-1 text-xs font-medium whitespace-nowrap',
                    isCurrent
                      ? isFailed ? 'text-red-600' : 'text-indigo-600'
                      : isCompleted ? 'text-indigo-500' : 'text-gray-400'
                  )}
                >
                  {isFailed && idx === currentIdx ? '불합격' : EXAM_STATUS_LABEL[step]}
                </span>
              </div>

              {/* 연결선 */}
              {idx < EXAM_STATUS_FLOW.length - 1 && (
                <div
                  className={cn(
                    'flex-1 h-0.5 mx-2 transition-colors',
                    idx < currentIdx ? 'bg-indigo-500' : 'bg-gray-200'
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
