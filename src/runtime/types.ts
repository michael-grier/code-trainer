import type { Language, TestCase } from '@/curriculum/types'

export const DEFAULT_RUN_TIMEOUT_MS = 2_000
export const DEFAULT_PYTHON_RUN_TIMEOUT_MS = 30_000
export const PYODIDE_VERSION = '0.27.0'
export const DEFAULT_PYODIDE_INDEX_URL = `https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full`

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
  language: Language
  status: CodeRunStatus
  durationMs: number
  tests: TestRunResult[]
  logs: ConsoleMessage[]
  error?: string
}

export type CodeRunInput = {
  language: Language
  code: string
  functionName: string
  tests: TestCase[]
  timeoutMs?: number
  pyodideIndexUrl?: string
}

export type RuntimeWorkerInput = Omit<CodeRunInput, 'language'>

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
