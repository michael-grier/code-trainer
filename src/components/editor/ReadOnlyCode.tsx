import { cn } from '@/lib/cn'

type ReadOnlyCodeProps = {
  code: string
  className?: string
}

export function ReadOnlyCode({ className, code }: ReadOnlyCodeProps) {
  return (
    <pre
      className={cn(
        'max-h-72 overflow-auto rounded-md border bg-muted/40 p-4 text-sm leading-6 text-foreground',
        className,
      )}
    >
      <code>{code}</code>
    </pre>
  )
}

