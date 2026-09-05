import type { ReactTestCase } from '@/curriculum/types'

import {
  createReactRunnerRequest,
  executeRunnerRequest,
  RunnerSandboxTimeoutError,
} from './sandboxClient'
import type {
  ReactRunInput,
} from './reactWorker'
import type { CodeRunResult, TestRunResult } from './types'

// Component tests pay a worker boot that includes React itself, so the
// budget is looser than the plain JS runner's.
const REACT_RUN_TIMEOUT_MS = 5_000

export async function runReactTests(input: ReactRunInput): Promise<CodeRunResult> {
  const timeoutMs = input.timeoutMs ?? REACT_RUN_TIMEOUT_MS
  const startedAt = Date.now()

  try {
    return await executeRunnerRequest(createReactRunnerRequest(input), timeoutMs)
  } catch (error) {
    if (error instanceof RunnerSandboxTimeoutError) {
      return createTimeoutResult(input.tests, timeoutMs, Date.now() - startedAt)
    }

    return {
      status: 'error',
      durationMs: Date.now() - startedAt,
      tests: [],
      logs: [],
      error: error instanceof Error ? error.message : 'Runner execution failed.',
    }
  }
}

function createTimeoutResult(
  tests: ReactTestCase[],
  timeoutMs: number,
  durationMs: number,
): CodeRunResult {
  return {
    status: 'timeout',
    durationMs,
    tests: tests.map<TestRunResult>((test) => ({
      name: test.name,
      status: 'timeout',
      expected: '',
      actual: '',
      durationMs: timeoutMs,
      logs: [],
      error: `Execution timed out after ${timeoutMs}ms.`,
    })),
    logs: [],
    error: `Execution timed out after ${timeoutMs}ms.`,
  }
}
