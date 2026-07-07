import type {
  CodeProblem,
  DebugProblem,
  Language,
  RefactorProblem,
} from '@/curriculum/types'

import { runTypeScriptTests } from './jsRunner'
import { runPythonTests } from './pyRunner'
import type { CodeRunInput, CodeRunResult } from './types'

type RunnableProblem = CodeProblem | DebugProblem | RefactorProblem

export async function runCode(input: CodeRunInput): Promise<CodeRunResult> {
  const { language, ...workerInput } = input

  if (language === 'py') {
    return runPythonTests(workerInput)
  }

  return runTypeScriptTests(workerInput)
}

export function getProblemStarterCode(
  problem: RunnableProblem,
  language: Language,
) {
  if (problem.kind === 'debug') {
    return problem.brokenCode[language] ?? ''
  }

  return problem.starter[language] ?? ''
}

export function getProblemDefaultLanguage(problem: RunnableProblem): Language {
  const sourceByLanguage =
    problem.kind === 'debug' ? problem.brokenCode : problem.starter

  return problem.defaultLanguage ?? (sourceByLanguage.ts ? 'ts' : 'py')
}

export function getSupportedLanguages(problem: RunnableProblem): Language[] {
  const sourceByLanguage =
    problem.kind === 'debug' ? problem.brokenCode : problem.starter
  const languages: Language[] = []

  if (sourceByLanguage.ts) {
    languages.push('ts')
  }

  if (sourceByLanguage.py) {
    languages.push('py')
  }

  return languages
}

export type { CodeRunInput, CodeRunResult } from './types'
