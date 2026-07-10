import Concept from './concept.mdx'

import type { Lesson } from '../../types'

export const lesson: Lesson = {
  slug: 'stacks-and-monotonic-stacks',
  title: 'Stacks and Monotonic Stacks',
  summary: 'Store unresolved items in last-in, first-out order and remove them when a later value provides their answer.',
  track: 'algorithms',
  order: 7,
  concept: Concept,
  problems: [
    {
      id: 'validate-brackets',
      kind: 'code',
      completionMode: 'all-tests-pass',
      title: 'Validate nested brackets',
      prompt:
        'Implement `hasValidBrackets`. The input contains only `(`, `)`, `[`, `]`, `{`, and `}`. Return `true` when every opening bracket is closed by the correct bracket in last-opened, first-closed order. An empty string is valid. Example: `hasValidBrackets("{[()]}")` returns `true`, while `hasValidBrackets("([)]")` returns `false`.',
      estimatedMinutes: 12,
      functionName: 'hasValidBrackets',
      starter: `export function hasValidBrackets(input: string): boolean {
  return false
}

console.log(hasValidBrackets('{[()]}'))
`,
      tests: [
        {
          name: 'accepts correctly nested brackets',
          args: ['{[()]}'],
          expected: true,
        },
        {
          name: 'accepts adjacent bracket pairs',
          args: ['()[]{}'],
          expected: true,
        },
        {
          name: 'rejects the wrong closing order',
          args: ['([)]'],
          expected: false,
        },
        {
          name: 'rejects an unmatched opening bracket',
          args: ['(()'],
          expected: false,
        },
        {
          name: 'rejects an unmatched closing bracket',
          args: [']'],
          expected: false,
        },
        {
          name: 'accepts an empty string',
          args: [''],
          expected: true,
        },
      ],
    },
    {
      id: 'days-until-warmer',
      kind: 'code',
      completionMode: 'all-tests-pass',
      title: 'Find the next warmer day',
      prompt:
        'Implement `daysUntilWarmer`. For each daily temperature, return how many days pass before a strictly warmer temperature occurs. Return `0` when no later day is warmer. Use a monotonic stack of unresolved indexes. Example: `daysUntilWarmer([73, 74, 75, 71, 69, 72, 76, 73])` returns `[1, 1, 4, 2, 1, 1, 0, 0]`.',
      estimatedMinutes: 16,
      functionName: 'daysUntilWarmer',
      starter: `export function daysUntilWarmer(temperatures: number[]): number[] {
  return []
}

console.log(daysUntilWarmer([73, 74, 75, 71, 69, 72, 76, 73]))
`,
      tests: [
        {
          name: 'finds several next warmer days',
          args: [[73, 74, 75, 71, 69, 72, 76, 73]],
          expected: [1, 1, 4, 2, 1, 1, 0, 0],
        },
        {
          name: 'handles strictly increasing temperatures',
          args: [[30, 40, 50, 60]],
          expected: [1, 1, 1, 0],
        },
        {
          name: 'handles strictly decreasing temperatures',
          args: [[60, 50, 40, 30]],
          expected: [0, 0, 0, 0],
        },
        {
          name: 'keeps equal temperatures unresolved',
          args: [[70, 70, 71]],
          expected: [2, 1, 0],
        },
        {
          name: 'finds a warmer day after several lower values',
          args: [[50, 40, 30, 60]],
          expected: [3, 2, 1, 0],
        },
        {
          name: 'handles an empty array',
          args: [[]],
          expected: [],
        },
      ],
    },
    {
      id: 'largest-histogram-rectangle',
      kind: 'code',
      completionMode: 'all-tests-pass',
      title: 'Find the largest histogram rectangle',
      prompt:
        'Implement `largestHistogramRectangle`. Each non-negative number is the height of a histogram bar with width `1`. Return the largest rectangular area formed by one or more consecutive bars. Use a monotonic stack that records each height and the earliest index where that height can begin. Example: `largestHistogramRectangle([2, 1, 5, 6, 2, 3])` returns `10` for the two bars with heights `5` and `6`.',
      estimatedMinutes: 22,
      functionName: 'largestHistogramRectangle',
      starter: `export function largestHistogramRectangle(heights: number[]): number {
  return 0
}

console.log(largestHistogramRectangle([2, 1, 5, 6, 2, 3]))
`,
      tests: [
        {
          name: 'finds a rectangle in the middle',
          args: [[2, 1, 5, 6, 2, 3]],
          expected: 10,
        },
        {
          name: 'uses the full width for equal heights',
          args: [[2, 2, 2]],
          expected: 6,
        },
        {
          name: 'finds the best single bar',
          args: [[0, 3, 0]],
          expected: 3,
        },
        {
          name: 'handles two increasing bars',
          args: [[2, 4]],
          expected: 4,
        },
        {
          name: 'handles one bar',
          args: [[7]],
          expected: 7,
        },
        {
          name: 'handles an empty histogram',
          args: [[]],
          expected: 0,
        },
      ],
    },
    {
      id: 'stack-state-review',
      kind: 'written',
      completionMode: 'submitted-with-reference-review',
      title: 'Explain what the stack stores',
      prompt:
        'Compare a stack for nested brackets with a monotonic stack for next-greater values. For each problem, state what one stack entry represents, why entries are removed, how equal values are handled, and why each input item is processed a limited number of times.',
      estimatedMinutes: 9,
      starter:
        'In bracket validation, each stack entry is an opening bracket that has not yet been matched.',
      referenceAnswer:
        'In bracket validation, each entry is an opening bracket without a matching close. A closing bracket must match the most recently added opening bracket because nested pairs close in reverse order. In next-greater problems, each entry is usually an index whose answer has not been found. For daily temperatures, the temperatures at stored indexes are non-increasing. A strictly warmer current value resolves and removes smaller stored values. Equal temperatures remain because the prompt requires a strictly warmer value. Each index is added once and removed at most once, so all stack operations take O(n) time even though a while loop appears inside the for loop.',
      rubric: [
        {
          id: 'entry-meaning',
          label: 'Defines one stack entry',
          description:
            'States what information is stored and which question remains unresolved.',
        },
        {
          id: 'removal-rule',
          label: 'Explains removal',
          description:
            'Explains exactly when the current item provides an answer for a stored item.',
        },
        {
          id: 'equal-values',
          label: 'Handles equal values',
          description:
            'Connects strict or non-strict comparisons to the prompt requirement.',
        },
        {
          id: 'complexity',
          label: 'Explains total work',
          description:
            'Notes that each item is added once and removed at most once.',
        },
      ],
    },
  ],
  approaches: {
    'validate-brackets': [
      {
        name: 'Opening-bracket stack',
        code: `export function hasValidBrackets(input: string): boolean {
  const openingForClosing = new Map<string, string>([
    [')', '('],
    [']', '['],
    ['}', '{'],
  ])
  const openings = new Set(['(', '[', '{'])
  const stack: string[] = []

  for (const bracket of input) {
    if (openings.has(bracket)) {
      // Store this opening bracket until a closing bracket is processed.
      stack.push(bracket)
      continue
    }

    // The latest unmatched opening bracket must match this close.
    if (stack.pop() !== openingForClosing.get(bracket)) {
      return false
    }
  }

  // No opening bracket may remain unmatched.
  return stack.length === 0
}
`,
        explanation:
          'Store unmatched opening brackets. Each closing bracket must match the most recently stored opening bracket, and the stack must be empty after the full input is processed.',
        complexity: 'O(n) time and O(n) space.',
      },
    ],
    'days-until-warmer': [
      {
        name: 'Decreasing stack of indexes',
        code: `export function daysUntilWarmer(temperatures: number[]): number[] {
  const result = new Array<number>(temperatures.length).fill(0)
  const unresolved: number[] = []

  for (let day = 0; day < temperatures.length; day += 1) {
    while (
      unresolved.length > 0 &&
      temperatures[unresolved[unresolved.length - 1]] < temperatures[day]
    ) {
      // The current temperature is the first warmer value for this earlier day.
      const earlierDay = unresolved.pop()!
      result[earlierDay] = day - earlierDay
    }

    // Store this day because no later temperature has been processed yet.
    unresolved.push(day)
  }

  return result
}
`,
        explanation:
          'Store indexes whose next warmer day is unknown. A warmer current value resolves smaller temperatures from the end of the stack. Equal temperatures remain because they do not satisfy the strictly-warmer requirement.',
        complexity: 'O(n) time and O(n) space.',
      },
    ],
    'largest-histogram-rectangle': [
      {
        name: 'Increasing stack with earliest starts',
        code: `export function largestHistogramRectangle(heights: number[]): number {
  // Each entry is [earliest start index, rectangle height].
  const stack: [number, number][] = []
  let best = 0

  for (let index = 0; index <= heights.length; index += 1) {
    // A final zero causes every remaining height to be calculated.
    const height = index === heights.length ? 0 : heights[index]
    let start = index

    while (stack.length > 0 && stack[stack.length - 1][1] > height) {
      const [rectangleStart, rectangleHeight] = stack.pop()!

      // The current index is the first index this height cannot include.
      best = Math.max(best, rectangleHeight * (index - rectangleStart))
      start = rectangleStart
    }

    if (stack.length === 0 || stack[stack.length - 1][1] < height) {
      // This height can begin where the removed taller heights began.
      stack.push([start, height])
    }
  }

  return best
}
`,
        explanation:
          'Store increasing heights with the earliest index where each height can begin. A smaller current height ends every taller rectangle. Reuse the earliest removed start for the current height because the current height can cover those indexes.',
        complexity: 'O(n) time and O(n) space.',
      },
    ],
  },
}
