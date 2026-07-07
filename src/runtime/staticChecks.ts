import type { StaticCheck } from '@/curriculum/types'

export type StaticCheckResult = StaticCheck & {
  passed: boolean
}

export function runStaticChecks(
  code: string,
  checks: StaticCheck[],
): StaticCheckResult[] {
  return checks.map((check) => ({
    ...check,
    passed: evaluateStaticCheck(code, check),
  }))
}

export function allStaticChecksPassed(results: StaticCheckResult[]) {
  return results.every((result) => result.passed)
}

function evaluateStaticCheck(code: string, check: StaticCheck) {
  if (check.kind === 'forbid-text') {
    return !code.includes(check.text)
  }

  if (check.kind === 'require-text') {
    return code.includes(check.text)
  }

  if (check.kind === 'max-lines') {
    return countCodeLines(code) <= check.max
  }

  if (check.kind === 'no-any') {
    return !/\bany\b/.test(stripCommentsAndStrings(code))
  }

  return check.targets.every((target) => !hasMutation(code, target))
}

function countCodeLines(code: string) {
  return code
    .split(/\r?\n/)
    .filter((line) => line.trim().length > 0).length
}

function hasMutation(code: string, target: string) {
  const escapedTarget = escapeRegExp(target)
  const assignmentPattern = new RegExp(
    `\\b${escapedTarget}(?:\\s*\\[[^\\]]+\\]|\\s*\\.\\s*[A-Za-z_$][\\w$]*)*\\s*(?:[+\\-*/%]?=(?!=|>)|\\+\\+|--)`,
  )
  const mutatorPattern = new RegExp(
    `\\b${escapedTarget}\\s*\\.\\s*(?:add|clear|delete|pop|push|reverse|set|shift|sort|splice|unshift)\\s*\\(`,
  )
  const searchableCode = stripCommentsAndStrings(code)

  return (
    assignmentPattern.test(searchableCode) ||
    mutatorPattern.test(searchableCode)
  )
}

function stripCommentsAndStrings(code: string) {
  return code
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\/\/.*$/gm, '')
    .replace(/(['"`])(?:\\.|(?!\1)[\s\S])*\1/g, '')
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
