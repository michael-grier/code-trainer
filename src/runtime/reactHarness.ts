import type { ComponentType } from 'react'
import { createElement } from 'react'
import { flushSync } from 'react-dom'
import { createRoot } from 'react-dom/client'
import { transform } from 'sucrase'

import type {
  ReactExpectation,
  ReactTestCase,
  ReactTestStep,
} from '@/curriculum/types'

import { errorToMessage } from './testHarness'
import type { TestRunResult } from './types'

// The DOM handles the harness needs from its environment. In the worker these
// come from linkedom; harness tests supply the same shapes directly.
export type HarnessDom = {
  document: Document
  createEvent: (type: string) => Event
}

const reactImportPattern =
  /^\s*import\s+(?:(\w+)\s*,\s*)?(?:\{([^}]*)\}|(\w+))\s+from\s+['"]react['"];?\s*$/gm

// Learner code arrives as TSX importing from 'react'. Blob modules cannot
// resolve bare specifiers, so imports from 'react' are rewritten to read the
// copy the runner bundled and exposed on globalThis. Any other import is left
// alone and fails loudly, which matches the problems' single-file contract.
export function transpileReactCode(code: string): string {
  const withoutReactImports = code.replace(
    reactImportPattern,
    (_match, defaultName: string | undefined, named: string | undefined, bareDefault: string | undefined) => {
      const parts: string[] = []
      const defaultBinding = defaultName ?? bareDefault

      // The prelude below always declares React, so emitting it again for
      // "import React from 'react'" would be a duplicate const declaration.
      if (defaultBinding && defaultBinding !== 'React') {
        parts.push(`const ${defaultBinding} = globalThis.__REACT__;`)
      }

      if (named && named.trim().length > 0) {
        const bindings = named
          .split(',')
          .map((binding) => binding.trim())
          .filter(Boolean)
          .map((binding) => binding.replace(/\s+as\s+/, ': '))
          .join(', ')

        parts.push(`const { ${bindings} } = globalThis.__REACT__;`)
      }

      return parts.join('\n')
    },
  )

  // JSX compiles to React.createElement, so a React binding must exist even
  // when the learner only imported hooks.
  const prelude = 'const React = globalThis.__REACT__;\n'

  return (
    prelude +
    transform(withoutReactImports, {
      // The imports transform emits CommonJS, so the code can be evaluated
      // with new Function in any environment: no module URLs required, and a
      // leftover import of anything besides react fails loudly as a require.
      transforms: ['typescript', 'jsx', 'imports'],
      jsxRuntime: 'classic',
    }).code
  )
}

export function loadReactComponent(
  code: string,
  componentName: string,
): ComponentType<Record<string, unknown>> {
  const transpiled = transpileReactCode(code)
  const moduleExports: Record<string, unknown> = {}
  const moduleObject = { exports: moduleExports }

  const evaluate = new Function('exports', 'module', transpiled)
  evaluate(moduleExports, moduleObject)

  const candidate = moduleExports[componentName]

  if (typeof candidate !== 'function') {
    throw new Error(`Expected exported component "${componentName}" to exist.`)
  }

  return candidate as ComponentType<Record<string, unknown>>
}

export async function runReactTestCases(
  Component: ComponentType<Record<string, unknown>>,
  tests: ReactTestCase[],
  dom: HarnessDom,
): Promise<TestRunResult[]> {
  const results: TestRunResult[] = []

  for (const test of tests) {
    results.push(await runReactTestCase(Component, test, dom))
  }

  return results
}

async function runReactTestCase(
  Component: ComponentType<Record<string, unknown>>,
  test: ReactTestCase,
  dom: HarnessDom,
): Promise<TestRunResult> {
  const startedAt = Date.now()
  const container = dom.document.createElement('div')
  dom.document.body.appendChild(container)

  // React 19 reports uncaught render errors through this root option
  // instead of throwing from render, so collect and rethrow them.
  let uncaughtError: unknown
  const root = createRoot(container, {
    onUncaughtError: (error) => {
      uncaughtError = error
    },
  })
  const rethrowUncaught = () => {
    if (uncaughtError !== undefined) {
      throw uncaughtError
    }
  }

  try {
    flushSync(() => {
      root.render(createElement(Component, test.props ?? {}))
    })
    rethrowUncaught()
    // Give passive effects a task-queue turn to commit, the same timing a
    // browser gives them after paint.
    await flushTasks()

    for (const step of test.steps ?? []) {
      applyStep(container, step, dom)
      await flushTasks()
      rethrowUncaught()
    }

    const failures = collectExpectationFailures(container, test.expect)

    return {
      name: test.name,
      status: failures.length === 0 ? 'passed' : 'failed',
      expected: describeExpectations(test.expect),
      actual: failures.length === 0 ? 'rendered as expected' : failures.join(' '),
      durationMs: Date.now() - startedAt,
      logs: [],
      error: failures.length === 0 ? undefined : failures.join(' '),
    }
  } catch (error) {
    return {
      name: test.name,
      status: 'error',
      expected: describeExpectations(test.expect),
      actual: '',
      durationMs: Date.now() - startedAt,
      logs: [],
      error: errorToMessage(error),
    }
  } finally {
    try {
      flushSync(() => root.unmount())
    } catch {
      // A component that already crashed can fail to unmount; the container
      // is discarded either way.
    }

    container.remove()
  }
}

function applyStep(container: Element, step: ReactTestStep, dom: HarnessDom) {
  if (step.action === 'click') {
    const target = findByText(container, step.text)

    if (!target) {
      throw new Error(`No element with text "${step.text}" to click.`)
    }

    const event = dom.createEvent('click')
    flushSync(() => {
      target.dispatchEvent(event)
    })
    return
  }

  const input = findInput(container, step.into)

  if (!input) {
    throw new Error(
      `No input with accessible name "${step.into}" (aria-label, associated label, or placeholder) to type into.`,
    )
  }

  input.value = step.value

  // React's synthetic change events depend on browser feature detection
  // that a lightweight DOM cannot satisfy, so invoke the element's React
  // onChange prop directly; React attaches current props to the node.
  const propsKey = Object.keys(input).find((key) =>
    key.startsWith('__reactProps$'),
  )
  const props = propsKey
    ? (input as unknown as Record<string, { onChange?: (event: unknown) => void }>)[
        propsKey
      ]
    : undefined

  if (props?.onChange) {
    flushSync(() => {
      // Enough synthetic-event surface that ordinary handlers (reading
      // type or calling preventDefault) do not crash on the stand-in.
      props.onChange?.({
        type: 'change',
        target: input,
        currentTarget: input,
        preventDefault: () => undefined,
        stopPropagation: () => undefined,
      })
    })
    return
  }

  // Uncontrolled inputs keep the written value; native listeners still get
  // an input event.
  const event = dom.createEvent('input')
  flushSync(() => {
    input.dispatchEvent(event)
  })
}

// The deepest element whose own text matches wins, so clicking "remove"
// hits the button rather than the list item that contains it.
function findByText(container: Element, text: string): Element | undefined {
  const matches = [...container.querySelectorAll('*')].filter(
    (element) => element.textContent?.trim() === text,
  )

  return matches[matches.length - 1]
}

// Resolve inputs the way assistive tech resolves accessible names: an
// aria-label, an associated label (wrapping or via htmlFor), or, as the
// weakest fallback, a placeholder.
function findInput(
  container: Element,
  descriptor: string,
): (Element & { value: string }) | undefined {
  const candidates = [...container.querySelectorAll('input, textarea')]
  const match = candidates.find((element) => {
    if (
      element.getAttribute('aria-label') === descriptor ||
      element.getAttribute('placeholder') === descriptor
    ) {
      return true
    }

    const wrappingLabel = element.closest('label')
    if (wrappingLabel && wrappingLabel.textContent?.trim() === descriptor) {
      return true
    }

    const id = element.getAttribute('id')
    if (id !== null && id !== '') {
      const associatedLabel = container.querySelector(`label[for="${id}"]`)
      if (associatedLabel?.textContent?.trim() === descriptor) {
        return true
      }
    }

    return false
  })

  return match as (Element & { value: string }) | undefined
}

function collectExpectationFailures(
  container: Element,
  expectations: ReactExpectation[],
): string[] {
  const text = container.textContent ?? ''
  const failures: string[] = []

  for (const expectation of expectations) {
    const present = text.includes(expectation.text)

    if (expectation.type === 'text-present' && !present) {
      failures.push(`Expected to find "${expectation.text}" on screen.`)
    }

    if (expectation.type === 'text-absent' && present) {
      failures.push(`Expected "${expectation.text}" to be gone from the screen.`)
    }
  }

  return failures
}

function describeExpectations(expectations: ReactExpectation[]): string {
  return expectations
    .map((expectation) =>
      expectation.type === 'text-present'
        ? `shows "${expectation.text}"`
        : `does not show "${expectation.text}"`,
    )
    .join(', ')
}

function flushTasks() {
  return new Promise((resolve) => setTimeout(resolve, 0))
}
