import { useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'

import { ConceptReferenceSheet } from '@/components/learning/ConceptReferenceSheet'
import { PrerequisiteNotice } from '@/components/learning/PrerequisiteNotice'
import { ProblemNavigation } from '@/components/learning/ProblemNavigation'
import { ProblemPrompt } from '@/components/problems/ProblemPromptContent'
import { ProblemRenderer } from '@/components/problems/ProblemRenderer'
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
      <section className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">
            {lesson.title} · {problem.kind} · {problem.estimatedMinutes ?? 10}{' '}
            min
            {isCompleted ? (
              <span className="text-primary"> · completed</span>
            ) : null}
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">
            {problem.title}
          </h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <Link to={`/lesson/${lesson.slug}`}>Concept</Link>
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
          </CardHeader>
          <CardContent className="grid gap-4 text-sm text-muted-foreground lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-start">
            <ProblemPrompt prompt={problem.prompt} />
            <Separator className="lg:hidden" />
            <div className="grid gap-2">
              <div className="text-foreground">Completion</div>
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
