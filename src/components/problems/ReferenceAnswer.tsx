import { Eye, LockKeyhole } from 'lucide-react'

import { ReadOnlyCode } from '@/components/editor/ReadOnlyCode'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

type ReferenceAnswerProps = {
  answer: string
  canReveal: boolean
  isRevealed: boolean
  onReveal: () => void
}

export function ReferenceAnswer({
  answer,
  canReveal,
  isRevealed,
  onReveal,
}: ReferenceAnswerProps) {
  return (
    <Card className="min-w-0">
      <CardHeader className="gap-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="grid gap-1">
            <CardTitle>Reference answer</CardTitle>
            <CardDescription>
              Compare after you have attempted the problem.
            </CardDescription>
          </div>
          {!isRevealed ? (
            <Button
              disabled={!canReveal}
              onClick={onReveal}
              type="button"
              variant="outline"
            >
              {canReveal ? (
                <Eye className="size-4" />
              ) : (
                <LockKeyhole className="size-4" />
              )}
              Reveal
            </Button>
          ) : null}
        </div>
      </CardHeader>
      <CardContent>
        {isRevealed ? (
          <ReadOnlyCode className="max-h-none whitespace-pre-wrap" code={answer} />
        ) : (
          <div className="rounded-md border border-dashed bg-muted/30 p-4 text-sm text-muted-foreground">
            Enter an answer before revealing the reference.
          </div>
        )}
      </CardContent>
    </Card>
  )
}

