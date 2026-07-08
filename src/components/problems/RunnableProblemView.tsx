import { Loader2, Play, RotateCcw } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'

import { CodeEditor } from '@/components/editor/CodeEditor'
import { DiffEditor } from '@/components/editor/DiffEditor'
import { ApproachesPanel } from '@/components/problems/ApproachesPanel'
import { StaticCheckResults } from '@/components/problems/StaticCheckResults'
import { TestResults } from '@/components/problems/TestResults'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import type {
  Approach,
  CodeProblem,
  DebugProblem,
  RefactorProblem,
} from '@/curriculum/types'
import { cn } from '@/lib/cn'
import {
  allStaticChecksPassed,
  getProblemStarterCode,
  runCode,
  runStaticChecks,
  type CodeRunResult,
} from '@/runtime'
import { useProgress } from '@/state/progressContext'

type RunnableProblem = CodeProblem | DebugProblem | RefactorProblem

type RunnableProblemViewProps = {
  lessonSlug: string
  problem: RunnableProblem
  approaches?: Approach[]
}

export function RunnableProblemView({
  approaches,
  lessonSlug,
  problem,
}: RunnableProblemViewProps) {
  const progress = useProgress()
  const starterCode = getProblemStarterCode(problem)
  const savedDraft = progress.getDraft(lessonSlug, problem.id)
  const [code, setCode] = useState(savedDraft ?? starterCode)
  const [runResult, setRunResult] = useState<CodeRunResult>()
  const [isRunning, setIsRunning] = useState(false)
  const staticCheckResults = useMemo(
    () =>
      problem.kind === 'refactor'
        ? runStaticChecks(code, problem.staticChecks)
        : [],
    [code, problem],
  )

  useEffect(() => {
    setCode(savedDraft ?? starterCode)
  }, [savedDraft, starterCode])

  const handleCodeChange = (nextCode: string) => {
    setCode(nextCode)
    progress.saveDraft(lessonSlug, problem.id, nextCode)
  }

  const handleReset = () => {
    setRunResult(undefined)
    setCode(starterCode)
    progress.saveDraft(lessonSlug, problem.id, starterCode)
  }

  const handleRun = async () => {
    const checkResults =
      problem.kind === 'refactor'
        ? runStaticChecks(code, problem.staticChecks)
        : []

    setIsRunning(true)
    setRunResult(undefined)

    try {
      const result = await runCode({
        code,
        functionName: problem.functionName,
        tests: problem.tests,
      })

      setRunResult(result)

      if (
        result.status === 'passed' &&
        (problem.kind !== 'refactor' || allStaticChecksPassed(checkResults))
      ) {
        progress.markComplete(lessonSlug, problem.id)
        toast.success('Problem completed', {
          description: 'All workspace checks passed.',
        })
      } else if (result.status === 'passed') {
        toast.warning('Static checks still need work', {
          description: 'Tests passed, but the refactor checks are not complete.',
        })
      } else {
        toast.error('Tests did not pass', {
          description: getRunFailureDescription(result),
        })
      }
    } catch (error) {
      const message = errorToMessage(error)

      setRunResult({
        status: 'error',
        durationMs: 0,
        tests: [],
        logs: [],
        error: message,
      })
      toast.error('Unable to run tests', {
        description: message,
      })
    } finally {
      setIsRunning(false)
    }
  }

  return (
    <div className="grid gap-4">
      <section className="grid min-w-0 gap-4">
        <Card className="min-w-0">
          <CardHeader className="gap-3">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div className="grid gap-1">
                <CardTitle>Solution</CardTitle>
                <CardDescription className="flex flex-wrap items-center gap-1">
                  <span>Export</span>
                  <code className="rounded bg-muted px-1.5 py-0.5 text-xs text-foreground">
                    {problem.functionName}
                  </code>
                  <span>and run the provided tests.</span>
                </CardDescription>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="muted">TypeScript</Badge>
                <Button onClick={handleReset} type="button" variant="outline">
                  <RotateCcw className="size-4" />
                  Reset
                </Button>
                <Button
                  disabled={isRunning || code.trim().length === 0}
                  onClick={handleRun}
                  type="button"
                >
                  {isRunning ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Play className="size-4" />
                  )}
                  Run tests
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <CodeEditor
              label={`${problem.title} solution editor`}
              onChange={handleCodeChange}
              value={code}
            />
          </CardContent>
        </Card>

        <div
          className={cn(
            'grid min-w-0 gap-4',
            problem.kind === 'refactor' && 'xl:grid-cols-2',
          )}
        >
          {problem.kind === 'refactor' ? (
            <StaticCheckResults results={staticCheckResults} />
          ) : null}
          <TestResults isRunning={isRunning} result={runResult} />
        </div>
      </section>

      {problem.kind === 'debug' && problem.bugHints?.length ? (
        <HintList hints={problem.bugHints} />
      ) : null}

      {problem.kind === 'refactor' ? (
        <RefactorDetails
          code={code}
          problem={problem}
        />
      ) : null}

      <ApproachesPanel approaches={approaches} />
    </div>
  )
}

function errorToMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message
  }

  if (typeof error === 'string') {
    return error
  }

  return 'Unable to run tests.'
}

function getRunFailureDescription(result: CodeRunResult) {
  if (result.error) {
    return result.error
  }

  if (result.status === 'timeout') {
    return 'The run timed out before all tests completed.'
  }

  if (result.status === 'error') {
    return 'The runtime reported an error.'
  }

  const failedCount = result.tests.filter((test) => test.status !== 'passed').length

  if (failedCount === 0) {
    return 'Review the test results for details.'
  }

  return failedCount === 1
    ? '1 test needs attention.'
    : `${failedCount} tests need attention.`
}

function HintList({ hints }: { hints: string[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Hints</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="grid gap-2 text-sm text-muted-foreground">
          {hints.map((hint) => (
            <li className="rounded-md border bg-background p-3" key={hint}>
              {hint}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}

function RefactorDetails({
  code,
  problem,
}: {
  code: string
  problem: RefactorProblem
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Refactor goals</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4">
        <ul className="grid gap-2 text-sm text-muted-foreground">
          {problem.goals.map((goal) => (
            <li className="rounded-md border bg-background p-3" key={goal}>
              {goal}
            </li>
          ))}
        </ul>
        <Separator />
        <DiffEditor
          label={`${problem.title} refactor diff`}
          modified={code}
          original={problem.originalCode}
        />
      </CardContent>
    </Card>
  )
}
