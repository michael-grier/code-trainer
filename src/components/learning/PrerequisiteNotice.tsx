import { Link } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import type { Lesson } from '@/curriculum/types'

type PrerequisiteNoticeProps = {
  lesson: Lesson
  recommendedLesson?: Lesson
}

export function PrerequisiteNotice({
  lesson,
  recommendedLesson,
}: PrerequisiteNoticeProps) {
  if (!recommendedLesson || recommendedLesson.slug === lesson.slug) {
    return null
  }

  return (
    <Card className="border-primary/30 bg-accent/40">
      <CardContent className="flex flex-col gap-3 p-4 text-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-3">
          <p className="text-muted-foreground">
            This lesson is ahead of the guided recommendation. Current guided step:
            {' '}
            <Link
              className="font-medium text-foreground underline-offset-4 hover:underline"
              to={`/lesson/${recommendedLesson.slug}`}
            >
              {recommendedLesson.title}
            </Link>
            .
          </p>
        </div>
        <Button asChild variant="outline">
          <Link to={`/lesson/${recommendedLesson.slug}`}>Open guided lesson</Link>
        </Button>
      </CardContent>
    </Card>
  )
}
