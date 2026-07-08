import type { TestCase } from '@/curriculum/types'

export const DEFAULT_RUN_TIMEOUT_MS = 2_000

export type ConsoleMethod = 'log' | 'info' | 'warn' | 'error'

export type ConsoleMessage = {
  method: ConsoleMethod
  values: string[]
}

export type TestRunStatus = 'passed' | 'failed' | 'error' | 'timeout'

export type TestRunResult = {
  name: string
  status: TestRunStatus
  expected: string
  actual: string
  durationMs: number
  logs: ConsoleMessage[]
  error?: string
}

export type CodeRunStatus = 'passed' | 'failed' | 'error' | 'timeout'

export type CodeRunResult = {
  status: CodeRunStatus
  durationMs: number
  tests: TestRunResult[]
  logs: ConsoleMessage[]
  error?: string
}

export type CodeRunInput = {
  code: string
  functionName: string
  tests: TestCase[]
  timeoutMs?: number
}

export type RuntimeWorkerInput = CodeRunInput

export type RuntimeWorkerRequest = {
  type: 'run'
  requestId: string
  input: RuntimeWorkerInput
}

export type RuntimeWorkerResponse =
  | {
      type: 'result'
      requestId: string
      result: CodeRunResult
    }
  | {
      type: 'error'
      requestId: string
      error: string
    }
