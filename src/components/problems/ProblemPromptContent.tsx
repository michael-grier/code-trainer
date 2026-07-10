import { Fragment, useId } from 'react'

import { cn } from '@/lib/cn'

import { splitProblemPrompt } from './promptFormat'

type ProblemPromptProps = {
  className?: string
  prompt: string
}

export function ProblemPrompt({ className, prompt }: ProblemPromptProps) {
  const exampleTitleId = useId()
  const { example, instructions } = splitProblemPrompt(prompt)

  return (
    <div className={cn('grid max-w-4xl gap-3', className)}>
      <p className="leading-6">{renderInlineCode(instructions)}</p>
      {example ? (
        <section
          aria-labelledby={exampleTitleId}
          className="rounded-md border border-primary/25 bg-primary/5 px-3 py-3"
        >
          <h2
            className="mb-1 text-xs font-semibold uppercase tracking-normal text-primary"
            id={exampleTitleId}
          >
            Example input and output
          </h2>
          <p className="leading-6 text-foreground">
            {renderInlineCode(example)}
          </p>
        </section>
      ) : null}
    </div>
  )
}

function renderInlineCode(text: string) {
  return text.split(/(`[^`]+`)/g).map((part, index) => {
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code
          className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-foreground"
          key={`code-${index}`}
        >
          {part.slice(1, -1)}
        </code>
      )
    }

    return <Fragment key={`text-${index}`}>{part}</Fragment>
  })
}
