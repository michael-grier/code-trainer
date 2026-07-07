import { CircleDashed } from 'lucide-react'

import { CodeProblemView } from '@/components/problems/CodeProblemView'
import { DebugProblemView } from '@/components/problems/DebugProblemView'
import { RefactorProblemView } from '@/components/problems/RefactorProblemView'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import type { Lesson, Problem } from '@/curriculum/types'

type ProblemRendererProps = {
  lesson: Lesson
  problem: Problem
}

export function ProblemRenderer({ lesson, problem }: ProblemRendererProps) {
  const approaches = lesson.approaches[problem.id]

  if (problem.kind === 'code') {
    return (
      <CodeProblemView
        approaches={approaches}
        lessonSlug={lesson.slug}
        problem={problem}
      />
    )
  }

  if (problem.kind === 'debug') {
    return (
      <DebugProblemView
        approaches={approaches}
        lessonSlug={lesson.slug}
        problem={problem}
      />
    )
  }

  if (problem.kind === 'refactor') {
    return (
      <RefactorProblemView
        approaches={approaches}
        lessonSlug={lesson.slug}
        problem={problem}
      />
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Workspace</CardTitle>
        <CardDescription>
          This problem type is implemented in the next checkpoint.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid min-h-[22rem] place-items-center rounded-md border border-dashed bg-muted/30 p-6 text-center text-sm text-muted-foreground">
          <div className="grid gap-2 justify-items-center">
            <CircleDashed className="size-5" />
            Interactive {problem.kind} controls are not available yet.
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

