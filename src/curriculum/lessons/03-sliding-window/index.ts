import Concept from './concept.mdx'

import type { Lesson } from '../../types'

export const lesson: Lesson = {
  slug: 'sliding-window',
  title: 'Sliding Window',
  summary: 'Track moving ranges to solve contiguous sequence problems efficiently.',
  track: 'algorithms',
  order: 3,
  concept: Concept,
  problems: [
    {
      id: 'max-fixed-window-sum',
      kind: 'code',
      completionMode: 'all-tests-pass',
      title: 'Maximum fixed-window sum',
      prompt:
        'Implement `maxFixedWindowSum`. Given an array of numbers and a positive window size `k`, return the largest sum of any contiguous window of exactly `k` values. Return null when `k` is not a valid window size. Example: `maxFixedWindowSum([2, 1, 5, 1, 3, 2], 3)` returns `9` for the window `[5, 1, 3]`.',
      estimatedMinutes: 12,
      functionName: 'maxFixedWindowSum',
      starter: `export function maxFixedWindowSum(nums: number[], k: number): number | null {
  return null
}

console.log(maxFixedWindowSum([2, 1, 5, 1, 3, 2], 3))
`,
      tests: [
        {
          name: 'finds the best middle window',
          args: [[2, 1, 5, 1, 3, 2], 3],
          expected: 9,
        },
        {
          name: 'finds an edge window',
          args: [[4, 2, 1], 2],
          expected: 6,
        },
        {
          name: 'handles negative sums',
          args: [[-3, -2, -5, -1], 2],
          expected: -5,
        },
        {
          name: 'handles a one-item window',
          args: [[5], 1],
          expected: 5,
        },
        {
          name: 'rejects an oversized window',
          args: [[1, 2], 3],
          expected: null,
        },
        {
          name: 'rejects a non-positive window',
          args: [[1, 2, 3], 0],
          expected: null,
        },
      ],
    },
    {
      id: 'longest-unique-substring',
      kind: 'code',
      completionMode: 'all-tests-pass',
      title: 'Longest unique substring',
      prompt:
        'Implement `longestUniqueSubstring`. Given a string, return the length of the longest contiguous substring that contains no repeated characters. Example: `longestUniqueSubstring("abcabcbb")` returns `3` for `"abc"`.',
      estimatedMinutes: 16,
      functionName: 'longestUniqueSubstring',
      starter: `export function longestUniqueSubstring(input: string): number {
  return 0
}

console.log(longestUniqueSubstring('abcabcbb'))
`,
      tests: [
        {
          name: 'finds a repeating pattern',
          args: ['abcabcbb'],
          expected: 3,
        },
        {
          name: 'handles all repeated characters',
          args: ['bbbbb'],
          expected: 1,
        },
        {
          name: 'handles a duplicate inside the window',
          args: ['pwwkew'],
          expected: 3,
        },
        {
          name: 'handles empty strings',
          args: [''],
          expected: 0,
        },
        {
          name: 'handles a late best window',
          args: ['abbaxyz'],
          expected: 5,
        },
      ],
    },
    {
      id: 'minimum-target-subarray',
      kind: 'code',
      completionMode: 'all-tests-pass',
      title: 'Minimum target subarray',
      prompt:
        'Implement `minSubarrayLengthAtLeast`. Given an array of positive numbers and a positive target, return the length of the shortest contiguous subarray with sum greater than or equal to the target. Return 0 when no such subarray exists. Example: `minSubarrayLengthAtLeast([2, 3, 1, 2, 4, 3], 7)` returns `2` for `[4, 3]`.',
      estimatedMinutes: 18,
      functionName: 'minSubarrayLengthAtLeast',
      starter: `export function minSubarrayLengthAtLeast(
  nums: number[],
  target: number,
): number {
  return 0
}

console.log(minSubarrayLengthAtLeast([2, 3, 1, 2, 4, 3], 7))
`,
      tests: [
        {
          name: 'finds the shortest working window',
          args: [[2, 3, 1, 2, 4, 3], 7],
          expected: 2,
        },
        {
          name: 'uses a single large value',
          args: [[1, 4, 4], 4],
          expected: 1,
        },
        {
          name: 'returns 0 when no window reaches target',
          args: [[1, 1, 1, 1], 5],
          expected: 0,
        },
        {
          name: 'shrinks multiple times',
          args: [[1, 2, 3, 4, 5], 11],
          expected: 3,
        },
        {
          name: 'handles empty arrays',
          args: [[], 3],
          expected: 0,
        },
      ],
    },
    {
      id: 'window-invariant-review',
      kind: 'written',
      completionMode: 'submitted-with-reference-review',
      title: 'Explain the window invariant',
      prompt:
        'Explain how you would decide whether a problem needs a fixed-size window or a variable-size window. Include the invariant you would maintain and the condition that tells you when to shrink the window.',
      estimatedMinutes: 8,
      starter:
        'I would first look for whether the prompt gives a fixed size or a validity rule...',
      referenceAnswer:
        'A strong answer separates fixed-size windows from variable-size windows. Fixed-size windows apply when the prompt gives a required length such as k; the invariant is that the tracked state, such as a sum, exactly describes the last k contiguous values. Variable-size windows apply when the prompt gives a validity rule, such as no duplicate characters or sum at least target. The window grows by moving right, then shrinks while the rule is broken or while the rule remains satisfied and a smaller window may be possible. The answer should mention that sliding windows require contiguous ranges and that assumptions such as positive numbers are part of the correctness proof for target-sum shrink logic.',
      rubric: [
        {
          id: 'fixed-vs-variable',
          label: 'Distinguishes window types',
          description:
            'Explains when fixed-size and variable-size windows are appropriate.',
        },
        {
          id: 'invariant',
          label: 'Names the invariant',
          description:
            'States what tracked state must describe about the current window.',
        },
        {
          id: 'shrink-condition',
          label: 'Explains shrinking',
          description:
            'Identifies the condition that moves the left edge and why it is safe.',
        },
      ],
    },
  ],
  approaches: {
    'max-fixed-window-sum': [
      {
        name: 'Rolling sum',
        code: `export function maxFixedWindowSum(nums: number[], k: number): number | null {
  // Reject window sizes that cannot form one full window.
  if (k <= 0 || k > nums.length) {
    return null
  }

  // windowSum tracks the current k-sized window once it exists.
  let windowSum = 0
  let best = Number.NEGATIVE_INFINITY

  for (let right = 0; right < nums.length; right += 1) {
    // Grow the window by including the new right value.
    windowSum += nums[right]

    if (right >= k) {
      // Shrink back to size k by removing the value that fell out.
      windowSum -= nums[right - k]
    }

    if (right >= k - 1) {
      // Now the window is exactly size k, so it can update the answer.
      best = Math.max(best, windowSum)
    }
  }

  return best
}
`,
        explanation:
          'Maintain the sum of the current contiguous window. Each step adds the new right value, removes the value that fell out of the fixed-size window, and updates the answer only after the window has exactly k values.',
        complexity: 'O(n) time and O(1) extra space.',
      },
    ],
    'longest-unique-substring': [
      {
        name: 'Shrink duplicates',
        code: `export function longestUniqueSubstring(input: string): number {
  // seen represents the characters in the current window.
  const seen = new Set<string>()
  let left = 0
  let best = 0

  for (let right = 0; right < input.length; right += 1) {
    // Try to add the next character on the right.
    const char = input[right]

    while (seen.has(char)) {
      // Move left until adding char would not create a duplicate.
      seen.delete(input[left])
      left += 1
    }

    // The window is valid again, so include char and measure it.
    seen.add(char)
    best = Math.max(best, right - left + 1)
  }

  return best
}
`,
        explanation:
          'The Set represents exactly the current window. When the next character already exists in the Set, shrink from the left until adding that character preserves the no-duplicates invariant.',
        complexity: 'O(n) time and O(k) space, where k is the number of distinct characters in the window.',
      },
    ],
    'minimum-target-subarray': [
      {
        name: 'Shrink while valid',
        code: `export function minSubarrayLengthAtLeast(
  nums: number[],
  target: number,
): number {
  // sum tracks the current [left, right] window.
  let left = 0
  let sum = 0
  let best = Number.POSITIVE_INFINITY

  for (let right = 0; right < nums.length; right += 1) {
    // Grow the window until it reaches or passes the target.
    sum += nums[right]

    while (sum >= target) {
      // This window reaches the target, so record its length.
      best = Math.min(best, right - left + 1)

      // Then shrink from the left to look for a smaller valid window.
      sum -= nums[left]
      left += 1
    }
  }

  // If no valid window was recorded, report 0.
  return best === Number.POSITIVE_INFINITY ? 0 : best
}
`,
        explanation:
          'Positive numbers make the shrink rule valid: removing from the left cannot increase the sum. Once the window reaches the target, every shrink attempts to find a smaller valid window.',
        complexity: 'O(n) time and O(1) extra space.',
      },
    ],
  },
}
