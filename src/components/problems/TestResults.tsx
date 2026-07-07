import {
  AlertTriangle,
  CheckCircle2,
  CircleDashed,
  Clock,
  XCircle,
} from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { cn } from '@/lib/cn'
import type { CodeRunResult, ConsoleMessage, TestRunResult } from '@/runtime'

type TestResultsProps = {
  result?: CodeRunResult
  isRunning?: boolean
}

export function TestResults({ isRunning = false, result }: TestResultsProps) {
  return (
    <Card className="min-w-0">
      <CardHeader className="gap-2">
        <div className="flex items-center justify-between gap-3">
          <CardTitle>Test results</CardTitle>
          <ResultBadge isRunning={isRunning} result={result} />
        </div>
        <CardDescription>
          {result
            ? `${result.tests.length} tests completed in ${result.durationMs}ms`
            : 'Run tests to evaluate this solution.'}
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3">
        {result?.logs.length ? <ConsoleLogList logs={result.logs} /> : null}
        {isRunning ? (
          <div className="flex items-center gap-2 rounded-md border bg-muted/30 p-3 text-sm text-muted-foreground">
            <CircleDashed className="size-4 animate-spin" />
            Running tests...
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
      </CardContent>
    </Card>
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
      {test.logs.length ? <ConsoleLogList logs={test.logs} /> : null}
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

function ConsoleLogList({ logs }: { logs: ConsoleMessage[] }) {
  return (
    <div className="grid gap-2 rounded-md border bg-muted/30 p-3 text-xs">
      <span className="font-medium text-muted-foreground">Console</span>
      {logs.map((log, index) => (
        <div key={`${log.method}-${index}`} className="grid gap-1">
          <span className="uppercase text-muted-foreground">{log.method}</span>
          <pre className="overflow-auto text-foreground">
            <code className="break-words">{log.values.join(' ')}</code>
          </pre>
        </div>
      ))}
    </div>
  )
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
