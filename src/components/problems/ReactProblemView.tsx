import { Loader2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

import { CodeEditor } from '@/components/editor/CodeEditor'
import { ApproachesPanel } from '@/components/problems/ApproachesPanel'
import { ProblemResults } from '@/components/problems/TestResults'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import type { Approach, ReactCodeProblem } from '@/curriculum/types'
import { runReactTests, type CodeRunResult } from '@/runtime'
import { useProgress } from '@/state/progressContext'

type ReactProblemViewProps = {
  lessonSlug: string
  problem: ReactCodeProblem
  approaches?: Approach[]
}

export function ReactProblemView({
  approaches,
  lessonSlug,
  problem,
}: ReactProblemViewProps) {
  const progress = useProgress()
  const savedDraft = progress.getDraft(lessonSlug, problem.id)
  const [code, setCode] = useState(savedDraft ?? problem.starter)
  const [testResult, setTestResult] = useState<CodeRunResult>()
  const [isEvaluating, setIsEvaluating] = useState(false)

  useEffect(() => {
    setCode(savedDraft ?? problem.starter)
  }, [savedDraft, problem.starter])

  const handleCodeChange = (nextCode: string) => {
    setCode(nextCode)
    progress.saveDraft(lessonSlug, problem.id, nextCode)
  }

  const handleReset = () => {
    setTestResult(undefined)
    setCode(problem.starter)
    progress.saveDraft(lessonSlug, problem.id, problem.starter)
  }

  const handleEvaluate = async () => {
    setIsEvaluating(true)
    setTestResult(undefined)

    try {
      const result = await runReactTests({
        code,
        componentName: problem.componentName,
        tests: problem.tests,
      })

      setTestResult(result)

      if (result.status === 'passed') {
        progress.markComplete(lessonSlug, problem.id)
        toast.success('Problem completed', {
          description: 'Every interaction test passed.',
        })
      } else {
        toast.error('Evaluation did not pass', {
          description:
            result.error ?? 'Review the interaction test results for details.',
        })
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unable to run the component.'

      setTestResult({
        status: 'error',
        durationMs: 0,
        tests: [],
        logs: [],
        error: message,
      })
      toast.error('Unable to evaluate tests', { description: message })
    } finally {
      setIsEvaluating(false)
    }
  }

  return (
    <div className="grid gap-4">
      <section className="grid min-w-0 gap-4">
        <Card className="min-w-0">
          <CardHeader className="gap-3">
            <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start">
              <div className="grid min-w-0 gap-1">
                <CardTitle>Component</CardTitle>
                <CardDescription className="flex flex-wrap items-center gap-1">
                  <span>Export</span>
                  <code className="rounded bg-muted px-1.5 py-0.5 text-xs text-foreground">
                    {problem.componentName}
                  </code>
                  <span>
                    from this file. Tests render it, interact with it, and check
                    what appears on screen.
                  </span>
                </CardDescription>
              </div>
              <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                <span className="text-xs text-muted-foreground">
                  TypeScript + JSX
                </span>
                <Button
                  onClick={handleReset}
                  size="sm"
                  type="button"
                  variant="outline"
                >
                  Reset
                </Button>
                <Button
                  disabled={isEvaluating || code.trim().length === 0}
                  onClick={handleEvaluate}
                  size="sm"
                  type="button"
                >
                  {isEvaluating ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : null}
                  Evaluate
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <CodeEditor
              label={`${problem.title} component editor`}
              onChange={handleCodeChange}
              value={code}
            />
          </CardContent>
        </Card>

        <ProblemResults
          isEvaluating={isEvaluating}
          isLogging={false}
          testResult={testResult}
        />
      </section>

      {problem.bugHints?.length ? (
        <Card>
          <CardHeader>
            <CardTitle>Hints</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="grid gap-2 text-sm text-muted-foreground">
              {problem.bugHints.map((hint) => (
                <li className="rounded-md border bg-background p-3" key={hint}>
                  {hint}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : null}

      <ApproachesPanel approaches={approaches} />
    </div>
  )
}
