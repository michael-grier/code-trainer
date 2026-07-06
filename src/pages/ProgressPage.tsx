import { Search } from 'lucide-react'
import { Link } from 'react-router-dom'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { getLessonsForTrack, lessons, tracks } from '@/curriculum'
import { useProgress } from '@/state/progressContext'

export function ProgressPage() {
  const progress = useProgress()
  const counts = progress.counts

  return (
    <div className="mx-auto grid max-w-6xl gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="grid gap-2">
          <Badge variant="outline">Progress</Badge>
          <h1 className="text-3xl font-semibold tracking-normal">
            Curriculum map
          </h1>
          <p className="max-w-2xl text-muted-foreground">
            Track completion, guided recommendation, focus lesson selection, and
            queue state are saved locally for guest use.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={progress.resetToGuidedPath}
            type="button"
            variant="outline"
          >
            Return to guided
          </Button>
          <Button disabled type="button" variant="outline">
            <Search className="size-4" />
            Filter lessons
          </Button>
        </div>
      </div>

      <section className="grid gap-4 md:grid-cols-4">
        {[
          ['Completed', String(counts.completed)],
          ['In progress', String(counts.inProgress)],
          ['Untouched', String(counts.untouched)],
          ['Ahead of path', String(counts.aheadOfPath)],
        ].map(([label, value]) => (
          <Card key={label}>
            <CardContent className="p-4">
              <div className="text-2xl font-semibold">{value}</div>
              <div className="text-sm text-muted-foreground">{label}</div>
            </CardContent>
          </Card>
        ))}
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Track overview</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          {tracks.map((track) => (
            <div className="grid gap-3" key={track.id}>
              {(() => {
                const completion = progress.getTrackCompletion(
                  track,
                  lessons,
                  progress.state,
                )

                return (
                  <>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 items-center gap-2">
                  <div className="min-w-0">
                    <h2 className="truncate font-medium">{track.title}</h2>
                    <p className="text-sm text-muted-foreground">
                      {track.lessonSlugs.length} lessons planned
                    </p>
                  </div>
                </div>
                <Badge variant="muted">{completion.percent}% complete</Badge>
              </div>
              <Progress value={completion.percent} />
                  </>
                )
              })()}
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {getLessonsForTrack(track.id).map((lesson) => {
                  const status = progress.getLessonStatus(
                    lesson,
                    lessons,
                    progress.state,
                  )
                  const isQueued =
                    progress.state.learningPath.queuedLessonSlugs.includes(
                      lesson.slug,
                    )

                  return (
                    <div
                      className="grid gap-3 rounded-md border p-3 text-sm"
                      key={lesson.slug}
                    >
                      <Link
                        className="outline-none transition hover:text-primary focus-visible:ring-2 focus-visible:ring-ring"
                        to={`/lesson/${lesson.slug}`}
                      >
                        <span className="block truncate font-medium">
                          {lesson.order}. {lesson.title}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {lesson.problems.length} problems
                        </span>
                      </Link>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant={status === 'completed' ? 'default' : 'muted'}>
                          {status}
                        </Badge>
                        <Button
                          onClick={() => progress.setFocusLesson(lesson.slug)}
                          size="sm"
                          type="button"
                          variant="outline"
                        >
                          Focus
                        </Button>
                        <Button
                          onClick={() =>
                            isQueued
                              ? progress.unqueueLesson(lesson.slug)
                              : progress.queueLesson(lesson.slug)
                          }
                          size="sm"
                          type="button"
                          variant="ghost"
                        >
                          {isQueued ? 'Queued' : 'Queue'}
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
              <Separator />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
