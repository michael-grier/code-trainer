import { useEffect, useRef, type ReactNode } from 'react'
import { Link, NavLink, useMatch } from 'react-router-dom'

import { getTrackShortTitle, trackPreviewItems } from '@/components/app/navigation'
import {
  getLesson,
  getLessonsForTrack,
  getTrack,
  isLessonAvailable,
  lessons,
  type Lesson,
  type Track,
} from '@/curriculum'
import { cn } from '@/lib/cn'
import { useProgress } from '@/state/progressContext'

export function Sidebar() {
  return (
    <aside className="hidden border-r md:block">
      <div className="sticky top-14 max-h-[calc(100vh-3.5rem)] overflow-y-auto px-3 py-5">
        <SidebarNav />
      </div>
    </aside>
  )
}

// Shared by the desktop sidebar and the mobile sheet. On lesson and problem
// pages it becomes an outline of the current track; elsewhere it lists tracks.
export function SidebarNav() {
  const problemMatch = useMatch('/lesson/:slug/problem/:problemId')
  const lessonMatch = useMatch('/lesson/:slug')
  const currentLesson = getLesson(
    problemMatch?.params.slug ?? lessonMatch?.params.slug,
  )
  const currentTrack = getTrack(currentLesson?.track)

  return (
    <div className="space-y-6 text-sm">
      <NavLink
        className={({ isActive }) =>
          cn(
            'block rounded-md px-3 py-1.5 text-muted-foreground outline-none transition hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring',
            isActive && 'bg-accent font-medium text-accent-foreground',
          )
        }
        end
        to="/"
      >
        Dashboard
      </NavLink>
      {currentLesson && currentTrack ? (
        <TrackOutline
          currentLesson={currentLesson}
          currentProblemId={problemMatch?.params.problemId}
          track={currentTrack}
        />
      ) : (
        <TrackList />
      )}
    </div>
  )
}

function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-2 px-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
      {children}
    </div>
  )
}

function TrackList() {
  const progress = useProgress()

  return (
    <nav aria-label="Tracks">
      <SectionLabel>Tracks</SectionLabel>
      <ul className="mt-2 space-y-0.5">
        {trackPreviewItems.map((track) => {
          const completion = progress.getTrackCompletion(
            track,
            lessons,
            progress.state,
          )

          return (
            <li key={track.id}>
              <Link
                className="flex items-center justify-between gap-2 rounded-md px-3 py-1.5 text-muted-foreground outline-none transition hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
                to={{ pathname: '/', hash: track.id }}
              >
                <span className="min-w-0 truncate">{track.shortTitle}</span>
                <span className="text-xs tabular-nums">
                  {completion.completedLessons}/{completion.totalLessons}
                </span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

function TrackOutline({
  currentLesson,
  currentProblemId,
  track,
}: {
  currentLesson: Lesson
  currentProblemId?: string
  track: Track
}) {
  const progress = useProgress()
  const completion = progress.getTrackCompletion(track, lessons, progress.state)
  const currentLessonRef = useRef<HTMLLIElement>(null)

  useEffect(() => {
    currentLessonRef.current?.scrollIntoView({ block: 'nearest' })
  }, [currentLesson.slug])

  return (
    <nav aria-label={`${track.title} lessons`}>
      <SectionLabel>
        <span className="min-w-0 truncate">{getTrackShortTitle(track)}</span>
        <span className="tabular-nums">
          {completion.completedLessons}/{completion.totalLessons}
        </span>
      </SectionLabel>
      <ul className="mt-2 space-y-0.5">
        {getLessonsForTrack(track.id).map((lesson) => {
          const isCurrent = lesson.slug === currentLesson.slug

          return (
            <li key={lesson.slug} ref={isCurrent ? currentLessonRef : undefined}>
              <LessonLink
                isCurrent={isCurrent && !currentProblemId}
                isExpanded={isCurrent}
                lesson={lesson}
              />
              {isCurrent ? (
                <ul className="ml-4 mt-0.5 space-y-0.5 border-l pl-1">
                  {lesson.problems.map((problem) => (
                    <ProblemLink
                      isCurrent={problem.id === currentProblemId}
                      key={problem.id}
                      lesson={lesson}
                      problem={problem}
                    />
                  ))}
                </ul>
              ) : null}
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

function LessonLink({
  isCurrent,
  isExpanded,
  lesson,
}: {
  isCurrent: boolean
  isExpanded: boolean
  lesson: Lesson
}) {
  const progress = useProgress()
  const completion = progress.getLessonCompletion(lesson, progress.state)

  if (!isLessonAvailable(lesson)) {
    return (
      <div className="flex items-center justify-between gap-2 rounded-md px-3 py-1.5 text-muted-foreground">
        <span className="min-w-0 truncate">{lesson.title}</span>
        <span className="text-xs">soon</span>
      </div>
    )
  }

  return (
    <Link
      aria-current={isCurrent ? 'page' : undefined}
      className={cn(
        'flex items-center justify-between gap-2 rounded-md px-3 py-1.5 text-muted-foreground outline-none transition hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring',
        isExpanded && 'font-medium text-foreground',
        isCurrent && 'bg-accent text-accent-foreground',
      )}
      to={`/lesson/${lesson.slug}`}
    >
      <span className="min-w-0 truncate">{lesson.title}</span>
      <span className="shrink-0 text-xs tabular-nums">
        {completion.isComplete ? (
          <span className="text-primary">done</span>
        ) : (
          `${completion.completedProblems}/${completion.totalProblems}`
        )}
      </span>
    </Link>
  )
}

function ProblemLink({
  isCurrent,
  lesson,
  problem,
}: {
  isCurrent: boolean
  lesson: Lesson
  problem: Lesson['problems'][number]
}) {
  const progress = useProgress()
  const isComplete = progress.isProblemCompleted(lesson.slug, problem.id)

  return (
    <li>
      <Link
        aria-current={isCurrent ? 'page' : undefined}
        className={cn(
          'block rounded-md px-3 py-1.5 text-muted-foreground outline-none transition hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring',
          isCurrent && 'bg-accent text-accent-foreground',
        )}
        to={`/lesson/${lesson.slug}/problem/${problem.id}`}
      >
        <span
          className={cn(
            'block',
            isComplete && !isCurrent && 'line-through decoration-border',
          )}
        >
          {problem.title}
        </span>
        <span className="block text-xs">
          {isComplete ? (
            <span className="text-primary">done</span>
          ) : (
            `${problem.kind} · ${problem.estimatedMinutes ?? 10} min`
          )}
        </span>
      </Link>
    </li>
  )
}
