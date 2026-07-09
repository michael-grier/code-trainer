import {
  AlertTriangle,
  CheckCircle2,
  CircleDashed,
  Clock,
  XCircle,
} from 'lucide-react'
import { useEffect, useState } from 'react'

import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import { cn } from '@/lib/cn'
import type { CodeRunResult, ConsoleMessage, TestRunResult } from '@/runtime'

type TestResultsProps = {
  result?: CodeRunResult
  isRunning?: boolean
}

type ProblemResultsProps = {
  consoleResult?: CodeRunResult
  isEvaluating?: boolean
  isLogging?: boolean
  testResult?: CodeRunResult
}

type ConsoleEntry = ConsoleMessage & {
  key: string
  source: string
}

type ResultTab = 'console' | 'tests'

export function ProblemResults({
  consoleResult,
  isEvaluating = false,
  isLogging = false,
  testResult,
}: ProblemResultsProps) {
  const [activeTab, setActiveTab] = useState<ResultTab>('console')

  useEffect(() => {
    if (isEvaluating || testResult) {
      setActiveTab('tests')
      return
    }

    if (isLogging || consoleResult) {
      setActiveTab('console')
    }
  }, [consoleResult, isEvaluating, isLogging, testResult])

  return (
    <Card className="min-w-0">
      <Tabs
        onValueChange={(value) => setActiveTab(value as ResultTab)}
        value={activeTab}
      >
        <CardHeader className="gap-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="grid gap-1">
              <CardTitle>Results</CardTitle>
              <CardDescription>
                Inspect sample output or evaluate against the tests.
              </CardDescription>
            </div>
            <TabsList>
              <TabsTrigger value="console">Console</TabsTrigger>
              <TabsTrigger value="tests">Tests</TabsTrigger>
            </TabsList>
          </div>
        </CardHeader>
        <CardContent>
          <TabsContent value="console">
            <ConsoleResults isRunning={isLogging} result={consoleResult} />
          </TabsContent>
          <TabsContent value="tests">
            <TestResults isRunning={isEvaluating} result={testResult} />
          </TabsContent>
        </CardContent>
      </Tabs>
    </Card>
  )
}

function TestResults({ isRunning = false, result }: TestResultsProps) {
  return (
    <div className="grid gap-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {result
            ? `${result.tests.length} tests completed in ${result.durationMs}ms`
            : 'Run Evaluate to test this solution.'}
        </p>
        <ResultBadge isRunning={isRunning} result={result} />
      </div>
      {isRunning ? (
        <div className="flex items-center gap-2 rounded-md border bg-muted/30 p-3 text-sm text-muted-foreground">
          <CircleDashed className="size-4 animate-spin" />
          Evaluating tests...
        </div>
      ) : null}
      {result?.error ? (
        <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
          {result.error}
        </div>
      ) : null}
      {result?.tests.map((test) => (
        <TestResultRow key={test.name} test={test} />
      ))}
    </div>
  )
}

function ConsoleResults({ isRunning = false, result }: TestResultsProps) {
  const consoleEntries = getConsoleEntries(result)

  return (
    <div className="grid gap-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {result
            ? `Console run completed in ${result.durationMs}ms`
            : 'Run Log result to inspect sample output.'}
        </p>
        <ConsoleBadge isRunning={isRunning} result={result} />
      </div>
      <ConsoleOutput entries={consoleEntries} hasResult={Boolean(result)} />
      {isRunning ? (
        <div className="flex items-center gap-2 rounded-md border bg-muted/30 p-3 text-sm text-muted-foreground">
          <CircleDashed className="size-4 animate-spin" />
          Logging result...
        </div>
      ) : null}
      {result?.error ? (
        <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
          {result.error}
        </div>
      ) : null}
    </div>
  )
}

function ResultBadge({
  isRunning,
  result,
}: {
  isRunning: boolean
  result?: CodeRunResult
}) {
  if (isRunning) {
    return <Badge variant="muted">Running</Badge>
  }

  if (!result) {
    return <Badge variant="outline">Not run</Badge>
  }

  if (result.status === 'passed') {
    return <Badge>Passed</Badge>
  }

  if (result.status === 'timeout') {
    return <Badge variant="muted">Timeout</Badge>
  }

  return (
    <Badge className="bg-destructive text-destructive-foreground">
      {result.status === 'failed' ? 'Failed' : 'Error'}
    </Badge>
  )
}

