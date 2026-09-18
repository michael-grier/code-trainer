import { Link } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import type { ProblemNavigationItem } from '@/state/learningFlow'

type ProblemNavigationProps = {
  lessonSlug: string
  previous?: ProblemNavigationItem
  next?: ProblemNavigationItem
}

export function ProblemNavigation({
  lessonSlug,
  next,
  previous,
}: ProblemNavigationProps) {
  return (
    <Card className="min-w-0">
      <CardContent className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] sm:items-center">
        <NavItem direction="previous" item={previous} lessonSlug={lessonSlug} />
        <NavItem direction="next" item={next} lessonSlug={lessonSlug} />
        <Button
          asChild
          className="col-span-2 justify-self-center sm:col-span-1 sm:col-start-2 sm:row-start-1"
          variant="outline"
        >
          <Link to="/">Dashboard</Link>
        </Button>
      </CardContent>
    </Card>
  )
}

function NavItem({
  direction,
  item,
  lessonSlug,
}: {
  direction: 'previous' | 'next'
  item?: ProblemNavigationItem
  lessonSlug: string
}) {
  const isPrevious = direction === 'previous'

  if (!item) {
    return (
      <div className="min-w-0 rounded-md border border-dashed p-3 text-sm text-muted-foreground">
        {isPrevious ? 'Start of path' : 'End of path'}
      </div>
    )
  }

  // Problems run in one sequence across lessons, so say when a step leaves
  // the current lesson instead of silently landing in another one.
  const label =
    item.lessonSlug === lessonSlug
      ? isPrevious
        ? 'Previous'
        : 'Next'
      : `${isPrevious ? 'Previous' : 'Next'} lesson · ${item.lessonTitle}`

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
          <span className="break-words text-xs text-muted-foreground sm:truncate">
            {label}
          </span>
          <span className="break-words sm:truncate">{item.problemTitle}</span>
        </span>
      </Link>
    </Button>
  )
}
