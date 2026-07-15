import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { TerminalTranscript } from './TerminalTranscript'

describe('TerminalTranscript', () => {
  it('renders structured terminal lines with visible non-color labels', () => {
    const markup = renderToStaticMarkup(
      <TerminalTranscript
        caption="A sample command and its output."
        label="Sample terminal output"
        lines={[
          { type: 'command', text: 'bun run example' },
          { type: 'output', text: 'ready' },
          { type: 'info', text: 'using cached data' },
          { type: 'warning', text: 'retrying request' },
          { type: 'error', text: 'request failed' },
        ]}
      />,
    )

    expect(markup).toContain('data-slot="terminal-transcript"')
    expect(markup).not.toContain('aria-label="Sample terminal output"')
    expect(markup).toContain('tabindex="0"')
    expect(markup).toContain('bun run example')
    expect(markup).toContain('[info]')
    expect(markup).toContain('[warning]')
    expect(markup).toContain('[error]')
    expect(markup).toContain('<figcaption')
  })

  it('renders a selectable empty state without a live region by default', () => {
    const markup = renderToStaticMarkup(
      <TerminalTranscript
        emptyMessage="Run the sample to see output."
        label="Console output"
        lines={[]}
      />,
    )

    expect(markup).toContain('aria-label="Console output"')
    expect(markup).toContain('aria-live="off"')
    expect(markup).toContain('Run the sample to see output.')
  })
})
