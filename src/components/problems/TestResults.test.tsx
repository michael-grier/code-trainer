import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import type { CodeRunResult } from '@/runtime'

import { ProblemResults } from './TestResults'

describe('ProblemResults', () => {
  it('presents captured console messages as a terminal transcript', () => {
    const result: CodeRunResult = {
      status: 'passed',
      durationMs: 4,
      logs: [
        { method: 'log', values: ['ready'] },
        { method: 'warn', values: ['retrying'] },
      ],
      tests: [],
    }

    const markup = renderToStaticMarkup(<ProblemResults consoleResult={result} />)

    expect(markup).toContain('data-slot="terminal-transcript"')
    expect(markup).toContain('aria-live="polite"')
    expect(markup).toContain('role="log"')
    expect(markup).toContain('ready')
    expect(markup).toContain('[warn · Setup]')
    expect(markup).toContain('retrying')
  })

  it('places runtime failures inside the terminal transcript', () => {
    const result: CodeRunResult = {
      status: 'error',
      durationMs: 2,
      logs: [],
      tests: [],
      error: 'ReferenceError: value is not defined',
    }

    const markup = renderToStaticMarkup(<ProblemResults consoleResult={result} />)

    expect(markup).toContain('[error]')
    expect(markup).toContain('ReferenceError: value is not defined')
  })
})
