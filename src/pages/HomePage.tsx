import { Link } from 'react-router-dom'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  getLessonsForTrack,
  getTrack,
  isLessonAvailable,
  lessons,
  tracks,
  type Lesson,
} from '@/curriculum'
import { getContinueTarget, learningTargetToPath } from '@/state/learningFlow'
import { useProgress } from '@/state/progressContext'
import { getProblemKey } from '@/state/progress'

export function HomePage() {
  const progress = useProgress()
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

  return (
    <div className="mx-auto grid max-w-3xl gap-8">
      <section className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {totalCompletedLessons} of {availableLessons.length} available lessons
            complete · {comingSoonLessonCount} coming soon
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
        <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Curriculum
        </h2>
        <div className="mt-4 grid gap-8">
          {tracks.map((track) => {
            const completion = progress.getTrackCompletion(
              track,
              lessons,
              progress.state,
            )

            return (
              <div key={track.id}>
                <div className="flex items-baseline justify-between border-b pb-2">
                  <h3 className="font-medium">{track.title}</h3>
                  <span className="text-xs text-muted-foreground tabular-nums">
                    {completion.completedLessons}/{completion.totalLessons}
                  </span>
                </div>
                <ul className="mt-1 grid text-sm">
                  {getLessonsForTrack(track.id).map((lesson) => (
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
