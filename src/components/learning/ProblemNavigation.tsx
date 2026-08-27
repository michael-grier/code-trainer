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
      <CardContent className="grid gap-3 p-4 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
        <NavItem direction="previous" item={previous} />
        <Button asChild className="justify-self-center" variant="outline">
          <Link to="/progress">Map</Link>
        </Button>
        <NavItem direction="next" item={next} />
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
      <div className="rounded-md border border-dashed p-3 text-sm text-muted-foreground">
        {isPrevious ? 'Start of path' : 'End of path'}
      </div>
    )
  }

  return (
    <Button
      asChild
      className={
        isPrevious
          ? 'h-auto w-full min-w-0 justify-start py-3'
          : 'h-auto w-full min-w-0 justify-end py-3'
      }
      variant="outline"
    >
      <Link to={`/lesson/${item.lessonSlug}/problem/${item.problemId}`}>
        <span className="grid min-w-0 text-left">
          <span className="text-xs text-muted-foreground">
            {isPrevious ? 'Previous' : 'Next'}
          </span>
          <span className="truncate">{item.problemTitle}</span>
        </span>
      </Link>
    </Button>
  )
}
