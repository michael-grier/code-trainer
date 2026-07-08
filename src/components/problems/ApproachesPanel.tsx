import { ChevronDown } from 'lucide-react'

import { ReadOnlyCode } from '@/components/editor/ReadOnlyCode'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import type { Approach } from '@/curriculum/types'

type ApproachesPanelProps = {
  approaches?: Approach[]
}

export function ApproachesPanel({ approaches = [] }: ApproachesPanelProps) {
  if (approaches.length === 0) {
    return null
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Reference approaches</CardTitle>
        <CardDescription>
          Compare tradeoffs after you have attempted the problem.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3">
        {approaches.map((approach) => (
          <details
            className="group rounded-md border bg-background p-3"
            key={approach.name}
          >
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
              <span className="font-medium">{approach.name}</span>
              <span className="flex items-center gap-2">
                <ChevronDown className="size-4 text-muted-foreground transition-transform group-open:rotate-180" />
              </span>
            </summary>
            <div className="mt-3 grid gap-3 text-sm text-muted-foreground">
              <p>{approach.explanation}</p>
              {approach.complexity ? (
                <p className="font-medium text-foreground">{approach.complexity}</p>
              ) : null}
              {approach.code ? <ReadOnlyCode code={approach.code} /> : null}
            </div>
          </details>
        ))}
      </CardContent>
    </Card>
  )
}
