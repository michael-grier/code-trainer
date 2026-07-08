import { describe, expect, it } from 'vitest'

import type { CodeProblem, DebugProblem } from '@/curriculum/types'

import { getProblemStarterCode } from './codeRunner'

describe('code runner helpers', () => {
  it('reads starter code from code problems', () => {
    const problem: CodeProblem = {
      id: 'practice',
      kind: 'code',
      title: 'Practice',
      prompt: 'Prompt',
      completionMode: 'all-tests-pass',
      functionName: 'solve',
      starter: 'export function solve() {\n  return true\n}\n',
      tests: [],
    }

    expect(getProblemStarterCode(problem)).toContain('export function')
  })

  it('reads broken code from debug problems', () => {
    const problem: DebugProblem = {
      id: 'debug',
      kind: 'debug',
      title: 'Debug',
      prompt: 'Prompt',
      completionMode: 'all-tests-pass',
      functionName: 'solve',
      brokenCode: 'export function solve() {\n  return false\n}\n',
      tests: [],
    }

    expect(getProblemStarterCode(problem)).toContain('false')
  })
})
