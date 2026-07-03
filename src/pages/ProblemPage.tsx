import { BookOpen, CheckCircle2, Code, Play } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useParams } from 'react-router-dom'

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

export function ProblemPage() {
  const { problemId, slug } = useParams()
  const lessonSlug = slug ?? 'unknown'
  const currentProblemId = problemId ?? 'unknown'

  return (
    <div className="mx-auto grid max-w-7xl gap-4">
      <section className="flex flex-col gap-3 rounded-lg border bg-card p-4 shadow-sm lg:flex-row lg:items-center lg:justify-between">
        <div className="grid gap-1">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">Problem workspace</Badge>
            <Badge variant="muted">{currentProblemId}</Badge>
          </div>
          <h1 className="text-2xl font-semibold tracking-normal">
            {formatSlug(lessonSlug)}
          </h1>
          <p className="text-sm text-muted-foreground">
            The renderer registry will dispatch code, debug, refactor, trace,
            written, and design problems from this shared shell.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <Link to={`/lesson/${lessonSlug}`}>
              <BookOpen className="size-4" />
              Concept
            </Link>
          </Button>
          <Button type="button">
            <Play className="size-4" />
            Run
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
            <p>
              This left pane will hold the prompt, hints, goals, reference
              controls, or rubric depending on problem kind.
            </p>
            <Separator />
            <div className="grid gap-2">
              <div className="flex items-center gap-2 text-foreground">
                <CheckCircle2 className="size-4 text-primary" />
                Completion mode
              </div>
              <p>
                Completion criteria remain problem-kind specific and will be
                wired after the problem model exists.
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
              Interactive problem views are added after the runtime and progress
              contracts are in place.
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  )
}

function formatSlug(slug: string) {
  return slug
    .split('-')
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase() + part.slice(1))
    .join(' ')
}
