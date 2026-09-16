import { Search, X } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  getLessonsForTrack,
  getTrack,
  isLessonAvailable,
  lessons,
  tracks,
  type Lesson,
  type Track,
} from '@/curriculum'
import { getContinueTarget, learningTargetToPath } from '@/state/learningFlow'
import { useProgress } from '@/state/progressContext'
import { getProblemKey } from '@/state/progress'

export function HomePage() {
  const progress = useProgress()
  const location = useLocation()
  const availableLessons = lessons.filter(isLessonAvailable)
  const comingSoonLessonCount = lessons.length - availableLessons.length
  const recommendedLesson = progress.recommendedLesson ?? availableLessons[0]
  const recommendedTrack = getTrack(recommendedLesson.track)
  const continueTarget = getContinueTarget(lessons, progress.state)
  const continuePath = learningTargetToPath(continueTarget)
  const totalCompletedLessons = tracks.reduce((total, track) => {
    const completion = progress.getTrackCompletion(track, lessons, progress.state)

    return total + completion.completedLessons
  }, 0)
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

  // Sidebar track links navigate to "/#<trackId>". The router does not scroll
  // to hashes itself. Each navigation gets a new location key, so repeating
  // the same link still scrolls, and the ref stops filter edits from
  // re-scrolling once a navigation has been handled.
  const handledLocationKey = useRef<string>(undefined)

  useEffect(() => {
    if (!location.hash || handledLocationKey.current === location.key) {
      return
    }

    const trackId = location.hash.slice(1)
    const section = document.getElementById(trackId)

    if (section) {
      section.scrollIntoView({ block: 'start' })
      handledLocationKey.current = location.key
    } else if (tracks.some((track) => track.id === trackId)) {
      // The filter hid the target track. Clearing it re-renders the section,
      // and this effect runs again once trackSections changes.
      setQuery('')
    }
  }, [location, trackSections])

  return (
    <div className="mx-auto grid max-w-3xl gap-8">
      <section className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {totalCompletedLessons} of {availableLessons.length} available lessons
            complete
            {comingSoonLessonCount > 0 && ` · ${comingSoonLessonCount} coming soon`}
            {progress.syncStatus === 'guest' ? ' · saved in this browser' : ''}
          </p>
        </div>
        <Button asChild>
          <Link to={continuePath}>Continue</Link>
        </Button>
      </section>

      <section className="rounded-lg border bg-card/60 p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="text-xs text-muted-foreground">
              Up next{recommendedTrack ? ` · ${recommendedTrack.title}` : ''}
            </div>
            <div className="mt-0.5 truncate font-medium">
              {recommendedLesson.title}
            </div>
          </div>
          <Button asChild className="shrink-0" size="sm" variant="outline">
            <Link to={`/lesson/${recommendedLesson.slug}`}>Open lesson</Link>
          </Button>
        </div>
      </section>

      <section>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Curriculum
          </h2>
          <div className="flex h-9 w-full items-center gap-2 rounded-md border bg-card/60 px-3 sm:w-72">
            <Search className="size-4 shrink-0 text-muted-foreground" />
            <input
              aria-label="Filter lessons"
              className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Filter by lesson, track, or problem"
              value={query}
            />
            {query ? (
              <Button
                aria-label="Clear filter"
                className="size-6"
                onClick={() => setQuery('')}
                size="icon"
                type="button"
                variant="ghost"
              >
                <X className="size-4" />
              </Button>
            ) : null}
          </div>
        </div>

        {trackSections.length === 0 ? (
          <div className="mt-4 grid gap-2 rounded-md border border-dashed p-6 text-center">
            <h3 className="font-medium">No lessons match this filter</h3>
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

        <div className="mt-4 grid gap-8">
          {trackSections.map(({ lessons: trackLessons, track }) => {
            const completion = progress.getTrackCompletion(
              track,
              lessons,
              progress.state,
            )

            return (
              // The last section pads the page so any track heading can
              // scroll to the top, not just the ones with enough content below.
              <div
                className="scroll-mt-20 last:min-h-[calc(100vh-6rem)]"
                id={track.id}
                key={track.id}
              >
                <div className="flex items-baseline justify-between border-b pb-2">
                  <h3 className="font-medium">{track.title}</h3>
                  <span className="text-xs text-muted-foreground tabular-nums">
                    {completion.completedLessons}/{completion.totalLessons}
                  </span>
                </div>
                <ul className="mt-1 grid text-sm">
                  {trackLessons.map((lesson) => (
                    <LessonRow key={lesson.slug} lesson={lesson} />
                  ))}
                </ul>
              </div>
            )
          })}
        </div>
      </section>
    </div>
  )
}

function LessonRow({ lesson }: { lesson: Lesson }) {
  const progress = useProgress()
  const isComplete = progress.getLessonCompletion(lesson, progress.state).isComplete
  const completedProblems = lesson.problems.filter(
    (problem) => progress.state.completed[getProblemKey(lesson.slug, problem.id)],
  ).length

  if (!isLessonAvailable(lesson)) {
    return (
      <li>
        <div className="flex items-center justify-between gap-3 rounded-md px-2 py-2 text-muted-foreground">
          <span className="min-w-0 truncate">{lesson.title}</span>
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
        {isComplete ? (
          <>
            <span className="min-w-0 truncate text-muted-foreground line-through decoration-border">
              {lesson.title}
            </span>
            <span className="text-xs text-primary">done</span>
          </>
        ) : (
          <>
            <span className="min-w-0 truncate">{lesson.title}</span>
            <span className="text-xs text-muted-foreground tabular-nums">
              {completedProblems}/{lesson.problems.length}
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
