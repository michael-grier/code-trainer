import Concept from './concept.mdx'

import type { Lesson } from '../../types'

export const lesson: Lesson = {
  slug: 'two-pointers',
  title: 'Two Pointers',
  summary: 'Use paired indexes to scan sorted data, shrink search spaces, and reason about invariants.',
  track: 'algorithms',
  order: 2,
  concept: Concept,
  problems: [
    {
      id: 'sorted-pair-sum',
      kind: 'code',
      completionMode: 'all-tests-pass',
      title: 'Sorted pair sum',
      prompt:
        'Implement `findPairWithSum`. Given a sorted ascending array and a target, return the first pair of values found by the standard inward two-pointer scan. Return null when no pair exists. The two values must come from different indexes.',
      estimatedMinutes: 12,
      functionName: 'findPairWithSum',
      starter: `export function findPairWithSum(
  nums: number[],
  target: number,
): [number, number] | null {
  return null
}
`,
      tests: [
        {
          name: 'finds a pair in the middle',
          args: [[1, 2, 4, 6, 10], 8],
          expected: [2, 6],
        },
        {
          name: 'finds a pair at the edges',
          args: [[1, 3, 5, 7], 8],
          expected: [1, 7],
        },
        {
          name: 'handles negative values',
          args: [[-6, -2, 0, 4, 9], 3],
          expected: [-6, 9],
        },
        {
          name: 'uses different indexes for equal values',
          args: [[2, 2, 3], 4],
          expected: [2, 2],
        },
        {
          name: 'returns null when no pair exists',
          args: [[1, 2, 3], 7],
          expected: null,
        },
      ],
    },
    {
      id: 'dedupe-sorted-array',
      kind: 'code',
      completionMode: 'all-tests-pass',
      title: 'Dedupe sorted array',
      prompt:
        'Implement `dedupeSorted`. Given a sorted ascending array, return a new array containing each distinct value once, in order. Do not use a Set; practice a read pointer and a write pointer instead.',
      estimatedMinutes: 14,
      functionName: 'dedupeSorted',
      starter: `export function dedupeSorted(nums: number[]): number[] {
  return nums
}
`,
      tests: [
        {
          name: 'removes repeated groups',
          args: [[1, 1, 2, 2, 3]],
          expected: [1, 2, 3],
        },
        {
          name: 'handles all duplicates',
          args: [[4, 4, 4, 4]],
          expected: [4],
        },
        {
          name: 'keeps already unique values',
          args: [[1, 2, 3, 4]],
          expected: [1, 2, 3, 4],
        },
        {
          name: 'handles negative values',
          args: [[-2, -2, -1, 0, 0, 3]],
          expected: [-2, -1, 0, 3],
        },
        {
          name: 'handles empty arrays',
          args: [[]],
          expected: [],
        },
      ],
    },
    {
      id: 'container-most-water',
      kind: 'code',
      completionMode: 'all-tests-pass',
      title: 'Container with most water',
      prompt:
        'Implement `maxContainerArea`. Each number is a vertical wall height. Choose two indexes and return the largest area between them. Move inward from both ends, and use the shorter wall to decide which pointer can still improve the answer.',
      estimatedMinutes: 20,
      functionName: 'maxContainerArea',
      starter: `export function maxContainerArea(heights: number[]): number {
  return 0
}
`,
      tests: [
        {
          name: 'matches the classic example',
          args: [[1, 8, 6, 2, 5, 4, 8, 3, 7]],
          expected: 49,
        },
        {
          name: 'handles two walls',
          args: [[1, 1]],
          expected: 1,
        },
        {
          name: 'finds equal edge walls',
          args: [[4, 3, 2, 1, 4]],
          expected: 16,
        },
        {
          name: 'finds a narrow best area',
          args: [[1, 2, 1]],
          expected: 2,
        },
        {
          name: 'handles fewer than two walls',
          args: [[5]],
          expected: 0,
        },
      ],
    },
    {
      id: 'pointer-movement-review',
      kind: 'written',
      completionMode: 'submitted-with-reference-review',
      title: 'Explain the pointer movement',
      prompt:
        'Explain how you decide which pointer to move in a two-pointer solution. Use either sorted pair sum or container with most water as the example, and include the invariant or candidate space that the move preserves.',
      estimatedMinutes: 8,
      starter:
        'The pointer move is safe because the current comparison proves...',
      referenceAnswer:
        'A strong answer names the candidate space and the evidence that eliminates part of it. For sorted pair sum, the candidate space is the current left-to-right window. If the sum is too small, the left value cannot pair with the current right value or any smaller value, so moving left is safe. If the sum is too large, the right value cannot pair with the current left value or any larger value, so moving right is safe. For container with most water, the shorter wall caps the current area; moving the taller wall only shrinks width while the same shorter wall still limits height, so the shorter wall is the one that can be replaced. The answer should mention sortedness or the height limit as the condition that makes the move valid.',
      rubric: [
        {
          id: 'candidate-space',
          label: 'Names the candidate space',
          description:
            'Identifies what range, pair set, or partial result remains possible at each step.',
        },
        {
          id: 'movement-evidence',
          label: 'Justifies the move',
          description:
            'Explains why the current comparison proves one pointer can move safely.',
        },
        {
          id: 'assumptions',
          label: 'States assumptions',
          description:
            'Calls out the sorted input, distinct-index requirement, or shorter-wall rule that makes the algorithm correct.',
        },
      ],
    },
  ],
  approaches: {
    'sorted-pair-sum': [
      {
        name: 'Inward scan',
        code: `export function findPairWithSum(
  nums: number[],
  target: number,
): [number, number] | null {
  let left = 0
  let right = nums.length - 1

  while (left < right) {
    const sum = nums[left] + nums[right]

    if (sum === target) {
      return [nums[left], nums[right]]
    }

    if (sum < target) {
      left += 1
    } else {
      right -= 1
    }
  }

  return null
}
`,
        explanation:
          'The sorted order proves which side can be discarded. A low sum means the left value is too small to work with anything at or below the current right value. A high sum means the right value is too large to work with anything at or above the current left value.',
        complexity: 'O(n) time and O(1) extra space.',
      },
    ],
    'dedupe-sorted-array': [
      {
        name: 'Read and write pointers',
        code: `export function dedupeSorted(nums: number[]): number[] {
  if (nums.length === 0) {
    return []
  }

  const deduped = [...nums]
  let write = 1

  for (let read = 1; read < nums.length; read += 1) {
    if (nums[read] !== nums[read - 1]) {
      deduped[write] = nums[read]
      write += 1
    }
  }

  return deduped.slice(0, write)
}
`,
        explanation:
          'The read pointer inspects each value. The write pointer marks the next result position and only advances when the current value differs from the previous sorted value.',
        complexity:
          'O(n) time and O(n) space for the returned copy. An in-place version can use O(1) extra space if mutation is allowed.',
      },
    ],
    'container-most-water': [
      {
        name: 'Move the shorter wall',
        code: `export function maxContainerArea(heights: number[]): number {
  let left = 0
  let right = heights.length - 1
  let best = 0

  while (left < right) {
    const width = right - left
    const height = Math.min(heights[left], heights[right])
    best = Math.max(best, width * height)

    if (heights[left] <= heights[right]) {
      left += 1
    } else {
      right -= 1
    }
  }

  return best
}
`,
        explanation:
          'The shorter wall limits the area for the current width. Moving the taller wall would only shrink width while keeping the same limiting height, so the shorter side is the only side worth replacing.',
        complexity: 'O(n) time and O(1) extra space.',
      },
    ],
  },
}
