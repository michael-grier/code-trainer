import { CodeProblemView } from '@/components/problems/CodeProblemView'
import { DebugProblemView } from '@/components/problems/DebugProblemView'
import { DesignProblemView } from '@/components/problems/DesignProblemView'
import { RefactorProblemView } from '@/components/problems/RefactorProblemView'
import { TraceProblemView } from '@/components/problems/TraceProblemView'
import { WrittenProblemView } from '@/components/problems/WrittenProblemView'
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

  if (problem.kind === 'trace') {
    return <TraceProblemView lessonSlug={lesson.slug} problem={problem} />
  }

  if (problem.kind === 'written') {
    return <WrittenProblemView lessonSlug={lesson.slug} problem={problem} />
  }

  return <DesignProblemView lessonSlug={lesson.slug} problem={problem} />
}
