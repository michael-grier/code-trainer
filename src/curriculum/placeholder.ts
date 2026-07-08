import type { ComponentType } from 'react'

import type { Lesson } from '@/curriculum/types'

type PlaceholderLessonOptions = {
  slug: string
  title: string
  summary: string
  track: string
  order: number
  concept: ComponentType
}

export function createPlaceholderLesson({
  concept,
  order,
  slug,
  summary,
  title,
  track,
}: PlaceholderLessonOptions): Lesson {
  const functionName = `solve${toPascalCase(slug)}`

  return {
    slug,
    title,
    summary,
    track,
    order,
    concept,
    problems: [
      {
        id: 'foundation',
        kind: 'code',
        completionMode: 'all-tests-pass',
        title: `${title}: Foundation`,
        prompt:
          'Placeholder auto-graded exercise. The content pass will replace this with a focused implementation problem for the lesson concept.',
        estimatedMinutes: 12,
        functionName,
        starter: `export function ${functionName}(input: string): string {\n  return input\n}\n`,
        tests: [
          {
            name: 'returns the provided value',
            args: ['ready'],
            expected: 'ready',
          },
        ],
      },
      {
        id: 'applied',
        kind: 'written',
        completionMode: 'submitted-with-reference-review',
        title: `${title}: Applied reasoning`,
        prompt:
          'Explain how you would recognize this topic in an interview prompt and what first implementation choice you would make.',
        estimatedMinutes: 8,
        starter: '',
        referenceAnswer:
          'A strong answer names the problem signal, states the first useful data structure or abstraction, and calls out one edge case to test.',
      },
      {
        id: 'interview-depth',
        kind: 'design',
        completionMode: 'submitted-with-rubric-review',
        title: `${title}: Interview-depth review`,
        prompt:
          'Use this structured review to connect the lesson topic to tradeoffs, edge cases, and production-quality judgment.',
        estimatedMinutes: 15,
        scenario: `You are asked to apply ${title.toLowerCase()} in a realistic interview setting. Outline the constraints, implementation plan, and tradeoffs you would discuss.`,
        sections: [
          {
            id: 'requirements',
            type: 'short-answer',
            label: 'Requirements',
            prompt: 'What inputs, outputs, constraints, and edge cases matter?',
          },
          {
            id: 'approach',
            type: 'short-answer',
            label: 'Approach',
            prompt: 'What implementation strategy would you choose first?',
          },
          {
            id: 'tradeoffs',
            type: 'tradeoff',
            label: 'Tradeoffs',
            prompt: 'Which tradeoff would you discuss with the interviewer?',
            options: ['Runtime', 'Memory', 'Simplicity', 'Extensibility'],
          },
        ],
        rubric: [
          {
            id: 'constraints',
            label: 'Constraints covered',
            description: 'Identifies relevant input limits and edge cases.',
          },
          {
            id: 'tradeoffs',
            label: 'Tradeoffs explained',
            description: 'Explains why the chosen approach fits the problem.',
          },
        ],
        referenceAnswer:
          'A complete review states assumptions, chooses an approach, tests edge cases, and explains the main complexity or design tradeoff.',
      },
    ],
    approaches: {
      foundation: [
        {
          name: 'Placeholder reference',
          code: `export function ${functionName}(input: string): string {\n  return input\n}\n`,
          explanation:
            'This placeholder approach keeps the lesson buildable until the real curriculum content is authored.',
          complexity: 'O(1) for the placeholder behavior.',
        },
      ],
    },
  }
}

function toPascalCase(value: string) {
  return value
    .split('-')
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase() + part.slice(1))
    .join('')
}
