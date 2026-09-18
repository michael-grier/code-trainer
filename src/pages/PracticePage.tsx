import { Link, useParams } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { getLessonsForTrack, isLessonAvailable, tracks } from '@/curriculum'
import {
  isProblemKind,
  problemKindDescriptions,
  problemKindLabels,
} from '@/curriculum/problemKinds'
import { useProgress } from '@/state/progressContext'

export function PracticePage() {
  const { kind } = useParams()
  const progress = useProgress()

  if (!isProblemKind(kind)) {
    return (
      <div className="mx-auto max-w-3xl">
        <Card>
          <CardHeader>
            <CardTitle>Practice type not found</CardTitle>
            <CardDescription>No problem type matches this route.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link to="/">Back to dashboard</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const sections = tracks
    .map((track) => ({
      track,
      rows: getLessonsForTrack(track.id)
        .filter(isLessonAvailable)
        .flatMap((lesson) =>
          lesson.problems
            .filter((problem) => problem.kind === kind)
            .map((problem) => ({ lesson, problem })),
        ),
    }))
    .filter((section) => section.rows.length > 0)
  const total = sections.reduce((sum, section) => sum + section.rows.length, 0)
  const done = sections.reduce(
    (sum, section) =>
      sum +
      section.rows.filter(({ lesson, problem }) =>
        progress.isProblemCompleted(lesson.slug, problem.id),
      ).length,
    0,
  )

  return (
    // grid-cols-1 lets each single column shrink. Truncated titles do not
    // wrap, so an auto-sized column would overflow a phone's viewport.
    <div className="mx-auto grid max-w-3xl grid-cols-1 gap-8 2xl:max-w-6xl">
      <section>
        <p className="text-xs text-muted-foreground">Practice by type</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">
          {problemKindLabels[kind]} problems
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {problemKindDescriptions[kind]} {done} of {total} done.
        </p>
      </section>

      <div className="grid grid-cols-1 gap-8 2xl:grid-cols-2 2xl:items-start">
        {sections.map(({ rows, track }) => (
          <section key={track.id}>
            <h2 className="border-b pb-2 font-medium">{track.title}</h2>
            <ul className="mt-1 grid grid-cols-1 text-sm">
              {rows.map(({ lesson, problem }) => {
                const isComplete = progress.isProblemCompleted(lesson.slug, problem.id)

                return (
                  <li key={`${lesson.slug}/${problem.id}`}>
                    <Link
                      className="flex items-center justify-between gap-3 rounded-md px-2 py-2 outline-none transition hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring"
                      to={`/lesson/${lesson.slug}/problem/${problem.id}`}
                    >
                      <span className="min-w-0">
                        <span
                          className={
                            isComplete
                              ? 'block truncate text-muted-foreground line-through decoration-border'
                              : 'block truncate'
                          }
                        >
                          {problem.title}
                        </span>
                        <span className="block truncate text-xs text-muted-foreground">
                          {lesson.title}
                        </span>
                      </span>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {isComplete ? (
                          <span className="text-primary">done</span>
                        ) : (
                          `${problem.estimatedMinutes ?? 10} min`
                        )}
                      </span>
                    </Link>
                  </li>
                )
              })}
            </ul>
          </section>
        ))}
      </div>
    </div>
  )
}
