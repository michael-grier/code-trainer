import { useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'

import { Mdx } from '@/components/mdx/Mdx'
import { PrerequisiteNotice } from '@/components/learning/PrerequisiteNotice'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { getLesson, getTrack, lessons } from '@/curriculum'
import { formatSlug } from '@/lib/format'
import { useProgress } from '@/state/progressContext'

export function ConceptPage() {
  const { slug } = useParams()
  const lesson = getLesson(slug)
  const progress = useProgress()
  const { saveLastVisited } = progress

  useEffect(() => {
    if (lesson) {
      saveLastVisited(lesson.slug)
    }
  }, [lesson, saveLastVisited])

  if (!lesson) {
    return (
      <div className="mx-auto max-w-3xl">
        <Card>
          <CardHeader>
            <CardTitle>Lesson not found</CardTitle>
            <CardDescription>
              No registered lesson matches {slug ? formatSlug(slug) : 'this route'}.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link to="/progress">Back to curriculum map</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const track = getTrack(lesson.track)
  const nextProblem = progress.getRecommendedProblem(lesson, progress.state)
  const lessonStatus = progress.getLessonStatus(lesson, lessons, progress.state)
  const lessonCompletion = progress.getLessonCompletion(lesson, progress.state)

  return (
    <div className="mx-auto grid w-full min-w-0 max-w-5xl gap-8">
      <section className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">
            {track ? `${track.title} · ` : ''}
            {lessonCompletion.completedProblems}/{lessonCompletion.totalProblems}{' '}
            complete
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">
            {lesson.title}
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            {lesson.summary}
          </p>
        </div>
        <Button asChild className="shrink-0">
          <Link to={`/lesson/${lesson.slug}/problem/${nextProblem.id}`}>
            Start practice
          </Link>
        </Button>
      </section>

      {lessonStatus === 'ahead-of-path' ? (
        <PrerequisiteNotice
          lesson={lesson}
          recommendedLesson={progress.recommendedLesson}
        />
      ) : null}

      <div className="grid min-w-0 gap-8 lg:grid-cols-[minmax(0,1fr)_18rem]">
        {/* Lesson MDX conventionally opens with an h1 repeating the lesson
            title, which the page header already shows — hide that one. */}
        <section className="min-w-0 [&_article>h1:first-child]:hidden">
          <Mdx component={lesson.concept} />
        </section>

        <aside className="min-w-0">
          <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Practice
          </h2>
          <ul className="mt-2 grid text-sm">
            {lesson.problems.map((problem) => {
              const isComplete = progress.isProblemCompleted(
                lesson.slug,
                problem.id,
              )

              return (
                <li key={problem.id}>
                  <Link
                    className="flex min-w-0 items-center justify-between gap-3 rounded-md px-2 py-2 outline-none transition hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring"
                    to={`/lesson/${lesson.slug}/problem/${problem.id}`}
                  >
                    <span
                      className={
                        isComplete
                          ? 'min-w-0 truncate text-muted-foreground line-through decoration-border'
                          : 'min-w-0 truncate'
                      }
                    >
                      {problem.title}
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
        </aside>
      </div>
    </div>
  )
}
