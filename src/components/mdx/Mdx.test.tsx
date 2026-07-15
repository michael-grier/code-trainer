import { renderToStaticMarkup } from 'react-dom/server'
import type { ComponentType } from 'react'
import { describe, expect, it } from 'vitest'

import { TerminalTranscript } from '@/components/terminal/TerminalTranscript'

import { Mdx } from './Mdx'

type FixtureComponents = {
  TerminalTranscript?: typeof TerminalTranscript
}

function TerminalLessonFixture({
  components,
}: {
  components?: FixtureComponents
}) {
  const Component = components?.TerminalTranscript

  if (!Component) {
    return null
  }

  return (
    <Component
      label="Compiler output"
      lines={[{ type: 'error', text: "Type 'number' is not assignable" }]}
      title="TypeScript"
    />
  )
}

describe('MDX components', () => {
  it('registers the terminal transcript for lesson content', () => {
    const markup = renderToStaticMarkup(
      <Mdx component={TerminalLessonFixture as unknown as ComponentType} />,
    )

    expect(markup).toContain('TypeScript')
    expect(markup).toContain('[error]')
    expect(markup).toContain('Type &#x27;number&#x27; is not assignable')
  })
})
