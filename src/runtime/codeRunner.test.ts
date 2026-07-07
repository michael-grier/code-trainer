import { describe, expect, it } from 'vitest'

import type { CodeProblem, DebugProblem } from '@/curriculum/types'

import {
  getProblemDefaultLanguage,
  getProblemStarterCode,
  getSupportedLanguages,
} from './codeRunner'

describe('code runner helpers', () => {
  it('reads starter code from code problems', () => {
    const problem: CodeProblem = {
      id: 'practice',
      kind: 'code',
      title: 'Practice',
      prompt: 'Prompt',
      completionMode: 'all-tests-pass',
      functionName: 'solve',
      starter: {
        py: 'def solve():\n    return True\n',
        ts: 'export function solve() {\n  return true\n}\n',
      },
      tests: [],
    }

    expect(getProblemStarterCode(problem, 'ts')).toContain('export function')
    expect(getProblemDefaultLanguage(problem)).toBe('ts')
    expect(getSupportedLanguages(problem)).toEqual(['ts', 'py'])
  })

  it('reads broken code from debug problems', () => {
    const problem: DebugProblem = {
      id: 'debug',
      kind: 'debug',
      title: 'Debug',
      prompt: 'Prompt',
      completionMode: 'all-tests-pass',
      functionName: 'solve',
      brokenCode: {
        ts: 'export function solve() {\n  return false\n}\n',
      },
      tests: [],
      defaultLanguage: 'ts',
    }

    expect(getProblemStarterCode(problem, 'ts')).toContain('false')
    expect(getProblemDefaultLanguage(problem)).toBe('ts')
    expect(getSupportedLanguages(problem)).toEqual(['ts'])
  })
})
