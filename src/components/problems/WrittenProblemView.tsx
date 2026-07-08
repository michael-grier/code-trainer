import { CheckCircle2, PencilLine } from 'lucide-react'

import { ReferenceAnswer } from '@/components/problems/ReferenceAnswer'
import { RubricReview } from '@/components/problems/RubricReview'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import type { WrittenProblem } from '@/curriculum/types'
import { getProblemKey } from '@/state/progress'
import { useProgress } from '@/state/progressContext'

type WrittenProblemViewProps = {
  lessonSlug: string
  problem: WrittenProblem
}

export function WrittenProblemView({
  lessonSlug,
  problem,
}: WrittenProblemViewProps) {
  const progress = useProgress()
  const problemKey = getProblemKey(lessonSlug, problem.id)
  const answer = progress.state.writtenAnswers[problemKey] ?? problem.starter ?? ''
  const isRevealed = Boolean(progress.state.revealedReferences[problemKey])
  const isCompleted = progress.isProblemCompleted(lessonSlug, problem.id)
  const hasAnswer = answer.trim().length > 0
  const rubricReview = progress.state.rubricReviews[problemKey] ?? {}

  const handleReveal = () => {
    progress.revealReference(lessonSlug, problem.id)
  }

  const handleComplete = () => {
    progress.markComplete(lessonSlug, problem.id)
  }

  return (
    <div className="grid gap-4">
      <Card className="min-w-0">
        <CardHeader>
          <CardTitle>Your answer</CardTitle>
          <CardDescription>
            Write the tradeoffs, assumptions, and edge cases you would say out loud.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <Textarea
            aria-label={`${problem.title} answer`}
            className="min-h-56"
            onChange={(event) =>
              progress.saveWrittenAnswer(lessonSlug, problem.id, event.target.value)
            }
            placeholder="Type your answer before revealing the reference..."
            value={answer}
          />
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <PencilLine className="size-4" />
              {answer.trim().length} characters
            </div>
            <Button
              disabled={!isRevealed || isCompleted}
              onClick={handleComplete}
              type="button"
            >
              <CheckCircle2 className="size-4" />
              {isCompleted ? 'Reviewed' : 'Mark reviewed'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <ReferenceAnswer
        answer={problem.referenceAnswer}
        canReveal={hasAnswer}
        isRevealed={isRevealed}
        onReveal={handleReveal}
      />

      {problem.rubric?.length ? (
        <RubricReview
          checked={rubricReview}
          items={problem.rubric}
          onToggle={(itemId) =>
            progress.toggleRubricItem(lessonSlug, problem.id, itemId)
          }
        />
      ) : null}
    </div>
  )
}

