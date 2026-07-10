import Concept from './concept.mdx'

import type { Lesson } from '../../types'

export const lesson: Lesson = {
  slug: 'queues-and-deques',
  title: 'Queues and Deques',
  summary: 'Process values in arrival order or remove candidates from both ends when later values make them unnecessary.',
  track: 'algorithms',
  order: 8,
  concept: Concept,
  problems: [
    {
      id: 'round-robin-order',
      kind: 'code',
      completionMode: 'all-tests-pass',
      title: 'Simulate round-robin processing',
      prompt:
        'Implement `roundRobinOrder`. Each job has an `id` and a positive integer `duration`. Process the first queued job for at most the positive integer `quantum`, record its ID, and add it to the back of the queue if work remains. Return the IDs in processing order. Do not modify the input jobs. Example: `roundRobinOrder([{ id: "a", duration: 5 }, { id: "b", duration: 2 }, { id: "c", duration: 3 }], 2)` returns `["a", "b", "c", "a", "c", "a"]`.',
      estimatedMinutes: 13,
      functionName: 'roundRobinOrder',
      starter: `type Job = {
  id: string
  duration: number
}

export function roundRobinOrder(jobs: Job[], quantum: number): string[] {
  return []
}

console.log(roundRobinOrder([
  { id: 'a', duration: 5 },
  { id: 'b', duration: 2 },
  { id: 'c', duration: 3 },
], 2))
`,
      tests: [
        {
          name: 'processes unfinished jobs again',
          args: [[
            { id: 'a', duration: 5 },
            { id: 'b', duration: 2 },
            { id: 'c', duration: 3 },
          ], 2],
          expected: ['a', 'b', 'c', 'a', 'c', 'a'],
        },
        {
          name: 'processes one job for several turns',
          args: [[{ id: 'x', duration: 5 }], 2],
          expected: ['x', 'x', 'x'],
        },
        {
          name: 'completes short jobs in arrival order',
          args: [[
            { id: 'a', duration: 1 },
            { id: 'b', duration: 2 },
            { id: 'c', duration: 1 },
          ], 2],
          expected: ['a', 'b', 'c'],
        },
        {
          name: 'handles a quantum larger than every job',
          args: [[
            { id: 'first', duration: 3 },
            { id: 'second', duration: 4 },
          ], 10],
          expected: ['first', 'second'],
        },
        {
          name: 'preserves FIFO order when quantum is one',
          args: [[
            { id: 'a', duration: 2 },
            { id: 'b', duration: 1 },
          ], 1],
          expected: ['a', 'b', 'a'],
        },
        {
          name: 'handles an empty queue',
          args: [[], 3],
          expected: [],
        },
      ],
    },
    {
      id: 'sliding-window-maximum',
      kind: 'code',
      completionMode: 'all-tests-pass',
      title: 'Find each sliding-window maximum',
      prompt:
        'Implement `slidingWindowMaximum`. Given numbers and a positive window size `k`, return the maximum value in every contiguous window of exactly `k` values. Return an empty array when `k` is not a valid window size. Use a deque of indexes whose values decrease from front to back. Example: `slidingWindowMaximum([1, 3, -1, -3, 5, 3, 6, 7], 3)` returns `[3, 3, 5, 5, 6, 7]`.',
      estimatedMinutes: 18,
      functionName: 'slidingWindowMaximum',
      starter: `export function slidingWindowMaximum(
  nums: number[],
  k: number,
): number[] {
  return []
}

console.log(slidingWindowMaximum([1, 3, -1, -3, 5, 3, 6, 7], 3))
`,
      tests: [
        {
          name: 'finds maxima across changing windows',
          args: [[1, 3, -1, -3, 5, 3, 6, 7], 3],
          expected: [3, 3, 5, 5, 6, 7],
        },
        {
          name: 'handles a one-value window',
          args: [[4, 2, 8], 1],
          expected: [4, 2, 8],
        },
        {
          name: 'handles a window spanning the full input',
          args: [[4, 2, 8], 3],
          expected: [8],
        },
        {
          name: 'handles duplicate maximum values',
          args: [[5, 5, 4, 5], 2],
          expected: [5, 5, 5],
        },
        {
          name: 'handles negative values',
          args: [[-4, -2, -5, -1], 2],
          expected: [-2, -2, -1],
        },
        {
          name: 'rejects an invalid window size',
          args: [[1, 2], 3],
          expected: [],
        },
        {
          name: 'rejects a non-positive window size',
          args: [[1, 2], 0],
          expected: [],
        },
      ],
    },
    {
      id: 'shortest-target-subarray',
      kind: 'code',
      completionMode: 'all-tests-pass',
      title: 'Find the shortest target subarray',
      prompt:
        'Implement `shortestSubarrayAtLeastTarget`. Given numbers that may be positive, negative, or zero and a positive target, return the length of the shortest non-empty contiguous subarray with sum greater than or equal to the target. Return `0` if none exists. Use prefix sums and a monotonic deque of prefix indexes. Example: `shortestSubarrayAtLeastTarget([2, -1, 2], 3)` returns `3`.',
      estimatedMinutes: 23,
      functionName: 'shortestSubarrayAtLeastTarget',
      starter: `export function shortestSubarrayAtLeastTarget(
  nums: number[],
  target: number,
): number {
  return 0
}

console.log(shortestSubarrayAtLeastTarget([2, -1, 2], 3))
`,
      tests: [
        {
          name: 'uses the full array when required',
          args: [[2, -1, 2], 3],
          expected: 3,
        },
        {
          name: 'finds one matching value',
          args: [[1], 1],
          expected: 1,
        },
        {
          name: 'returns zero when no subarray qualifies',
          args: [[1, 2], 4],
          expected: 0,
        },
        {
          name: 'handles a negative value inside the input',
          args: [[84, -37, 32, 40, 95], 167],
          expected: 3,
        },
        {
          name: 'finds a late single-value answer',
          args: [[5, -10, 6], 6],
          expected: 1,
        },
        {
          name: 'handles an empty array',
          args: [[], 5],
          expected: 0,
        },
      ],
    },
    {
      id: 'queue-deque-review',
      kind: 'written',
      completionMode: 'submitted-with-reference-review',
      title: 'Choose a queue or deque',
      prompt:
        'Compare a FIFO queue with a monotonic deque. Explain what each stored entry represents, which end each operation uses, why `Array.shift()` can make a TypeScript solution slower, and why removing a deque entry cannot remove a future answer.',
      estimatedMinutes: 9,
      starter:
        'A FIFO queue stores items that must be processed in arrival order. I remove from the front and add to the back.',
      referenceAnswer:
        'A FIFO queue stores pending work in arrival order. Add new work at the back and process the oldest work at the front. In JavaScript, Array.shift() reindexes the remaining elements and can cost O(n), so an array with a numeric head index keeps each queue operation O(1). A monotonic deque stores only candidates that can still affect a future answer. For a sliding maximum, indexes at the front are removed when they leave the window, and indexes at the back are removed when a later value is greater than or equal to their value. The later value remains available for at least as long and is no smaller, so the removed value cannot be a future maximum. Each index is added once and removed at most once, which gives O(n) total deque work.',
      rubric: [
        {
          id: 'entry-meaning',
          label: 'Defines stored entries',
          description:
            'States what a queue item or deque index represents.',
        },
        {
          id: 'ends',
          label: 'Explains both ends',
          description:
            'Identifies which operations read or modify the front and back.',
        },
        {
          id: 'typescript-cost',
          label: 'Avoids shift cost',
          description:
            'Explains why a head index avoids repeated array reindexing.',
        },
        {
          id: 'removal-proof',
          label: 'Justifies deque removal',
          description:
            'Explains why an expired or dominated candidate cannot affect a later answer.',
        },
      ],
    },
  ],
  approaches: {
    'round-robin-order': [
      {
        name: 'Queue with a head index',
        code: `type Job = {
  id: string
  duration: number
}

export function roundRobinOrder(jobs: Job[], quantum: number): string[] {
  // Copy each job because remaining duration changes during the simulation.
  const queue = jobs.map((job) => ({ ...job }))
  const order: string[] = []
  let head = 0

  while (head < queue.length) {
    // Read the oldest queued job, then advance the queue front.
    const job = queue[head]
    head += 1
    order.push(job.id)

    const remaining = job.duration - quantum

    if (remaining > 0) {
      // Add unfinished work to the back as a new queue entry.
      queue.push({ id: job.id, duration: remaining })
    }
  }

  return order
}
`,
        explanation:
          'Use a head index to process queue entries without calling shift. Append a new entry only when the processed job still has remaining work.',
        complexity:
          'O(t) time and O(t) space, where t is the total number of processing turns.',
      },
    ],
    'sliding-window-maximum': [
      {
        name: 'Decreasing deque of indexes',
        code: `export function slidingWindowMaximum(
  nums: number[],
  k: number,
): number[] {
  if (k <= 0 || k > nums.length) {
    return []
  }

  // Active deque entries are stored in indexes [front, back).
  const deque = new Array<number>(nums.length)
  const result: number[] = []
  let front = 0
  let back = 0

  for (let right = 0; right < nums.length; right += 1) {
    // Remove indexes that are left of the current window.
    if (front < back && deque[front] <= right - k) {
      front += 1
    }

    // Remove values that cannot be a maximum after nums[right] arrives.
    while (front < back && nums[deque[back - 1]] <= nums[right]) {
      back -= 1
    }

    deque[back] = right
    back += 1

    if (right >= k - 1) {
      // The front index stores the maximum for this complete window.
      result.push(nums[deque[front]])
    }
  }

  return result
}
`,
        explanation:
          'Store indexes in decreasing value order. Remove expired indexes from the front and smaller or equal values from the back. The front then identifies the maximum of each complete window.',
        complexity: 'O(n) time and O(n) space for the index storage and output.',
      },
    ],
    'shortest-target-subarray': [
      {
        name: 'Increasing deque of prefix indexes',
        code: `export function shortestSubarrayAtLeastTarget(
  nums: number[],
  target: number,
): number {
  const prefix = new Array<number>(nums.length + 1).fill(0)

  for (let index = 0; index < nums.length; index += 1) {
    prefix[index + 1] = prefix[index] + nums[index]
  }

  const deque = new Array<number>(prefix.length)
  let front = 0
  let back = 0
  let best = Number.POSITIVE_INFINITY

  for (let right = 0; right < prefix.length; right += 1) {
    while (
      front < back &&
      prefix[right] - prefix[deque[front]] >= target
    ) {
      // This front index creates a valid subarray ending at right.
      best = Math.min(best, right - deque[front])
      front += 1
    }

    while (front < back && prefix[deque[back - 1]] >= prefix[right]) {
      // The current prefix is smaller and later, so the back cannot be better.
      back -= 1
    }

    deque[back] = right
    back += 1
  }

  return best === Number.POSITIVE_INFINITY ? 0 : best
}
`,
        explanation:
          'A valid subarray is the difference between the current prefix and an earlier prefix. Remove valid starts from the front while measuring their lengths. Remove larger earlier prefixes from the back because the smaller current prefix gives a larger future difference and a shorter future length.',
        complexity: 'O(n) time and O(n) space.',
      },
    ],
  },
}
