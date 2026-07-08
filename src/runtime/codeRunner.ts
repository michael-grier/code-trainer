import type {
  CodeProblem,
  DebugProblem,
  RefactorProblem,
} from '@/curriculum/types'

import { runTypeScriptTests } from './jsRunner'
import type { CodeRunInput, CodeRunResult } from './types'

type RunnableProblem = CodeProblem | DebugProblem | RefactorProblem

export async function runCode(input: CodeRunInput): Promise<CodeRunResult> {
  return runTypeScriptTests(input)
}

export function getProblemStarterCode(problem: RunnableProblem) {
  if (problem.kind === 'debug') {
    return problem.brokenCode
  }

  return problem.starter
}

export type { CodeRunInput, CodeRunResult } from './types'
