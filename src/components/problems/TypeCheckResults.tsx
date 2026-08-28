import { CheckCircle2, CircleDashed, XCircle } from 'lucide-react'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import type { TypeCheckDiagnostic, TypeCheckResult } from '@/runtime'

type TypeCheckResultsProps = {
  result?: TypeCheckResult | { error: string }
  isChecking: boolean
}

export function TypeCheckResults({ isChecking, result }: TypeCheckResultsProps) {
  return (
    <Card className="min-w-0">
      <CardHeader className="gap-2">
        <div className="flex items-center justify-between gap-3">
          <CardTitle>Type checks</CardTitle>
          {result && 'compilerVersion' in result ? (
            <span className="text-xs font-medium text-muted-foreground">
              TypeScript {result.compilerVersion}
            </span>
          ) : null}
        </div>
        <CardDescription>
          Compiler diagnostics under the curriculum&apos;s strict configuration,
          including hidden type tests.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3">
        {renderBody(isChecking, result)}
      </CardContent>
    </Card>
  )
}

function renderBody(
  isChecking: boolean,
  result?: TypeCheckResult | { error: string },
) {
  if (isChecking) {
    return (
      <div className="flex items-center gap-2 rounded-md border bg-muted/30 p-3 text-sm text-muted-foreground">
        <CircleDashed className="size-4 animate-spin" />
        Checking types…
      </div>
    )
  }

  if (!result) {
    return (
      <div className="flex items-center gap-2 rounded-md border bg-muted/30 p-3 text-sm text-muted-foreground">
        <CircleDashed className="size-4" />
        Evaluate to run the type check.
      </div>
    )
  }

  if (!('compilerVersion' in result)) {
    return (
      <div className="flex items-start gap-3 rounded-md border bg-background p-3 text-sm">
        <XCircle className="mt-0.5 size-4 text-destructive" />
        <p className="text-destructive">{result.error}</p>
      </div>
    )
  }

  if (result.passed) {
    return (
      <div className="flex items-center gap-2 rounded-md border bg-background p-3 text-sm">
        <CheckCircle2 className="size-4 text-primary" />
        No compiler diagnostics. All hidden type tests hold.
      </div>
    )
  }

  return result.diagnostics.map((diagnostic, index) => (
    <article
      className="flex items-start gap-3 rounded-md border bg-background p-3"
      key={`${diagnostic.code}-${diagnostic.line}-${index}`}
    >
      <XCircle className="mt-0.5 size-4 text-destructive" />
      <div className="grid gap-1 text-sm">
        <h3 className="font-medium text-destructive">
          {formatDiagnosticLocation(diagnostic)}
        </h3>
        <p className="text-muted-foreground">{diagnostic.message}</p>
      </div>
    </article>
  ))
}

function formatDiagnosticLocation(diagnostic: TypeCheckDiagnostic) {
  const region =
    diagnostic.source === 'type-tests'
      ? `hidden type test, line ${diagnostic.line}`
      : `line ${diagnostic.line}, column ${diagnostic.column}`

  return `TS${diagnostic.code} at ${region}`
}
