import { BookOpen, CheckCircle2, Code, Play } from 'lucide-react'
import { useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'

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
import { getLesson, getProblem } from '@/curriculum'
import { formatSlug } from '@/lib/format'
import { useProgress } from '@/state/progressContext'

export function ProblemPage() {
  const { problemId, slug } = useParams()
  const lesson = getLesson(slug)
  const problem = getProblem(lesson, problemId)
  const progress = useProgress()
  const { saveLastVisited } = progress

  useEffect(() => {
    if (lesson && problem) {
      saveLastVisited(lesson.slug, problem.id)
    }
  }, [lesson, problem, saveLastVisited])

  if (!lesson || !problem) {
    return (
      <div className="mx-auto max-w-3xl">
        <Card>
          <CardHeader>
            <CardTitle>Problem not found</CardTitle>
            <CardDescription>
              No registered problem matches{' '}
              {problemId ? formatSlug(problemId) : 'this route'}.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link to={lesson ? `/lesson/${lesson.slug}` : '/progress'}>
                Back to {lesson ? 'lesson' : 'curriculum map'}
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const isCompleted = progress.isProblemCompleted(lesson.slug, problem.id)

  return (
    <div className="mx-auto grid max-w-7xl gap-4">
      <section className="flex flex-col gap-3 rounded-lg border bg-card p-4 shadow-sm lg:flex-row lg:items-center lg:justify-between">
        <div className="grid gap-1">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">Problem workspace</Badge>
            <Badge variant="muted">{problem.kind}</Badge>
            <Badge variant="muted">{problem.completionMode}</Badge>
            {isCompleted ? <Badge>Completed</Badge> : null}
          </div>
          <h1 className="text-2xl font-semibold tracking-normal">
            {problem.title}
          </h1>
          <p className="text-sm text-muted-foreground">
            {lesson.title} · {problem.estimatedMinutes ?? 10} min
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <Link to={`/lesson/${lesson.slug}`}>
              <BookOpen className="size-4" />
              Concept
            </Link>
          </Button>
          <Button
            disabled={isCompleted}
            onClick={() => progress.markComplete(lesson.slug, problem.id)}
            type="button"
          >
            {isCompleted ? (
              <CheckCircle2 className="size-4" />
            ) : (
              <Play className="size-4" />
            )}
            {isCompleted ? 'Completed' : 'Mark complete'}
          </Button>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <Card>
          <CardHeader>
            <CardTitle>Prompt</CardTitle>
            <CardDescription>
              Problem-specific instructions and constraints.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 text-sm text-muted-foreground">
            <p>{problem.prompt}</p>
            <Separator />
            <div className="grid gap-2">
              <div className="flex items-center gap-2 text-foreground">
                <CheckCircle2 className="size-4 text-primary" />
                Completion mode
              </div>
              <p>
                Completion criteria are tracked locally now. Problem-specific
                grading and self-review controls are added in later checkpoints.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Code className="size-5 text-primary" />
              Workspace
            </CardTitle>
            <CardDescription>
              Monaco/editor, answers, test results, and static checks.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid min-h-[22rem] place-items-center rounded-md border border-dashed bg-muted/30 p-6 text-center text-sm text-muted-foreground">
              Interactive {problem.kind} problem rendering is added after the
              runtime and progress contracts are in place.
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
