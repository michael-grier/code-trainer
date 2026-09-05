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
  if (typeof value === 'string') {
    return clampRunnerText(JSON.stringify(value))
  }

  if (typeof value === 'undefined') {
    return 'undefined'
  }

  if (typeof value === 'bigint') {
    return clampRunnerText(`${value.toString()}n`)
  }

  if (typeof value === 'function') {
    return clampRunnerText(`[Function ${value.name || 'anonymous'}]`)
  }

  if (typeof value === 'symbol') {
    return clampRunnerText(value.toString())
  }

  try {
    const serialized = JSON.stringify(value, createDisplayReplacer(), 2)
    return clampRunnerText(serialized ?? String(value))
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

function createDisplayReplacer() {
  const seen = new WeakSet<object>()

  return (_key: string, value: unknown) => {
    if (typeof value === 'bigint') {
      return `${value.toString()}n`
    }

    if (typeof value === 'function') {
      return `[Function ${value.name || 'anonymous'}]`
    }

    if (typeof value === 'symbol') {
      return value.toString()
    }

    if (typeof value === 'object' && value !== null) {
      if (seen.has(value)) {
        return '[Circular]'
      }

      seen.add(value)
    }

    return value
  }
}

function getNow() {
  return globalThis.performance?.now() ?? Date.now()
}

function getElapsedMs(startedAt: number) {
  return Math.max(0, Math.round(getNow() - startedAt))
}
