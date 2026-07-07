import { RunnableProblemView } from '@/components/problems/RunnableProblemView'
import type { Approach, CodeProblem } from '@/curriculum/types'

type CodeProblemViewProps = {
  lessonSlug: string
  problem: CodeProblem
  approaches?: Approach[]
}

export function CodeProblemView({
  approaches,
  lessonSlug,
  problem,
}: CodeProblemViewProps) {
  return (
    <RunnableProblemView
      approaches={approaches}
      lessonSlug={lessonSlug}
      problem={problem}
    />
  )
}

