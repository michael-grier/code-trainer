import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { ProblemPrompt } from './ProblemPromptContent'
import { splitProblemPrompt } from './promptFormat'

describe('ProblemPrompt', () => {
  it('separates instructions from the example convention', () => {
    expect(
      splitProblemPrompt(
        'Implement `sum`. Return the total. Example: `sum([1, 2])` returns `3`.',
      ),
    ).toEqual({
      instructions: 'Implement `sum`. Return the total.',
      example: '`sum([1, 2])` returns `3`.',
    })
  })

  it('keeps prompts without examples as instructions only', () => {
    expect(splitProblemPrompt('Explain the runtime tradeoff.')).toEqual({
      instructions: 'Explain the runtime tradeoff.',
    })
  })

  it('renders a labeled example section and inline code', () => {
    const markup = renderToStaticMarkup(
      <ProblemPrompt prompt="Implement `sum`. Example: `sum([1, 2])` returns `3`." />,
    )

    expect(markup).toContain('Implement <code')
    expect(markup).toContain('Example input and output')
    expect(markup).toContain('<section')
    expect(markup).toContain('sum([1, 2])')
    expect(markup).toContain('returns')
  })

  it('does not add an example section when the marker is absent', () => {
    const markup = renderToStaticMarkup(
      <ProblemPrompt prompt="Explain `Map` lookup tradeoffs." />,
    )

    expect(markup).toContain('Explain <code')
    expect(markup).not.toContain('<section')
    expect(markup).not.toContain('Example input and output')
  })
})
