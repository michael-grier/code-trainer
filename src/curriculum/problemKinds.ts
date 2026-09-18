import type { ProblemKind } from '@/curriculum/types'

export const problemKindLabels: Record<ProblemKind, string> = {
  code: 'Code',
  debug: 'Debug',
  refactor: 'Refactor',
  'react-code': 'React',
  trace: 'Trace',
  written: 'Written',
  design: 'Design',
}

export const problemKindDescriptions: Record<ProblemKind, string> = {
  code: 'Implement a function against hidden tests and type checks.',
  debug: 'Find and fix the bug in code that already runs.',
  refactor: 'Reshape working code to meet stated goals and static checks.',
  'react-code': 'Build a component that passes interaction tests.',
  trace: 'Predict output and final values without running the code.',
  written: 'Explain a concept, then compare against a reference answer.',
  design: 'Work through a system design scenario with a rubric.',
}

export const problemKinds = Object.keys(problemKindLabels) as ProblemKind[]

export function isProblemKind(value: string | undefined): value is ProblemKind {
  return problemKinds.includes(value as ProblemKind)
}
