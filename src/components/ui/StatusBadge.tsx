import { ExamStatus, EXAM_STATUS_LABEL, EXAM_STATUS_COLOR } from '@/types'
import { cn } from '@/lib/utils/cn'

interface StatusBadgeProps {
  status: ExamStatus
  className?: string
}

export default function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
        EXAM_STATUS_COLOR[status],
        className
      )}
    >
      {EXAM_STATUS_LABEL[status]}
    </span>
  )
}
