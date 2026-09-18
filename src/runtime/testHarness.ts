import type { TestCase } from '@/curriculum/types'

import { deepEqual } from './deepEqual'
import { clampRunnerText } from './runnerText'
import { MAX_RUNNER_TEXT_LENGTH, type ConsoleMessage, type TestRunResult } from './types'

export type TestCandidate = (
  ...args: unknown[]
) => unknown | Promise<unknown>

type RunTestCasesOptions = {
  consumeLogs?: () => ConsoleMessage[]
}

export async function runTestCases(
  candidate: TestCandidate,
  tests: TestCase[],
  options: RunTestCasesOptions = {},
): Promise<TestRunResult[]> {
  const results: TestRunResult[] = []

  for (const test of tests) {
    options.consumeLogs?.()

    const startedAt = getNow()

    try {
      const actual = await candidate(...test.args)
      const durationMs = getElapsedMs(startedAt)
      const logs = options.consumeLogs?.() ?? []
      const passed = deepEqual(actual, test.expected)

      results.push({
        name: test.name,
        status: passed ? 'passed' : 'failed',
        expected: formatValue(test.expected),
        actual: formatValue(actual),
        durationMs,
        logs,
        error: passed
          ? undefined
          : clampRunnerText(
              `Expected ${formatValue(test.expected)}, received ${formatValue(
                actual,
              )}.`,
            ),
      })
    } catch (error) {
      results.push({
        name: test.name,
        status: 'error',
        expected: formatValue(test.expected),
        actual: '',
        durationMs: getElapsedMs(startedAt),
        logs: options.consumeLogs?.() ?? [],
        error: errorToMessage(error),
      })
    }
  }

  return results
}

export function getStatusFromTestResults(results: TestRunResult[]) {
  if (results.some((result) => result.status === 'timeout')) {
    return 'timeout'
  }

  if (results.some((result) => result.status === 'error')) {
    return 'error'
  }

  if (results.every((result) => result.status === 'passed')) {
    return 'passed'
  }

  return 'failed'
}

export function formatValue(value: unknown): string {
  try {
    return clampRunnerText(formatDisplayValue(value, new WeakSet(), 0, {
      remaining: MAX_RUNNER_TEXT_LENGTH,
    }))
  } catch {
    return clampRunnerText(String(value))
  }
}

export function errorToMessage(error: unknown) {
  if (error instanceof Error) {
    return clampRunnerText(String(error.message))
  }

  if (typeof error === 'string') {
    return clampRunnerText(error)
  }

  return formatValue(error)
}

function formatDisplayValue(
  value: unknown,
  ancestors: WeakSet<object>,
  depth: number,
  budget: { remaining: number },
): string {
  if (budget.remaining <= 0) return '[Truncated]'
  budget.remaining -= 1
  if (typeof value === 'string') return JSON.stringify(value)
  if (typeof value === 'bigint') return `${value}n`
  if (typeof value === 'function') return `[Function ${value.name || 'anonymous'}]`
  if (typeof value !== 'object' || value === null) {
    return Object.is(value, -0) ? '-0' : String(value)
  }

  if (value instanceof Date) {
    return Number.isNaN(value.getTime())
      ? 'Invalid Date'
      : JSON.stringify(value.toISOString())
  }
  if (value instanceof RegExp) return String(value)
  if (value instanceof Error) return `${value.name}: ${value.message}`
  if (ancestors.has(value)) return '[Circular]'
  // Stop deeply nested learner values from overflowing the formatter's stack.
  if (depth >= 20) return '[Max depth]'

  const indent = '  '.repeat(depth)
  const childIndent = `${indent}  `
  const formatChild = (child: unknown) =>
    formatDisplayValue(child, ancestors, depth + 1, budget)
  const formatEntries = <T>(
    open: string,
    close: string,
    entries: Iterable<T>,
    formatEntry: (entry: T) => string,
  ) => {
    const formatted: string[] = []
    // Consume entries lazily so wide collections and shared graphs stop being
    // traversed when the budget runs out, before the final text is clamped.
    for (const entry of entries) {
      if (budget.remaining <= 0) {
        formatted.push('[Truncated]')
        break
      }
      formatted.push(formatEntry(entry))
    }
    return formatted.length === 0
      ? `${open}${close}`
      : `${open}\n${childIndent}${formatted.join(`,\n${childIndent}`)}\n${indent}${close}`
  }

  // Track only the current ancestor chain: a shared reference is not a cycle.
  ancestors.add(value)
  try {
    if (value instanceof Set) {
      return formatEntries(`Set(${value.size}) {`, '}', value.values(), formatChild)
    }
    if (value instanceof Map) {
      return formatEntries(
        `Map(${value.size}) {`,
        '}',
        value.entries(),
        ([key, entry]) => `${formatChild(key)} => ${formatChild(entry)}`,
      )
    }
    if (Array.isArray(value)) {
      return formatEntries(
        '[',
        ']',
        value.keys(),
        (index) => {
          if (index in value) return formatChild(value[index])
          budget.remaining -= 1
          return '<empty>'
        },
      )
    }
    return formatEntries(
      '{',
      '}',
      ownEnumerableKeys(value),
      (key) => `${JSON.stringify(key)}: ${formatChild(Reflect.get(value, key))}`,
    )
  } finally {
    ancestors.delete(value)
  }
}

function* ownEnumerableKeys(value: object) {
  for (const key in value) {
    if (Object.hasOwn(value, key)) yield key
  }
}

function getNow() {
  return globalThis.performance?.now() ?? Date.now()
}

function getElapsedMs(startedAt: number) {
  return Math.max(0, Math.round(getNow() - startedAt))
}
