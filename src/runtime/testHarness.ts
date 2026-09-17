import type { TestCase } from '@/curriculum/types'

import { deepEqual } from './deepEqual'
import { clampRunnerText } from './runnerText'
import type { ConsoleMessage, TestRunResult } from './types'

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
    return clampRunnerText(formatDisplayValue(value, new WeakSet(), 0))
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
): string {
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
    formatDisplayValue(child, ancestors, depth + 1)
  const formatEntries = (open: string, close: string, entries: string[]) =>
    entries.length === 0
      ? `${open}${close}`
      : `${open}\n${childIndent}${entries.join(`,\n${childIndent}`)}\n${indent}${close}`

  // Track only the current ancestor chain: a shared reference is not a cycle.
  ancestors.add(value)
  try {
    if (value instanceof Set) {
      return formatEntries(`Set(${value.size}) {`, '}', [...value].map(formatChild))
    }
    if (value instanceof Map) {
      return formatEntries(
        `Map(${value.size}) {`,
        '}',
        [...value].map(
          ([key, entry]) => `${formatChild(key)} => ${formatChild(entry)}`,
        ),
      )
    }
    if (Array.isArray(value)) {
      return formatEntries(
        '[',
        ']',
        Array.from(value, (entry, index) =>
          index in value ? formatChild(entry) : '<empty>',
        ),
      )
    }
    return formatEntries(
      '{',
      '}',
      Object.entries(value).map(
        ([key, entry]) => `${JSON.stringify(key)}: ${formatChild(entry)}`,
      ),
    )
  } finally {
    ancestors.delete(value)
  }
}

function getNow() {
  return globalThis.performance?.now() ?? Date.now()
}

function getElapsedMs(startedAt: number) {
  return Math.max(0, Math.round(getNow() - startedAt))
}
