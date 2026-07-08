import { CheckCircle2, Layers3 } from 'lucide-react'
import { toast } from 'sonner'

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
import type { DesignProblem, DesignSection } from '@/curriculum/types'
import { cn } from '@/lib/cn'
import { getDesignAnswerKey, getProblemKey } from '@/state/progress'
import { useProgress } from '@/state/progressContext'

type DesignProblemViewProps = {
  lessonSlug: string
  problem: DesignProblem
}

export function DesignProblemView({ lessonSlug, problem }: DesignProblemViewProps) {
  const progress = useProgress()
  const problemKey = getProblemKey(lessonSlug, problem.id)
  const isRevealed = Boolean(progress.state.revealedReferences[problemKey])
  const isCompleted = progress.isProblemCompleted(lessonSlug, problem.id)
  const rubricReview = progress.state.rubricReviews[problemKey] ?? {}
  const completedRubricItems = problem.rubric.filter(
    (item) => rubricReview[item.id],
  ).length
  const allRubricItemsChecked = completedRubricItems === problem.rubric.length
  const allSectionsAnswered = problem.sections.every((section) =>
    hasDesignAnswer(getDesignAnswer(progress.state.designAnswers, lessonSlug, problem.id, section)),
  )

  const handleReveal = () => {
    progress.revealReference(lessonSlug, problem.id)
  }

  const handleComplete = () => {
    progress.markComplete(lessonSlug, problem.id)
    toast.success('Design review completed')
  }

  return (
    <div className="grid gap-4">
      <Card className="min-w-0">
        <CardHeader>
          <CardTitle>Scenario</CardTitle>
          <CardDescription>
            Capture enough structure to support an interview discussion.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          {problem.scenario}
        </CardContent>
      </Card>

      <section className="grid gap-4">
        {problem.sections.map((section) => (
          <DesignSectionInput
            answer={getDesignAnswer(
              progress.state.designAnswers,
              lessonSlug,
              problem.id,
              section,
            )}
            key={section.id}
            onChange={(value) =>
              progress.saveDesignAnswer(lessonSlug, problem.id, section.id, value)
            }
            section={section}
          />
        ))}
      </section>

      <ReferenceAnswer
        answer={problem.referenceAnswer}
        canReveal={allSectionsAnswered}
        isRevealed={isRevealed}
        onReveal={handleReveal}
      />

      <RubricReview
        checked={rubricReview}
        disabled={!isRevealed}
        items={problem.rubric}
        onToggle={(itemId) =>
          progress.toggleRubricItem(lessonSlug, problem.id, itemId)
        }
      />

      <Card className="min-w-0">
        <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Layers3 className="size-4" />
            {completedRubricItems}/{problem.rubric.length} rubric checks complete
          </div>
          <Button
            disabled={
              !allSectionsAnswered ||
              !isRevealed ||
              !allRubricItemsChecked ||
              isCompleted
            }
            onClick={handleComplete}
            type="button"
          >
            <CheckCircle2 className="size-4" />
            {isCompleted ? 'Completed' : 'Complete review'}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

function DesignSectionInput({
  answer,
  onChange,
  section,
}: {
  section: DesignSection
  answer: unknown
  onChange: (value: unknown) => void
}) {
  return (
    <Card className="min-w-0">
      <CardHeader>
        <CardTitle>{section.label}</CardTitle>
        <CardDescription>{section.prompt}</CardDescription>
      </CardHeader>
      <CardContent>
        {section.type === 'tradeoff' ? (
          <TradeoffInput
            onChange={onChange}
            options={section.options}
            value={typeof answer === 'string' ? answer : ''}
          />
        ) : section.type === 'endpoint-list' || section.type === 'entity-list' ? (
          <ListInput answer={answer} onChange={onChange} section={section} />
        ) : (
          <Textarea
            aria-label={section.label}
            className="min-h-40"
            onChange={(event) => onChange(event.target.value)}
            value={typeof answer === 'string' ? answer : ''}
          />
        )}
      </CardContent>
    </Card>
  )
}

function TradeoffInput({
  onChange,
  options,
  value,
}: {
  options: string[]
  value: string
  onChange: (value: string) => void
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => (
        <Button
          aria-pressed={value === option}
          className={cn(value !== option && 'text-muted-foreground')}
          key={option}
          onClick={() => onChange(option)}
          type="button"
          variant={value === option ? 'secondary' : 'outline'}
        >
          {option}
        </Button>
      ))}
    </div>
  )
}

function ListInput({
  answer,
  onChange,
  section,
}: {
  section: DesignSection
  answer: unknown
  onChange: (value: string[]) => void
}) {
  const value = answerToList(answer).join('\n')

  return (
    <Textarea
      aria-label={section.label}
      className="min-h-40"
      onChange={(event) => onChange(textToList(event.target.value))}
      placeholder="One item per line"
      value={value}
    />
  )
}

function getDesignAnswer(
  answers: Record<string, unknown>,
  lessonSlug: string,
  problemId: string,
  section: DesignSection,
) {
  return answers[getDesignAnswerKey(lessonSlug, problemId, section.id)]
}

function hasDesignAnswer(answer: unknown) {
  if (Array.isArray(answer)) {
    return answer.some((value) => typeof value === 'string' && value.trim().length > 0)
  }

  return typeof answer === 'string' && answer.trim().length > 0
}

function answerToList(answer: unknown) {
  if (Array.isArray(answer)) {
    return answer.filter((value): value is string => typeof value === 'string')
  }

  return typeof answer === 'string' ? textToList(answer) : []
}

function textToList(value: string) {
  return value
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean)
}
