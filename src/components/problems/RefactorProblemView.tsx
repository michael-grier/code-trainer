import { RunnableProblemView } from '@/components/problems/RunnableProblemView'
import type { Approach, RefactorProblem } from '@/curriculum/types'

type RefactorProblemViewProps = {
  lessonSlug: string
  problem: RefactorProblem
  approaches?: Approach[]
}

export function RefactorProblemView({
  approaches,
  lessonSlug,
  problem,
}: RefactorProblemViewProps) {
  return (
    <RunnableProblemView
      approaches={approaches}
      lessonSlug={lessonSlug}
      problem={problem}
    />
  )
}

