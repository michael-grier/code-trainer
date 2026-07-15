import { SquareTerminal } from 'lucide-react'

import { cn } from '@/lib/cn'

export type TerminalTranscriptLineType =
  | 'command'
  | 'output'
  | 'info'
  | 'warning'
  | 'error'

export type TerminalTranscriptLine = {
  type: TerminalTranscriptLineType
  text: string
  label?: string
}

type TerminalTranscriptProps = {
  label: string
  lines: readonly TerminalTranscriptLine[]
  ariaLive?: 'off' | 'polite'
  caption?: string
  className?: string
  emptyMessage?: string
  title?: string
}

export function TerminalTranscript({
  ariaLive = 'off',
  caption,
  className,
  emptyMessage = 'No output.',
  label,
  lines,
  title = 'Terminal',
}: TerminalTranscriptProps) {
  return (
    <figure
      aria-label={caption ? undefined : label}
      className={cn('mb-4 min-w-0', className)}
      data-slot="terminal-transcript"
    >
      <div className="overflow-hidden rounded-lg border border-zinc-800 bg-zinc-950 shadow-sm">
        <div className="flex items-center gap-2 border-b border-zinc-800 bg-zinc-900 px-3 py-2 text-xs font-medium text-zinc-300">
          <SquareTerminal aria-hidden="true" className="size-4 text-emerald-300" />
          <span>{title}</span>
        </div>
        <pre
          aria-live={ariaLive}
          className="max-w-full overflow-x-auto p-4 font-mono text-xs leading-6 text-zinc-100 selection:bg-emerald-400/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-emerald-300 sm:text-sm"
          role={ariaLive === 'polite' ? 'log' : undefined}
          tabIndex={0}
        >
          <code>
            {lines.length ? (
              lines.map((line, index) => (
                <span
                  className={cn(
                    'block min-w-max whitespace-pre',
                    getLineColor(line.type),
                  )}
                  key={`${line.type}-${index}`}
                >
                  {renderLinePrefix(line)}
                  {line.text || ' '}
                </span>
              ))
            ) : (
              <span className="block min-w-max text-zinc-400">{emptyMessage}</span>
            )}
          </code>
        </pre>
      </div>
      {caption ? (
        <figcaption className="mt-2 text-sm leading-6 text-muted-foreground">
          {caption}
        </figcaption>
      ) : null}
    </figure>
  )
}

function renderLinePrefix(line: TerminalTranscriptLine) {
  const label = line.label ?? getDefaultLabel(line.type)

  if (!label) {
    return null
  }

  return (
    <span className={cn('mr-2 font-semibold', getLabelColor(line.type))}>
      {label}
    </span>
  )
}

function getDefaultLabel(type: TerminalTranscriptLineType) {
  if (type === 'command') {
    return '$'
  }

  if (type === 'info') {
    return '[info]'
  }

  if (type === 'warning') {
    return '[warning]'
  }

  if (type === 'error') {
    return '[error]'
  }

  return undefined
}

function getLineColor(type: TerminalTranscriptLineType) {
  if (type === 'warning') {
    return 'text-amber-200'
  }

  if (type === 'error') {
    return 'text-red-300'
  }

  if (type === 'info') {
    return 'text-sky-200'
  }

  return 'text-zinc-100'
}

function getLabelColor(type: TerminalTranscriptLineType) {
  if (type === 'command') {
    return 'text-emerald-300'
  }

  return 'text-current'
}
