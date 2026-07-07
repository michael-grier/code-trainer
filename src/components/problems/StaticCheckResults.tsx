import { CheckCircle2, CircleDashed, XCircle } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { cn } from '@/lib/cn'
import type { StaticCheckResult } from '@/runtime'

type StaticCheckResultsProps = {
  results: StaticCheckResult[]
}

export function StaticCheckResults({ results }: StaticCheckResultsProps) {
  const passedCount = results.filter((result) => result.passed).length
  const allPassed = passedCount === results.length

  return (
    <Card className="min-w-0">
      <CardHeader className="gap-2">
        <div className="flex items-center justify-between gap-3">
          <CardTitle>Static checks</CardTitle>
          {results.length ? (
            <Badge variant={allPassed ? 'default' : 'outline'}>
              {passedCount}/{results.length}
            </Badge>
          ) : (
            <Badge variant="muted">None</Badge>
          )}
        </div>
        <CardDescription>
          Refactor goals that can be checked without executing code.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3">
        {results.length ? (
          results.map((result, index) => (
            <article
              className="flex items-start gap-3 rounded-md border bg-background p-3"
              key={`${result.kind}-${index}`}
            >
              {result.passed ? (
                <CheckCircle2 className="mt-0.5 size-4 text-primary" />
              ) : (
                <XCircle className="mt-0.5 size-4 text-destructive" />
              )}
              <div className="grid gap-1 text-sm">
                <h3 className={cn('font-medium', !result.passed && 'text-destructive')}>
                  {result.message}
                </h3>
                <p className="text-muted-foreground">{getStaticCheckDetail(result)}</p>
              </div>
            </article>
          ))
        ) : (
          <div className="flex items-center gap-2 rounded-md border bg-muted/30 p-3 text-sm text-muted-foreground">
            <CircleDashed className="size-4" />
            No static checks configured.
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function getStaticCheckDetail(result: StaticCheckResult) {
  if (result.kind === 'forbid-text') {
    return `Must not include "${result.text}".`
  }

  if (result.kind === 'require-text') {
    return `Must include "${result.text}".`
  }

  if (result.kind === 'max-lines') {
    return `Limit: ${result.max} non-empty lines.`
  }

  if (result.kind === 'no-any') {
    return 'No explicit any annotations.'
  }

  return `No mutation of ${result.targets.join(', ')}.`
}
