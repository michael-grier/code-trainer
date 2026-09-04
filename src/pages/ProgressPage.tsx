import { Search, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  getLessonsForTrack,
  isLessonAvailable,
  lessons,
  tracks,
  type Lesson,
  type Track,
} from '@/curriculum'
import { getProblemKey } from '@/state/progress'
import { useProgress } from '@/state/progressContext'

export function ProgressPage() {
  const progress = useProgress()
  const counts = progress.counts
  const availableLessonCount = lessons.filter(isLessonAvailable).length
  const comingSoonLessonCount = lessons.length - availableLessonCount
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

  return (
    <div className="mx-auto grid max-w-3xl gap-8">
      <section>
        <h1 className="text-2xl font-semibold tracking-tight">Curriculum map</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {counts.completed} done · {counts.inProgress} in progress ·{' '}
          {availableLessonCount - counts.completed - counts.inProgress} remaining
          {' · '}
          {comingSoonLessonCount} coming soon
        </p>
      </section>

      <div className="flex items-center gap-2 rounded-md border bg-card/60 px-3">
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

      {trackSections.length === 0 ? (
        <div className="grid gap-2 rounded-md border border-dashed p-6 text-center">
          <h2 className="font-medium">No lessons match this filter</h2>
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

      <div className="grid gap-8">
        {trackSections.map(({ lessons: trackLessons, track }) => {
          const completion = progress.getTrackCompletion(
            track,
            lessons,
            progress.state,
          )

          return (
            <section key={track.id}>
              <div className="flex items-baseline justify-between border-b pb-2">
                <h2 className="font-medium">{track.title}</h2>
                <span className="text-xs text-muted-foreground tabular-nums">
                  {completion.completedLessons}/{completion.totalLessons}
                </span>
              </div>
              <ul className="mt-1 grid text-sm">
                {trackLessons.map((lesson) => (
                  <LessonStatusRow key={lesson.slug} lesson={lesson} />
                ))}
              </ul>
            </section>
          )
        })}
      </div>
    </div>
  )
}

function LessonStatusRow({ lesson }: { lesson: Lesson }) {
  const progress = useProgress()
  const status = progress.getLessonStatus(lesson, lessons, progress.state)
  const completedProblems = lesson.problems.filter(
    (problem) => progress.state.completed[getProblemKey(lesson.slug, problem.id)],
  ).length

  if (status === 'coming-soon') {
    return (
      <li>
        <div className="flex items-center justify-between gap-3 rounded-md px-2 py-2 text-muted-foreground">
          <span className="min-w-0 truncate">
            {lesson.order}. {lesson.title}
          </span>
          <Badge className="border border-border" variant="muted">
            Coming soon
          </Badge>
        </div>
      </li>
    )
  }

  return (
    <li>
      <Link
        className="flex items-center justify-between gap-3 rounded-md px-2 py-2 outline-none transition hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring"
        to={`/lesson/${lesson.slug}`}
      >
        {status === 'completed' ? (
          <>
            <span className="min-w-0 truncate text-muted-foreground line-through decoration-border">
              {lesson.order}. {lesson.title}
            </span>
            <span className="text-xs text-primary">done</span>
          </>
        ) : (
          <>
            <span className="min-w-0 truncate">
              {lesson.order}. {lesson.title}
            </span>
            <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
              {status === 'recommended' ? (
                <span className="text-primary">up next</span>
              ) : (
                `${completedProblems}/${lesson.problems.length}`
              )}
            </span>
          </>
        )}
      </Link>
    </li>
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
