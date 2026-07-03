import { ArrowRight, BookOpen, Circle, Play } from 'lucide-react'
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

export function ConceptPage() {
  const { slug } = useParams()
  const lessonSlug = slug ?? 'unknown'

  return (
    <div className="mx-auto grid max-w-5xl gap-6">
      <section className="grid gap-4 rounded-lg border bg-card p-5 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="grid gap-2">
            <Badge variant="outline">Concept lesson</Badge>
            <h1 className="text-3xl font-semibold tracking-normal">
              {formatSlug(lessonSlug)}
            </h1>
            <p className="max-w-2xl text-muted-foreground">
              MDX lesson content will render here once the curriculum registry
              is added. This route already carries the final layout contract.
            </p>
          </div>
          <Button asChild>
            <Link to={`/lesson/${lessonSlug}/problem/foundation`}>
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
              Dense, technical MDX content replaces this placeholder in
              checkpoint 3.
            </CardDescription>
          </CardHeader>
          <CardContent className="prose prose-neutral max-w-none text-sm text-muted-foreground dark:prose-invert">
            <p>
              Each lesson will explain the pattern, interview signals, common
              mistakes, TypeScript notes, and a short worked example before
              transitioning into practice.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Practice</CardTitle>
            <CardDescription>Sequential by default</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            {['Foundation', 'Applied', 'Interview-depth'].map((label, index) => (
              <Link
                className="group rounded-md border p-3 outline-none transition hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring"
                key={label}
                to={`/lesson/${lessonSlug}/problem/${index === 0 ? 'foundation' : label.toLowerCase()}`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-2 text-sm font-medium">
                    <Circle className="size-3 text-muted-foreground" />
                    {label}
                  </span>
                  <ArrowRight className="size-4 text-muted-foreground transition group-hover:text-foreground" />
                </div>
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

function formatSlug(slug: string) {
  return slug
    .split('-')
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase() + part.slice(1))
    .join(' ')
}
