import { Link } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { getTrack } from '@/curriculum'
import type { Lesson } from '@/curriculum/types'
import { useProgress } from '@/state/progressContext'

type PrerequisiteNoticeProps = {
  lesson: Lesson
  recommendedLesson?: Lesson
}

export function PrerequisiteNotice({
  lesson,
  recommendedLesson,
}: PrerequisiteNoticeProps) {
  const { setFocusTrack } = useProgress()
  const track = getTrack(lesson.track)

  if (!recommendedLesson || recommendedLesson.slug === lesson.slug) {
    return null
  }

  return (
    <Card className="border-primary/30 bg-accent/40">
      <CardContent className="flex flex-col gap-3 p-4 text-sm sm:flex-row sm:items-center sm:justify-between">
        <p className="text-muted-foreground">
          This lesson is ahead of the guided recommendation. Current guided step:
          {' '}
          <Link
            className="font-medium text-foreground underline-offset-4 hover:underline"
            to={`/lesson/${recommendedLesson.slug}`}
          >
            {recommendedLesson.title}
          </Link>
          . Focusing on this track makes its lessons your next steps instead.
        </p>
        <div className="flex shrink-0 flex-wrap gap-2">
          {track ? (
            <Button
              onClick={() => setFocusTrack(track.id)}
              type="button"
              variant="outline"
            >
              Focus on this track
            </Button>
          ) : null}
          <Button asChild variant="outline">
            <Link to={`/lesson/${recommendedLesson.slug}`}>Open guided lesson</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
