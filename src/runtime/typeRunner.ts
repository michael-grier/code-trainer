import type { TypeCheckInput, TypeCheckResult } from './typeGrader'
import {
  createTypeCheckRunnerRequest,
  executeRunnerRequest,
  RunnerSandboxTimeoutError,
} from './sandboxClient'

const TYPE_CHECK_TIMEOUT_MS = 15_000

export async function runTypeCheckInWorker(
  input: TypeCheckInput,
): Promise<TypeCheckResult | { error: string }> {
  try {
    return await executeRunnerRequest(
      createTypeCheckRunnerRequest(input),
      TYPE_CHECK_TIMEOUT_MS,
    )
  } catch (error) {
    return {
      error:
        error instanceof RunnerSandboxTimeoutError
          ? `Type checking timed out after ${TYPE_CHECK_TIMEOUT_MS}ms.`
          : error instanceof Error
            ? error.message
            : 'Type checking failed.',
    }
  }
}
