import { ArrowRight, Search, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { getLessonsForTrack, lessons, tracks } from '@/curriculum'
import type { Lesson, Track } from '@/curriculum'
import { useProgress } from '@/state/progressContext'

export function ProgressPage() {
  const progress = useProgress()
  const counts = progress.counts
  const [query, setQuery] = useState('')
  const normalizedQuery = query.trim().toLowerCase()
  const trackSections = useMemo(
    () =>
      tracks
        .map((track) => ({
          track,
          lessons: getLessonsForTrack(track.id).filter((lesson) =>
            matchesLessonQuery(track, lesson, normalizedQuery),
          ),
        }))
        .filter((section) => !normalizedQuery || section.lessons.length > 0),
    [normalizedQuery],
  )
  const visibleLessonCount = trackSections.reduce(
    (total, section) => total + section.lessons.length,
    0,
  )

  return (
    <div className="mx-auto grid max-w-6xl gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="grid gap-2">
          <Badge variant="outline">Progress</Badge>
          <h1 className="text-3xl font-semibold tracking-normal">
            Curriculum map
          </h1>
          <p className="max-w-2xl text-muted-foreground">
            Track completion, guided recommendation, and manual lesson navigation
            are saved locally for guests and synced for signed-in users.
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-2 rounded-lg border bg-card p-3 shadow-sm sm:flex-row sm:items-center">
        <div className="flex min-w-0 flex-1 items-center gap-2 rounded-md border bg-background px-3">
          <Search className="size-4 shrink-0 text-muted-foreground" />
          <input
            aria-label="Filter lessons"
            className="h-10 min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Filter by lesson, track, or problem"
            value={query}
          />
          {query ? (
            <Button
              aria-label="Clear filter"
              className="size-7"
              onClick={() => setQuery('')}
              size="icon"
              type="button"
              variant="ghost"
            >
              <X className="size-4" />
            </Button>
          ) : null}
        </div>
        <Badge className="self-start sm:self-auto" variant="muted">
          {visibleLessonCount} shown
        </Badge>
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
          {trackSections.length === 0 ? (
            <div className="grid gap-2 rounded-md border border-dashed p-6 text-center">
              <h2 className="font-medium">No lessons match this filter</h2>
              <p className="text-sm text-muted-foreground">
                Clear the filter to return to the full curriculum map.
              </p>
              <Button
                className="justify-self-center"
                onClick={() => setQuery('')}
                type="button"
                variant="outline"
              >
                Clear filter
              </Button>
            </div>
          ) : null}

          {trackSections.map(({ lessons: trackLessons, track }) => {
            const completion = progress.getTrackCompletion(
              track,
              lessons,
              progress.state,
            )

            return (
              <div className="grid gap-3" key={track.id}>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex min-w-0 items-center gap-2">
                    <div className="min-w-0">
                      <h2 className="truncate font-medium">{track.title}</h2>
                      <p className="text-sm text-muted-foreground">
                        {trackLessons.length}/{track.lessonSlugs.length} lessons
                        shown
                      </p>
                    </div>
                  </div>
                  <Badge variant="muted">{completion.percent}% complete</Badge>
                </div>
                <Progress value={completion.percent} />
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {trackLessons.map((lesson) => {
                    const status = progress.getLessonStatus(
                      lesson,
                      lessons,
                      progress.state,
                    )
                    return (
                      <div
                        className="grid gap-3 rounded-md border bg-background p-3 text-sm"
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
                          <Badge
                            variant={
                              status === 'completed' ? 'default' : 'muted'
                            }
                          >
                            {status}
                          </Badge>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Button asChild size="sm" variant="outline">
                            <Link to={`/lesson/${lesson.slug}`}>
                              Open
                              <ArrowRight className="size-4" />
                            </Link>
                          </Button>
                        </div>
                      </div>
                    )
                  })}
                </div>
                <Separator />
              </div>
            )
          })}
        </CardContent>
      </Card>
    </div>
  )
}

function matchesLessonQuery(track: Track, lesson: Lesson, query: string) {
  if (!query) {
    return true
  }

  return [
    track.title,
    track.summary,
    lesson.title,
    lesson.summary,
    String(lesson.order),
    ...lesson.problems.map((problem) => problem.title),
  ].some((value) => value.toLowerCase().includes(query))
}