function ConsoleBadge({
  isRunning,
  result,
}: {
  isRunning: boolean
  result?: CodeRunResult
}) {
  if (isRunning) {
    return <Badge variant="muted">Running</Badge>
  }

  if (!result) {
    return <Badge variant="outline">Not logged</Badge>
  }

  if (result.error || result.status === 'error' || result.status === 'timeout') {
    return (
      <Badge className="bg-destructive text-destructive-foreground">
        Error
      </Badge>
    )
  }

  return <Badge>Logged</Badge>
}

function TestResultRow({ test }: { test: TestRunResult }) {
  const Icon = getStatusIcon(test.status)

  return (
    <article className="grid gap-3 rounded-md border bg-background p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <Icon className={cn('size-4', getStatusColor(test.status))} />
          <h3 className="text-sm font-medium">{test.name}</h3>
        </div>
        <span className="text-xs text-muted-foreground">{test.durationMs}ms</span>
      </div>
      {test.error ? (
        <p className={cn('text-sm', getStatusColor(test.status))}>{test.error}</p>
      ) : null}
      {test.status === 'failed' ? (
        <div className="grid gap-2 text-xs sm:grid-cols-2">
          <ValueBlock label="Expected" value={test.expected} />
          <ValueBlock label="Actual" value={test.actual} />
        </div>
      ) : null}
    </article>
  )
}

function ValueBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-1">
      <span className="font-medium text-muted-foreground">{label}</span>
      <pre className="overflow-auto rounded border bg-muted/40 p-2 text-foreground">
            <code className="break-words">{value}</code>
      </pre>
    </div>
  )
}

function ConsoleOutput({
  entries,
  hasResult,
}: {
  entries: ConsoleEntry[]
  hasResult: boolean
}) {
  const emptyMessage = hasResult
    ? 'No console output. Add console.log(...) and log the sample again.'
    : 'Use the sample console.log(...) or add your own, then run Log result.'

  return (
    <section
      aria-label="Console output"
      aria-live="polite"
      className="grid gap-2 rounded-md border bg-muted/30 p-3 text-xs"
    >
      <span className="font-medium text-muted-foreground">Console output</span>
      {entries.length ? (
        entries.map((entry) => (
          <div key={entry.key} className="grid gap-1">
            {shouldShowConsoleMeta(entry) ? (
              <div className="flex flex-wrap items-center gap-2 text-muted-foreground">
                <span className="uppercase">{entry.method}</span>
                <span>{entry.source}</span>
              </div>
            ) : null}
            <pre className="overflow-auto text-foreground">
              <code className="break-words">{entry.values.join(' ')}</code>
            </pre>
          </div>
        ))
      ) : (
        <p className="text-muted-foreground">{emptyMessage}</p>
      )}
    </section>
  )
}

function shouldShowConsoleMeta(entry: ConsoleEntry) {
  return entry.method !== 'log'
}

function getConsoleEntries(result?: CodeRunResult): ConsoleEntry[] {
  if (!result) {
    return []
  }

  const entries: ConsoleEntry[] = result.logs.map((log, index) => ({
    ...log,
    key: `setup-${index}`,
    source: 'Setup',
  }))

  result.tests.forEach((test, testIndex) => {
    test.logs.forEach((log, index) => {
      entries.push({
        ...log,
        key: `test-${testIndex}-${index}`,
        source: test.name,
      })
    })
  })

  return entries
}

function getStatusIcon(status: TestRunResult['status']) {
  if (status === 'passed') {
    return CheckCircle2
  }

  if (status === 'timeout') {
    return Clock
  }

  if (status === 'error') {
    return AlertTriangle
  }

  return XCircle
}

function getStatusColor(status: TestRunResult['status']) {
  if (status === 'passed') {
    return 'text-primary'
  }

  if (status === 'timeout') {
    return 'text-muted-foreground'
  }

  return 'text-destructive'
}
