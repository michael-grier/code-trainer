import type { TestCase } from '@/curriculum/types'

import {
  createJavaScriptRunnerRequest,
  executeRunnerRequest,
  RunnerSandboxTimeoutError,
} from './sandboxClient'
import { formatValue } from './testHarness'
import {
  DEFAULT_RUN_TIMEOUT_MS,
  type CodeRunResult,
  type RuntimeWorkerInput,
  type TestRunResult,
} from './types'

export async function runTypeScriptTests(
  input: RuntimeWorkerInput,
): Promise<CodeRunResult> {
  const timeoutMs = input.timeoutMs ?? DEFAULT_RUN_TIMEOUT_MS
  const startedAt = getNow()

  try {
    return await executeRunnerRequest(
      createJavaScriptRunnerRequest(input),
      timeoutMs,
    )
  } catch (error) {
    if (error instanceof RunnerSandboxTimeoutError) {
      return createTimeoutResult(
        input.tests,
        timeoutMs,
        getElapsedMs(startedAt),
      )
    }

    return {
      status: 'error',
      durationMs: getElapsedMs(startedAt),
      tests: [],
      logs: [],
      error: error instanceof Error ? error.message : 'Runner execution failed.',
    }
  }
}

function createTimeoutResult(
  tests: TestCase[],
  timeoutMs: number,
  durationMs: number,
): CodeRunResult {
  return {
    status: 'timeout',
    durationMs,
    tests: tests.map<TestRunResult>((test) => ({
      name: test.name,
      status: 'timeout',
      expected: formatValue(test.expected),
      actual: '',
      durationMs: timeoutMs,
      logs: [],
      error: `Execution timed out after ${timeoutMs}ms.`,
    })),
    logs: [],
    error: `Execution timed out after ${timeoutMs}ms.`,
  }
}

function getNow() {
  return globalThis.performance?.now() ?? Date.now()
}

function getElapsedMs(startedAt: number) {
  return Math.max(0, Math.round(getNow() - startedAt))
}
