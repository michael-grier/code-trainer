import Concept from './concept.mdx'

import type { Lesson } from '../../types'

export const lesson: Lesson = {
  slug: 'dynamic-programming-fundamentals',
  title: 'Dynamic Programming Fundamentals',
  summary:
    'Define one reusable subproblem result, connect it to smaller results, and calculate states in dependency order.',
  track: 'algorithms',
  order: 16,
  concept: Concept,
  problems: [
    {
      id: 'count-climbing-ways',
      kind: 'code',
      completionMode: 'all-tests-pass',
      title: 'Count ways to climb steps',
      prompt:
        'Implement `countClimbingWays`. Starting below a staircase with `stepCount` steps, each move climbs either `1` or `2` steps. Return the number of different move sequences that reach the top. `stepCount` is a nonnegative integer, and climbing zero steps has one empty sequence. Example: `countClimbingWays(5)` returns `8`.',
      estimatedMinutes: 13,
      functionName: 'countClimbingWays',
      starter: `export function countClimbingWays(stepCount: number): number {
  return 0
}

console.log(countClimbingWays(5))
`,
      tests: [
        { name: 'counts five steps', args: [5], expected: 8 },
        { name: 'counts three steps', args: [3], expected: 3 },
        { name: 'counts two steps', args: [2], expected: 2 },
        { name: 'handles one step', args: [1], expected: 1 },
        { name: 'counts the empty climb', args: [0], expected: 1 },
        { name: 'counts ten steps', args: [10], expected: 89 },
      ],
    },
    {
      id: 'maximum-non-adjacent-sum',
      kind: 'code',
      completionMode: 'all-tests-pass',
      title: 'Maximize a sum without adjacent values',
      prompt:
        'Implement `maximumNonAdjacentSum`. `values` contains nonnegative numbers. Return the largest sum formed by selecting values at indexes that are not next to each other. Selecting no values is allowed. Example: `maximumNonAdjacentSum([2, 7, 9, 3, 1])` returns `12` by selecting `2`, `9`, and `1`.',
      estimatedMinutes: 17,
      functionName: 'maximumNonAdjacentSum',
      starter: `export function maximumNonAdjacentSum(values: number[]): number {
  return 0
}

console.log(maximumNonAdjacentSum([2, 7, 9, 3, 1]))
`,
      tests: [
        {
          name: 'combines separated values',
          args: [[2, 7, 9, 3, 1]],
          expected: 12,
        },
        {
          name: 'chooses the best values near both ends',
          args: [[2, 1, 4, 9]],
          expected: 11,
        },
        {
          name: 'chooses both large endpoint values',
          args: [[10, 1, 1, 10]],
          expected: 20,
        },
        {
          name: 'handles repeated values',
          args: [[2, 2, 2]],
          expected: 4,
        },
        { name: 'handles one value', args: [[5]], expected: 5 },
        { name: 'handles no values', args: [[]], expected: 0 },
      ],
    },
    {
      id: 'minimum-coins-for-amount',
      kind: 'code',
      completionMode: 'all-tests-pass',
      title: 'Find the minimum number of coins',
      prompt:
        'Implement `minimumCoinsForAmount`. `coins` contains distinct positive integer denominations, and each denomination may be used any number of times. Return the fewest coins whose values total `amount`, or `-1` when the amount cannot be formed. `amount` is a nonnegative integer. Example: `minimumCoinsForAmount([1, 3, 4], 6)` returns `2` by using two `3` coins.',
      estimatedMinutes: 21,
      functionName: 'minimumCoinsForAmount',
      starter: `export function minimumCoinsForAmount(
  coins: number[],
  amount: number,
): number {
  return -1
}

console.log(minimumCoinsForAmount([1, 3, 4], 6))
`,
      tests: [
        {
          name: 'uses two coins instead of a longer combination',
          args: [[1, 3, 4], 6],
          expected: 2,
        },
        {
          name: 'reports an amount that cannot be formed',
          args: [[2], 3],
          expected: -1,
        },
        {
          name: 'handles a zero amount',
          args: [[2, 5], 0],
          expected: 0,
        },
        {
          name: 'combines several denominations',
          args: [[1, 2, 5, 10], 27],
          expected: 4,
        },
        {
          name: 'reuses one denomination',
          args: [[5, 7], 14],
          expected: 2,
        },
        {
          name: 'does not require denomination one',
          args: [[3, 4], 6],
          expected: 2,
        },
      ],
    },
    {
      id: 'dynamic-programming-state-review',
      kind: 'written',
      completionMode: 'submitted-with-reference-review',
      title: 'Define a dynamic programming state',
      prompt:
        'Explain how you turn a repeated recursive problem into dynamic programming. State what one table entry means, its base case, its transition from smaller states, the order in which states must be calculated, and when a full table can be replaced by a few variables.',
      estimatedMinutes: 10,
      starter:
        'I first define one state in plain language, including exactly which part of the input it represents.',
      referenceAnswer:
        'Start by defining one result such as ways[i] = the number of ways to reach step i, or best[i] = the largest valid sum using indexes through i. Write base cases for the smallest valid inputs. Then express the current state using results for strictly smaller states. Calculate states only after every dependency is available. Memoization starts with recursion and stores results when requested; tabulation starts with base cases and fills results in a chosen order. Both avoid calculating the same state repeatedly. A full table is unnecessary when each new state depends on only a fixed number of earlier states and those older values will never be used again. Keep the few required values in variables, but retain the table when reconstruction or many earlier dependencies are required.',
      rubric: [
        {
          id: 'state-meaning',
          label: 'Defines one state',
          description:
            'States exactly what one stored result means for a specific input position or amount.',
        },
        {
          id: 'base-transition',
          label: 'Provides bases and transition',
          description:
            'Connects the smallest known results to the formula for later results.',
        },
        {
          id: 'dependency-order',
          label: 'Follows dependency order',
          description:
            'Calculates each state only after the states it reads are available.',
        },
        {
          id: 'space-choice',
          label: 'Explains space reduction',
          description:
            'Identifies when only a fixed number of earlier states must be retained.',
        },
      ],
    },
  ],
  approaches: {
    'count-climbing-ways': [
      {
        name: 'Keep the previous two step counts',
        code: `export function countClimbingWays(stepCount: number): number {
  if (stepCount <= 1) {
    return 1
  }

  let twoStepsBack = 1
  let oneStepBack = 1

  for (let step = 2; step <= stepCount; step += 1) {
    // Every route here arrives from one or two steps below.
    const currentWays = oneStepBack + twoStepsBack
    twoStepsBack = oneStepBack
    oneStepBack = currentWays
  }

  return oneStepBack
}
`,
        explanation:
          'A route to step i ends with either a one-step move from i - 1 or a two-step move from i - 2. Only those two earlier counts are needed.',
        complexity: 'O(n) time and O(1) space.',
      },
    ],
    'maximum-non-adjacent-sum': [
      {
        name: 'Compare taking and skipping each value',
        code: `export function maximumNonAdjacentSum(values: number[]): number {
  let bestTwoIndexesBack = 0
  let bestOneIndexBack = 0

  for (const value of values) {
    // Taking this value requires the best result from two indexes back.
    const takeCurrent = bestTwoIndexesBack + value
    const skipCurrent = bestOneIndexBack
    const currentBest = Math.max(takeCurrent, skipCurrent)

    bestTwoIndexesBack = bestOneIndexBack
    bestOneIndexBack = currentBest
  }

  return bestOneIndexBack
}
`,
        explanation:
          'At each index, the best result either skips the current value or takes it and combines it with the best result that cannot include the previous index.',
        complexity: 'O(n) time and O(1) space.',
      },
    ],
    'minimum-coins-for-amount': [
      {
        name: 'Build the best result for every smaller amount',
        code: `export function minimumCoinsForAmount(
  coins: number[],
  amount: number,
): number {
  const minimumCoins = Array<number>(amount + 1).fill(Infinity)
  minimumCoins[0] = 0

  for (let currentAmount = 1; currentAmount <= amount; currentAmount += 1) {
    for (const coin of coins) {
      if (coin <= currentAmount) {
        // Add this coin to the best result for the remaining amount.
        minimumCoins[currentAmount] = Math.min(
          minimumCoins[currentAmount],
          minimumCoins[currentAmount - coin] + 1,
        )
      }
    }
  }

  return minimumCoins[amount] === Infinity ? -1 : minimumCoins[amount]
}
`,
        explanation:
          'Store the fewest coins for every amount from zero upward. Each candidate coin extends an already calculated smaller amount.',
        complexity: 'O(amount × coins.length) time and O(amount) space.',
      },
    ],
  },
}
