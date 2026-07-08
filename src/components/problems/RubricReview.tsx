import { CheckCircle2, Circle } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import type { RubricItem } from '@/curriculum/types'
import { cn } from '@/lib/cn'

type RubricReviewProps = {
  items: RubricItem[]
  checked: Record<string, true>
  disabled?: boolean
  onToggle: (itemId: string) => void
}

export function RubricReview({
  checked,
  disabled = false,
  items,
  onToggle,
}: RubricReviewProps) {
  const checkedCount = items.filter((item) => checked[item.id]).length

  return (
    <Card className="min-w-0">
      <CardHeader>
        <CardTitle>Rubric review</CardTitle>
        <CardDescription>
          {checkedCount}/{items.length} checks acknowledged
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3">
        {items.map((item) => {
          const isChecked = Boolean(checked[item.id])
          const Icon = isChecked ? CheckCircle2 : Circle

          return (
            <Button
              aria-pressed={isChecked}
              className={cn(
                'h-auto justify-start whitespace-normal rounded-md border p-3 text-left',
                isChecked
                  ? 'border-primary/40 bg-primary/10 text-foreground'
                  : 'border-border bg-background text-foreground',
              )}
              disabled={disabled}
              key={item.id}
              onClick={() => onToggle(item.id)}
              type="button"
              variant="ghost"
            >
              <Icon
                className={cn(
                  'mt-0.5 size-4',
                  isChecked ? 'text-primary' : 'text-muted-foreground',
                )}
              />
              <span className="grid gap-1">
                <span className="font-medium">{item.label}</span>
                <span className="text-sm font-normal text-muted-foreground">
                  {item.description}
                </span>
              </span>
            </Button>
          )
        })}
      </CardContent>
    </Card>
  )
}

