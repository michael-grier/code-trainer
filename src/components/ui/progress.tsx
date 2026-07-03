import * as ProgressPrimitive from '@radix-ui/react-progress'
import type { ComponentProps } from 'react'

import { cn } from '@/lib/cn'

type ProgressProps = ComponentProps<typeof ProgressPrimitive.Root> & {
  value?: number
}

function Progress({ className, value = 0, ...props }: ProgressProps) {
  const clampedValue = Math.min(Math.max(value, 0), 100)

  return (
    <ProgressPrimitive.Root
      className={cn(
        'relative h-2 w-full overflow-hidden rounded-full bg-secondary',
        className,
      )}
      data-slot="progress"
      value={clampedValue}
      {...props}
    >
      <ProgressPrimitive.Indicator
        className="h-full w-full flex-1 bg-primary transition-transform"
        data-slot="progress-indicator"
        style={{ transform: `translateX(-${100 - clampedValue}%)` }}
      />
    </ProgressPrimitive.Root>
  )
}

export { Progress }

