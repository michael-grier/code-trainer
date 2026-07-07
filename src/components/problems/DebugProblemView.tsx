import { RunnableProblemView } from '@/components/problems/RunnableProblemView'
import type { Approach, DebugProblem } from '@/curriculum/types'

type DebugProblemViewProps = {
  lessonSlug: string
  problem: DebugProblem
  approaches?: Approach[]
}

export function DebugProblemView({
  approaches,
  lessonSlug,
  problem,
}: DebugProblemViewProps) {
  return (
    <RunnableProblemView
      approaches={approaches}
      lessonSlug={lessonSlug}
      problem={problem}
    />
  )
}

