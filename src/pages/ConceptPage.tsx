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
              <Link to="/">Back to dashboard</Link>
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
    <div className="mx-auto grid w-full min-w-0 max-w-[60rem] gap-8">
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

      {/* The page header already displays the title repeated by lesson MDX. */}
      <section className="min-w-0 [&_article>h1:first-child]:hidden">
        <Mdx component={lesson.concept} />
        <div className="mt-8">
          <Button asChild>
            <Link to={`/lesson/${lesson.slug}/problem/${nextProblem.id}`}>
              Start practice
            </Link>
          </Button>
        </div>
      </section>
    </div>
  )
}
