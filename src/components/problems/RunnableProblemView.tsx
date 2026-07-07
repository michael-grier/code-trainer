import { Loader2, Play, RotateCcw } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

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
  Language,
  RefactorProblem,
} from '@/curriculum/types'
import { cn } from '@/lib/cn'
import {
  allStaticChecksPassed,
  getProblemDefaultLanguage,
  getProblemStarterCode,
  getSupportedLanguages,
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
  const supportedLanguages = useMemo(
    () => getSupportedLanguages(problem),
    [problem],
  )
  const selectedLanguage = getSelectedLanguage(
    progress.getLanguage(lessonSlug, problem.id),
    supportedLanguages,
    getProblemDefaultLanguage(problem),
  )
  const starterCode = getProblemStarterCode(problem, selectedLanguage)
  const savedDraft = progress.getDraft(lessonSlug, problem.id, selectedLanguage)
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
    progress.saveDraft(lessonSlug, problem.id, selectedLanguage, nextCode)
  }

  const handleLanguageChange = (language: Language) => {
    progress.setLanguage(lessonSlug, problem.id, language)
    setRunResult(undefined)
  }

  const handleReset = () => {
    setRunResult(undefined)
    setCode(starterCode)
    progress.saveDraft(lessonSlug, problem.id, selectedLanguage, starterCode)
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
        language: selectedLanguage,
        tests: problem.tests,
      })

      setRunResult(result)

      if (
        result.status === 'passed' &&
        (problem.kind !== 'refactor' || allStaticChecksPassed(checkResults))
      ) {
        progress.markComplete(lessonSlug, problem.id)
      }
    } catch (error) {
      setRunResult({
        language: selectedLanguage,
        status: 'error',
        durationMs: 0,
        tests: [],
        logs: [],
        error: errorToMessage(error),
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
                <LanguageSelector
                  onChange={handleLanguageChange}
                  selected={selectedLanguage}
                  supported={supportedLanguages}
                />
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
              language={selectedLanguage}
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
          language={selectedLanguage}
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

function LanguageSelector({
  onChange,
  selected,
  supported,
}: {
  selected: Language
  supported: Language[]
  onChange: (language: Language) => void
}) {
  if (supported.length <= 1) {
    return <Badge variant="muted">{getLanguageLabel(selected)}</Badge>
  }

  return (
    <div
      aria-label="Language"
      className="inline-flex rounded-md border bg-background p-1"
      role="group"
    >
      {supported.map((language) => (
        <Button
          aria-pressed={selected === language}
          className={cn(
            'h-8 px-3',
            selected !== language && 'text-muted-foreground',
          )}
          key={language}
          onClick={() => onChange(language)}
          size="sm"
          type="button"
          variant={selected === language ? 'secondary' : 'ghost'}
        >
          {getLanguageLabel(language)}
        </Button>
      ))}
    </div>
  )
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
  language,
  problem,
}: {
  code: string
  language: Language
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
          language={language}
          modified={code}
          original={problem.originalCode}
        />
      </CardContent>
    </Card>
  )
}

function getSelectedLanguage(
  savedLanguage: Language | undefined,
  supportedLanguages: Language[],
  defaultLanguage: Language,
) {
  if (savedLanguage && supportedLanguages.includes(savedLanguage)) {
    return savedLanguage
  }

  if (supportedLanguages.includes(defaultLanguage)) {
    return defaultLanguage
  }

  return supportedLanguages[0] ?? 'ts'
}

function getLanguageLabel(language: Language) {
  return language === 'py' ? 'Python' : 'TypeScript'
}
