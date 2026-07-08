import { BookOpen, CheckCircle2 } from 'lucide-react'
import { useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'

import { ConceptReferenceSheet } from '@/components/learning/ConceptReferenceSheet'
import { PrerequisiteNotice } from '@/components/learning/PrerequisiteNotice'
import { ProblemNavigation } from '@/components/learning/ProblemNavigation'
import { ProblemRenderer } from '@/components/problems/ProblemRenderer'
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
import { getLesson, getProblem, lessons } from '@/curriculum'
import { formatSlug } from '@/lib/format'
import { getProblemNavigation } from '@/state/learningFlow'
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
  const completionDescription = getCompletionDescription(problem.kind)
  const navigation = getProblemNavigation(lessons, lesson.slug, problem.id)
  const lessonStatus = progress.getLessonStatus(lesson, lessons, progress.state)

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
          <ConceptReferenceSheet lesson={lesson} />
        </div>
      </section>

      {lessonStatus === 'ahead-of-path' ? (
        <PrerequisiteNotice
          lesson={lesson}
          recommendedLesson={progress.recommendedLesson}
        />
      ) : null}

      <section className="grid gap-4">
        <Card className="min-w-0">
          <CardHeader>
            <CardTitle>Prompt</CardTitle>
            <CardDescription>
              {problem.estimatedMinutes ?? 10} minute target
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 text-sm text-muted-foreground lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-start">
            <p className="max-w-4xl">{problem.prompt}</p>
            <Separator className="lg:hidden" />
            <div className="grid gap-2">
              <div className="flex items-center gap-2 text-foreground">
                <CheckCircle2 className="size-4 text-primary" />
                Completion mode
              </div>
              <p>{completionDescription}</p>
            </div>
          </CardContent>
        </Card>

        <ProblemRenderer lesson={lesson} problem={problem} />
        <ProblemNavigation
          next={navigation.next}
          previous={navigation.previous}
        />
      </section>
    </div>
  )
}

function getCompletionDescription(problemKind: string) {
  if (problemKind === 'trace') {
    return 'Grade every trace question correctly to complete this problem.'
  }

  if (problemKind === 'written') {
    return 'Write an answer, reveal the reference, then mark the review complete.'
  }

  if (problemKind === 'design') {
    return 'Complete the structured response and rubric review to finish.'
  }

  return 'Passing workspace checks marks this problem complete.'
}
