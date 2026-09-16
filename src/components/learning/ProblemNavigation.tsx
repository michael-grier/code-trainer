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
      <CardContent className="grid gap-3 p-4 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
        <NavItem direction="previous" item={previous} lessonSlug={lessonSlug} />
        <Button asChild className="justify-self-center" variant="outline">
          <Link to="/">Dashboard</Link>
        </Button>
        <NavItem direction="next" item={next} lessonSlug={lessonSlug} />
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
      <div className="rounded-md border border-dashed p-3 text-sm text-muted-foreground">
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
          ? 'h-auto w-full min-w-0 justify-start py-3'
          : 'h-auto w-full min-w-0 justify-end py-3'
      }
      variant="outline"
    >
      <Link to={`/lesson/${item.lessonSlug}/problem/${item.problemId}`}>
        <span className="grid min-w-0 text-left">
          <span className="truncate text-xs text-muted-foreground">{label}</span>
          <span className="truncate">{item.problemTitle}</span>
        </span>
      </Link>
    </Button>
  )
}
