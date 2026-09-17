import { Link } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import type { ProblemNavigationItem } from '@/state/learningFlow'

type ProblemNavigationProps = {
  previous?: ProblemNavigationItem
  next?: ProblemNavigationItem
}

export function ProblemNavigation({ next, previous }: ProblemNavigationProps) {
  return (
    <Card className="min-w-0">
      <CardContent className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] sm:items-center">
        <NavItem direction="previous" item={previous} />
        <NavItem direction="next" item={next} />
        <Button
          asChild
          className="col-span-2 justify-self-center sm:col-span-1 sm:col-start-2 sm:row-start-1"
          variant="outline"
        >
          <Link to="/progress">Map</Link>
        </Button>
      </CardContent>
    </Card>
  )
}

function NavItem({
  direction,
  item,
}: {
  direction: 'previous' | 'next'
  item?: ProblemNavigationItem
}) {
  const isPrevious = direction === 'previous'

  if (!item) {
    return (
      <div className="min-w-0 rounded-md border border-dashed p-3 text-sm text-muted-foreground">
        {isPrevious ? 'Start of path' : 'End of path'}
      </div>
    )
  }

  return (
    <Button
      asChild
      className={
        isPrevious
          ? 'h-auto w-full min-w-0 items-start justify-start whitespace-normal py-3 sm:items-center'
          : 'h-auto w-full min-w-0 items-start justify-start whitespace-normal py-3 sm:items-center sm:justify-end'
      }
      variant="outline"
    >
      <Link to={`/lesson/${item.lessonSlug}/problem/${item.problemId}`}>
        <span className="grid min-w-0 text-left">
          <span className="text-xs text-muted-foreground">
            {isPrevious ? 'Previous' : 'Next'}
          </span>
          <span className="break-words sm:truncate">{item.problemTitle}</span>
        </span>
      </Link>
    </Button>
  )
}
