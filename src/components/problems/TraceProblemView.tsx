import { CheckCircle2, ListChecks, XCircle } from 'lucide-react'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'

import { ReadOnlyCode } from '@/components/editor/ReadOnlyCode'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import type { TraceGradeResult, TraceGradeSummary } from '@/runtime'
import { gradeTraceProblem } from '@/runtime'
import type { TraceProblem, TraceQuestion } from '@/curriculum/types'
import { cn } from '@/lib/cn'
import { getTraceAnswerKey } from '@/state/progress'
import { useProgress } from '@/state/progressContext'

type TraceProblemViewProps = {
  lessonSlug: string
  problem: TraceProblem
}

export function TraceProblemView({ lessonSlug, problem }: TraceProblemViewProps) {
  const progress = useProgress()
  const [summary, setSummary] = useState<TraceGradeSummary>()
  const answers = useMemo(
    () =>
      Object.fromEntries(
        problem.questions.map((question) => [
          question.id,
          progress.state.traceAnswers[
            getTraceAnswerKey(lessonSlug, problem.id, question.id)
          ],
        ]),
      ),
    [lessonSlug, problem.id, problem.questions, progress.state.traceAnswers],
  )
  const answeredCount = problem.questions.filter((question) =>
    hasTraceAnswer(question, answers[question.id]),
  ).length
  const resultsByQuestion = new Map(
    summary?.results.map((result) => [result.questionId, result]),
  )

  const saveAnswer = (questionId: string, value: unknown) => {
    setSummary(undefined)
    progress.saveTraceAnswer(lessonSlug, problem.id, questionId, value)
  }

  const handleGrade = () => {
    const nextSummary = gradeTraceProblem(problem, answers)

    setSummary(nextSummary)

    if (nextSummary.passed) {
      progress.markComplete(lessonSlug, problem.id)
      toast.success('Trace completed', {
        description: 'Every trace question is correct.',
      })
    } else {
      const missedCount = nextSummary.results.filter(
        (result) => !result.passed,
      ).length

      toast.error('Trace needs review', {
        description:
          missedCount === 1
            ? '1 answer needs attention.'
            : `${missedCount} answers need attention.`,
      })
    }
  }

  return (
    <div className="grid gap-4">
      <section className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <Card className="min-w-0">
          <CardHeader>
            <CardTitle>Trace the code</CardTitle>
            <CardDescription>
              Read the snippet carefully before answering.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ReadOnlyCode className="max-h-none" code={problem.code} />
          </CardContent>
        </Card>

        <Card className="min-w-0">
          <CardHeader className="gap-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="grid gap-1">
                <CardTitle>Answers</CardTitle>
                <CardDescription>
                  {answeredCount}/{problem.questions.length} answered
                </CardDescription>
              </div>
              <Button
                disabled={answeredCount < problem.questions.length}
                onClick={handleGrade}
                type="button"
              >
                <ListChecks className="size-4" />
                Grade trace
              </Button>
            </div>
          </CardHeader>
          <CardContent className="grid gap-3">
            {problem.questions.map((question) => (
              <TraceQuestionControl
                answer={answers[question.id]}
                key={question.id}
                onChange={(value) => saveAnswer(question.id, value)}
                question={question}
                result={resultsByQuestion.get(question.id)}
              />
            ))}
          </CardContent>
        </Card>
      </section>

      {summary ? (
        <Card className="min-w-0">
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <CardTitle>Trace explanation</CardTitle>
              <Badge variant={summary.passed ? 'default' : 'outline'}>
                {summary.passed ? 'Correct' : 'Review'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            {problem.explanation}
          </CardContent>
        </Card>
      ) : null}
    </div>
  )
}

function TraceQuestionControl({
  answer,
  onChange,
  question,
  result,
}: {
  answer: unknown
  question: TraceQuestion
  result?: TraceGradeResult
  onChange: (value: unknown) => void
}) {
  return (
    <article className="grid gap-3 rounded-md border bg-background p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="grid gap-1">
          <h3 className="text-sm font-medium">{question.label}</h3>
          {question.type === 'final-value' ? (
            <p className="text-xs text-muted-foreground">
              Final value of <code>{question.variable}</code>
            </p>
          ) : null}
        </div>
        {result ? <TraceResultBadge result={result} /> : null}
      </div>
      <TraceAnswerInput answer={answer} onChange={onChange} question={question} />
      {result && !result.passed ? (
        <div className="grid gap-1 rounded-md border border-destructive/30 bg-destructive/10 p-2 text-xs text-destructive">
          <span>{result.message}</span>
          <span>Expected: {result.expected}</span>
          {result.actual ? <span>Actual: {result.actual}</span> : null}
        </div>
      ) : null}
    </article>
  )
}

function TraceAnswerInput({
  answer,
  onChange,
  question,
}: {
  answer: unknown
  question: TraceQuestion
  onChange: (value: unknown) => void
}) {
  if (question.type === 'output-order') {
    const values = Array.isArray(answer)
      ? answer.filter((value): value is string => typeof value === 'string')
      : []

    return (
      <div className="grid gap-2">
        {question.expected.map((_expected, index) => (
          <label className="grid gap-1 text-sm" key={`${question.id}-${index}`}>
            <span className="text-muted-foreground">Position {index + 1}</span>
            <select
              className="h-10 rounded-md border border-input bg-background px-3 text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
              onChange={(event) => {
                const nextValues = [...values]
                nextValues[index] = event.target.value
                onChange(nextValues)
              }}
              value={values[index] ?? ''}
            >
              <option value="">Select output</option>
              {question.options.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
        ))}
      </div>
    )
  }

  if (question.type === 'multiple-choice') {
    const value = typeof answer === 'string' ? answer : ''

    return (
      <div className="flex flex-wrap gap-2">
        {question.options.map((option) => (
          <Button
            aria-pressed={value === option}
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

  return (
    <input
      className="h-10 rounded-md border border-input bg-background px-3 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
      onChange={(event) => onChange(event.target.value)}
      placeholder="Enter final value"
      value={typeof answer === 'string' ? answer : ''}
    />
  )
}

function TraceResultBadge({ result }: { result: TraceGradeResult }) {
  const Icon = result.passed ? CheckCircle2 : XCircle

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium',
        result.passed
          ? 'bg-primary text-primary-foreground'
          : 'bg-destructive text-destructive-foreground',
      )}
    >
      <Icon className="size-3.5" />
      {result.passed ? 'Correct' : 'Review'}
    </span>
  )
}

function hasTraceAnswer(question: TraceQuestion, answer: unknown) {
  if (question.type === 'output-order') {
    return (
      Array.isArray(answer) &&
      answer.filter((value) => typeof value === 'string' && value.length > 0)
        .length === question.expected.length
    )
  }

  return typeof answer === 'string' && answer.trim().length > 0
}
