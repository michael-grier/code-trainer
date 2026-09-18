import { Check, ChevronDown, Search, X } from 'lucide-react'
import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { Link, useLocation } from 'react-router-dom'

import { ActivityHeatmap } from '@/components/learning/ActivityHeatmap'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  getLesson,
  getLessonsForTrack,
  getProblem,
  getTrack,
  isLessonAvailable,
  lessons,
  tracks,
  type Lesson,
  type Track,
} from '@/curriculum'
import type { ProblemKind } from '@/curriculum/types'
import { problemKindLabels, problemKinds } from '@/curriculum/problemKinds'
import { cn } from '@/lib/cn'
import { formatRelativeTime } from '@/lib/format'
import { useMediaQuery } from '@/lib/useMediaQuery'
import { getSolvedCountsByDay, getStreaks } from '@/state/activity'
import { getRecentActivity } from '@/state/guidance'
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
  const focusTrack = getTrack(progress.focusTrackId)
  const continueTarget = getContinueTarget(lessons, progress.state)
  const continuePath = learningTargetToPath(continueTarget)
  const recentActivity = getRecentActivity(lessons, progress.state)
  const inProgressRows = buildInProgressRows({
    continueLesson: getLesson(continueTarget?.lessonSlug),
    continueProblemId: continueTarget?.problemId,
    continuePath,
    focusTrack,
    lastVisited: progress.state.lastVisited,
    recentActivity,
    recommendedLesson,
    recommendedTrack,
    getLessonCompletion: (lesson: Lesson) =>
      progress.getLessonCompletion(lesson, progress.state),
  })
  const kindCounts = Object.fromEntries(
    problemKinds.map((kind) => [kind, { done: 0, total: 0 }]),
  ) as Record<ProblemKind, { done: number; total: number }>

  for (const lesson of availableLessons) {
    for (const problem of lesson.problems) {
      kindCounts[problem.kind].total += 1

      if (progress.isProblemCompleted(lesson.slug, problem.id)) {
        kindCounts[problem.kind].done += 1
      }
    }
  }
  const totalCompletedLessons = tracks.reduce((total, track) => {
    const completion = progress.getTrackCompletion(track, lessons, progress.state)

    return total + completion.completedLessons
  }, 0)
  const solvedByDay = getSolvedCountsByDay(progress.state)
  const streaks = getStreaks(solvedByDay)
  // Matches Tailwind's 2xl breakpoint, where the guidance rail moves beside
  // the curriculum and there is room to keep every block expanded.
  const isTwoColumn = useMediaQuery('(min-width: 96rem)')
  // Below Tailwind's sm breakpoint the In progress list collapses too; the
  // Continue button in the page header still reaches the same target.
  const isPhone = useMediaQuery('(max-width: 39.99rem)')
  const activityHeatmap = <ActivityHeatmap solvedByDay={solvedByDay} streaks={streaks} />
  const practiceList = (
    <ul className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-4 2xl:grid-cols-1">
      {problemKinds.map((kind) => {
        const counts = kindCounts[kind]

        return (
          <li key={kind}>
            <Link
              className="flex items-center justify-between gap-2 rounded-md border bg-card/60 px-3 py-1.5 outline-none transition hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring"
              to={`/practice/${kind}`}
            >
              <span>{problemKindLabels[kind]}</span>
              <span className="text-xs text-muted-foreground tabular-nums">
                {counts.done}/{counts.total}
              </span>
            </Link>
          </li>
        )
      })}
    </ul>
  )
  const inProgressContent = (
    <>
      <ul className="grid grid-cols-1 text-sm">
        {inProgressRows.map((row) => (
          <li key={row.key}>
            <Link
              className={cn(
                'flex items-center justify-between gap-3 rounded-md px-2 py-2 outline-none transition hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring 2xl:flex-col 2xl:items-start 2xl:gap-0.5',
                row.tag === 'Continue' && 'bg-accent',
              )}
              to={row.path}
            >
              <span className="min-w-0">
                <span className="flex items-center gap-2">
                  <span className="truncate">{row.title}</span>
                  {row.tag ? (
                    <span className="shrink-0 rounded border px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">
                      {row.tag}
                    </span>
                  ) : null}
                </span>
                <span className="block truncate text-xs text-muted-foreground">
                  {row.detail}
                </span>
              </span>
              <span className="shrink-0 text-xs text-muted-foreground">{row.meta}</span>
            </Link>
          </li>
        ))}
      </ul>
      <p className="mt-3 flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
        {focusTrack ? (
          <>
            <span>
              The guided step follows{' '}
              <span className="text-foreground">{focusTrack.title}</span> while
              it is focused.
            </span>
            <button
              className="rounded-sm text-primary underline-offset-4 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring"
              onClick={() => progress.setFocusTrack(undefined)}
              type="button"
            >
              Back to the curriculum order
            </button>
          </>
        ) : (
          <span>
            The guided step follows the curriculum order. Focus a track below to
            put its lessons first.
          </span>
        )}
      </p>
    </>
  )
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
    // Single-column grids here use grid-cols-1 so the column can shrink.
    // Truncated titles do not wrap, and an auto-sized column would grow to
    // the longest one and push the page past a phone's viewport.
    <div className="mx-auto grid max-w-3xl grid-cols-1 gap-8 2xl:max-w-6xl 2xl:grid-cols-[minmax(0,1fr)_22rem] 2xl:items-start">
      <section className="flex flex-wrap items-end justify-between gap-4 2xl:col-span-2">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {totalCompletedLessons} of {availableLessons.length} available lessons
            complete
            {comingSoonLessonCount > 0 && ` · ${comingSoonLessonCount} coming soon`}
            {progress.syncStatus === 'guest' ? ' · saved in this browser' : ''}
          </p>
        </div>
        <Button asChild className="w-full sm:w-auto">
          <Link to={continuePath}>Continue</Link>
        </Button>
      </section>

      {isTwoColumn ? (
        <section className="col-span-2">
          <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Activity
          </h2>
          <div className="mt-2 rounded-md border bg-card/60 p-4">{activityHeatmap}</div>
        </section>
      ) : null}

      {/* On wide screens the guidance blocks sit beside the curriculum */}
      <div className="grid grid-cols-1 gap-8 2xl:sticky 2xl:top-[4.75rem] 2xl:order-2">
        {isPhone ? null : (
          <section>
            <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              In progress
            </h2>
            <div className="mt-2">{inProgressContent}</div>
          </section>
        )}

        {isTwoColumn ? (
          <section>
            <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Practice by type
            </h2>
            <div className="mt-2">{practiceList}</div>
          </section>
        ) : (
          // Collapsed by default so the curriculum stays near the top of a
          // single-column page.
          <div className="divide-y rounded-md border bg-card/60">
            {isPhone ? (
              <CollapsibleSection summary={inProgressRows[0]?.title} title="In progress">
                {inProgressContent}
              </CollapsibleSection>
            ) : null}
            <CollapsibleSection
              summary={`${streaks.current}-day streak`}
              title="Activity"
            >
              {activityHeatmap}
            </CollapsibleSection>
            <CollapsibleSection title="Practice by type">{practiceList}</CollapsibleSection>
          </div>
        )}
      </div>

      <section className="2xl:order-1">
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

        <div className="mt-4 grid grid-cols-1 gap-8">
          {trackSections.map(({ lessons: trackLessons, track }) => {
            const completion = progress.getTrackCompletion(
              track,
              lessons,
              progress.state,
            )
            const isFocused = track.id === focusTrack?.id

            return (
              // The last section pads the page so any track heading can
              // scroll to the top, not just the ones with enough content below.
              <div
                className="scroll-mt-20 last:min-h-[calc(100vh-6rem)]"
                id={track.id}
                key={track.id}
              >
                <div className="flex items-center justify-between gap-3 border-b pb-2">
                  <h3 className="min-w-0 truncate font-medium">{track.title}</h3>
                  <div className="flex shrink-0 items-center gap-2">
                    <Button
                      aria-pressed={isFocused}
                      className="h-7 px-2 text-xs"
                      title={
                        isFocused
                          ? 'Clear the focus and follow the guided path'
                          : 'Work through this track first'
                      }
                      onClick={() =>
                        progress.setFocusTrack(isFocused ? undefined : track.id)
                      }
                      size="sm"
                      type="button"
                      variant={isFocused ? 'secondary' : 'ghost'}
                    >
                      {isFocused ? <Check className="size-3.5" /> : null}
                      {isFocused ? 'Focused' : 'Focus'}
                    </Button>
                    <span className="text-xs text-muted-foreground tabular-nums">
                      {completion.completedLessons}/{completion.totalLessons}
                    </span>
                  </div>
                </div>
                <ul className="mt-1 grid grid-cols-1 text-sm">
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

function CollapsibleSection({
  children,
  summary,
  title,
}: {
  children: ReactNode
  summary?: string
  title: string
}) {
  const [isOpen, setIsOpen] = useState(false)
  const contentId = useId()

  return (
    <section>
      <h2>
        <button
          aria-controls={contentId}
          aria-expanded={isOpen}
          className="flex w-full items-center justify-between gap-3 rounded-md px-3 py-2.5 text-xs font-medium uppercase tracking-wider text-muted-foreground outline-none transition hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
          onClick={() => setIsOpen((current) => !current)}
          type="button"
        >
          <span className="shrink-0">{title}</span>
          <span className="flex min-w-0 items-center gap-2 font-normal normal-case tracking-normal">
            <span className="truncate">{summary}</span>
            <ChevronDown
              className={cn('size-4 shrink-0 transition', isOpen && 'rotate-180')}
            />
          </span>
        </button>
      </h2>
      <div className="px-3 pb-3 pt-1" hidden={!isOpen} id={contentId}>
        {children}
      </div>
    </section>
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

type InProgressRow = {
  key: string
  path: string
  title: string
  detail: string
  meta: ReactNode
  tag?: 'Continue' | 'Guided step' | 'Focused step'
}

// One list answers "what next": the Continue target first, then other
// unfinished work, then the guided step unless Continue already points into
// that lesson.
function buildInProgressRows({
  continueLesson,
  continueProblemId,
  continuePath,
  focusTrack,
  getLessonCompletion,
  lastVisited,
  recentActivity,
  recommendedLesson,
  recommendedTrack,
}: {
  continueLesson: Lesson | undefined
  continueProblemId: string | undefined
  continuePath: string
  focusTrack: Track | undefined
  getLessonCompletion: (lesson: Lesson) => { completedProblems: number; totalProblems: number }
  lastVisited: { lessonSlug: string; problemId?: string; updatedAt: number } | undefined
  recentActivity: ReturnType<typeof getRecentActivity>
  recommendedLesson: Lesson
  recommendedTrack: Track | undefined
}): InProgressRow[] {
  const activityRows: InProgressRow[] = recentActivity.map((item) => ({
    key: getProblemKey(item.lesson.slug, item.problem.id),
    path: `/lesson/${item.lesson.slug}/problem/${item.problem.id}`,
    title: item.problem.title,
    detail: `${item.lesson.title} · ${problemKindLabels[item.problem.kind]}`,
    meta: (
      <>
        {item.hasDraft ? <span className="text-primary">draft saved · </span> : null}
        {formatRelativeTime(item.updatedAt)}
      </>
    ),
  }))
  const lessonMeta = (lesson: Lesson) => {
    const completion = getLessonCompletion(lesson)

    return completion.completedProblems > 0
      ? `${completion.completedProblems}/${completion.totalProblems} done`
      : 'not started'
  }
  const continueProblem = getProblem(continueLesson, continueProblemId)
  const continueKey = continueLesson
    ? continueProblem
      ? getProblemKey(continueLesson.slug, continueProblem.id)
      : `lesson:${continueLesson.slug}`
    : undefined
  const isLastVisited =
    lastVisited?.lessonSlug === continueLesson?.slug &&
    lastVisited?.problemId === continueProblem?.id
  const continueRow: InProgressRow | undefined = continueLesson
    ? {
        ...(activityRows.find((row) => row.key === continueKey) ?? {
          key: continueKey ?? continuePath,
          path: continuePath,
          title: continueProblem?.title ?? continueLesson.title,
          detail: continueProblem
            ? `${continueLesson.title} · ${problemKindLabels[continueProblem.kind]}`
            : (getTrack(continueLesson.track)?.title ?? ''),
          meta:
            isLastVisited && lastVisited
              ? `last visited ${formatRelativeTime(lastVisited.updatedAt)}`
              : lessonMeta(continueLesson),
        }),
        tag: 'Continue',
      }
    : undefined
  const guidedRow: InProgressRow | undefined =
    continueLesson?.slug === recommendedLesson.slug
      ? undefined
      : {
          key: `lesson:${recommendedLesson.slug}`,
          path: `/lesson/${recommendedLesson.slug}`,
          title: recommendedLesson.title,
          detail: `${recommendedTrack?.title ?? ''} · ${recommendedLesson.problems.length} problems`,
          meta: lessonMeta(recommendedLesson),
          tag: focusTrack ? 'Focused step' : 'Guided step',
        }

  return [
    continueRow,
    ...activityRows.filter((row) => row.key !== continueKey),
    guidedRow,
  ].filter((row) => row !== undefined)
}
