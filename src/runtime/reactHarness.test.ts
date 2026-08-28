import { parseHTML } from 'linkedom'
import { beforeAll, describe, expect, it } from 'vitest'

import type { ReactTestCase } from '@/curriculum/types'

import type { HarnessDom } from './reactHarness'
import type { TestRunResult } from './types'

// react-dom reads window and document at import time, so the linkedom
// globals must exist before the harness (which imports react-dom) loads.
// That forces dynamic imports from beforeAll instead of top-level ones.
let harness: typeof import('./reactHarness')
let dom: HarnessDom

beforeAll(async () => {
  const parsed = parseHTML(
    '<!doctype html><html><body></body></html>',
  ) as unknown as {
    window: Window & { Event: typeof Event }
    document: Document
  }

  Object.assign(globalThis, {
    window: parsed.window,
    document: parsed.document,
  })

  const react = await import('react')
  Object.assign(globalThis, { __REACT__: react })

  dom = {
    document: parsed.document,
    createEvent: (type) => new parsed.window.Event(type, { bubbles: true }),
  }

  harness = await import('./reactHarness')
})

const counterCode = `import { useState } from 'react'

export function Counter({ start }: { start: number }) {
  const [count, setCount] = useState(start)

  return (
    <div>
      <p>count is {count}</p>
      <button onClick={() => setCount(count + 1)}>increment</button>
    </div>
  )
}
`

const effectCode = `import { useEffect, useState } from 'react'

export function Loader() {
  const [status, setStatus] = useState('loading')

  useEffect(() => {
    setStatus('ready')
  }, [])

  return <p>status: {status}</p>
}
`

const inputCode = `import { useState } from 'react'

export function Search() {
  const [query, setQuery] = useState('')

  return (
    <div>
      <input
        aria-label="search"
        onChange={(event) => setQuery(event.target.value)}
        value={query}
      />
      <p>query: {query}</p>
    </div>
  )
}
`

async function run(
  code: string,
  componentName: string,
  tests: ReactTestCase[],
): Promise<TestRunResult[]> {
  const Component = harness.loadReactComponent(code, componentName)

  return harness.runReactTestCases(Component, tests, dom)
}

describe('react harness', () => {
  it('renders a component with props and checks its text', async () => {
    const results = await run(counterCode, 'Counter', [
      {
        name: 'shows the starting count',
        props: { start: 4 },
        expect: [{ type: 'text-present', text: 'count is 4' }],
      },
    ])

    expect(results[0].status).toBe('passed')
  })

  it('drives state updates through click steps', async () => {
    const results = await run(counterCode, 'Counter', [
      {
        name: 'increments twice',
        props: { start: 0 },
        steps: [
          { action: 'click', text: 'increment' },
          { action: 'click', text: 'increment' },
        ],
        expect: [
          { type: 'text-present', text: 'count is 2' },
          { type: 'text-absent', text: 'count is 0' },
        ],
      },
    ])

    expect(results[0].status).toBe('passed')
  })

  it('waits for passive effects before checking expectations', async () => {
    const results = await run(effectCode, 'Loader', [
      {
        name: 'settles to ready',
        expect: [{ type: 'text-present', text: 'status: ready' }],
      },
    ])

    expect(results[0].status).toBe('passed')
  })

  it('types into a controlled input', async () => {
    const results = await run(inputCode, 'Search', [
      {
        name: 'echoes typed text',
        steps: [{ action: 'type', into: 'search', value: 'closures' }],
        expect: [{ type: 'text-present', text: 'query: closures' }],
      },
    ])

    expect(results[0].status).toBe('passed')
  })

  it('fails with a readable message when the expectation misses', async () => {
    const results = await run(counterCode, 'Counter', [
      {
        name: 'expects the wrong count',
        props: { start: 1 },
        expect: [{ type: 'text-present', text: 'count is 9' }],
      },
    ])

    expect(results[0].status).toBe('failed')
    expect(results[0].error).toContain('count is 9')
  })

  it('accepts a default React import without redeclaring the prelude binding', async () => {
    const defaultImportCode = `import React from 'react'
import { useState } from 'react'

export function Toggle() {
  const [on, setOn] = useState(false)

  return React.createElement(
    'button',
    { onClick: () => setOn(!on) },
    on ? 'on' : 'off',
  )
}
`
    const results = await run(defaultImportCode, 'Toggle', [
      {
        name: 'toggles on',
        steps: [{ action: 'click', text: 'off' }],
        expect: [{ type: 'text-present', text: 'on' }],
      },
    ])

    expect(results[0].status).toBe('passed')
  })

  it('reports a missing export as an error', () => {
    expect(() => harness.loadReactComponent(counterCode, 'Missing')).toThrow(
      'Expected exported component "Missing" to exist.',
    )
  })

  it('reports a crashing component as an error result', async () => {
    const crashing = `export function Broken() {
  throw new Error('render exploded')
}
`
    const results = await run(crashing, 'Broken', [
      { name: 'crashes', expect: [{ type: 'text-present', text: 'anything' }] },
    ])

    expect(results[0].status).toBe('error')
    expect(results[0].error).toContain('render exploded')
  })
})
