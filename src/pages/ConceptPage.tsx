import { ArrowRight, BookOpen, Circle, Play } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'

import { Mdx } from '@/components/mdx/Mdx'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { getLesson, getTrack } from '@/curriculum'
import { formatSlug } from '@/lib/format'

export function ConceptPage() {
  const { slug } = useParams()
  const lesson = getLesson(slug)

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
  const nextProblem = lesson.problems[0]

  return (
    <div className="mx-auto grid max-w-5xl gap-6">
      <section className="grid gap-4 rounded-lg border bg-card p-5 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="grid gap-2">
            <Badge variant="outline">Concept lesson</Badge>
            <h1 className="text-3xl font-semibold tracking-normal">
              {lesson.title}
            </h1>
            <p className="max-w-2xl text-muted-foreground">
              {lesson.summary}
            </p>
            {track ? <Badge variant="muted">{track.title}</Badge> : null}
          </div>
          <Button asChild>
            <Link to={`/lesson/${lesson.slug}/problem/${nextProblem.id}`}>
              <Play className="size-4" />
              Start practice
            </Link>
          </Button>
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-[1fr_18rem]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="size-5 text-primary" />
              Lesson content
            </CardTitle>
            <CardDescription>
              Placeholder MDX content is registered for this lesson.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Mdx component={lesson.concept} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Practice</CardTitle>
            <CardDescription>Sequential by default</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            {lesson.problems.map((problem) => (
              <Link
                className="group rounded-md border p-3 outline-none transition hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring"
                key={problem.id}
                to={`/lesson/${lesson.slug}/problem/${problem.id}`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-2 text-sm font-medium">
                    <Circle className="size-3 text-muted-foreground" />
                    {problem.title}
                  </span>
                  <ArrowRight className="size-4 text-muted-foreground transition group-hover:text-foreground" />
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {problem.kind} · {problem.estimatedMinutes ?? 10} min
                </p>
              </Link>
            ))}
            <Separator />
            <p className="text-sm text-muted-foreground">
              Completion state and prerequisite notices are wired in later
              checkpoints.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
