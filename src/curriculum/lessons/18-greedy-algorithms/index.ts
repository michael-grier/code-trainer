import Concept from './concept.mdx'

import type { Lesson } from '../../types'

const maxHeapHelpers = `function pushMax(heap: number[], value: number): void {
  heap.push(value)
  let index = heap.length - 1

  while (index > 0) {
    const parent = Math.floor((index - 1) / 2)

    if (heap[parent] >= heap[index]) {
      break
    }

    const parentValue = heap[parent]
    heap[parent] = heap[index]
    heap[index] = parentValue
    index = parent
  }
}

function popMax(heap: number[]): number {
  const maximum = heap[0]
  const last = heap.pop()!

  if (heap.length === 0) {
    return maximum
  }

  heap[0] = last
  let index = 0

  while (true) {
    const left = index * 2 + 1
    const right = left + 1
    let largest = index

    if (left < heap.length && heap[left] > heap[largest]) {
      largest = left
    }

    if (right < heap.length && heap[right] > heap[largest]) {
      largest = right
    }

    if (largest === index) {
      break
    }

    const currentValue = heap[index]
    heap[index] = heap[largest]
    heap[largest] = currentValue
    index = largest
  }

  return maximum
}`

export const lesson: Lesson = {
  slug: 'greedy-algorithms',
  title: 'Greedy Algorithms',
  summary:
    'Choose one locally best action only when you can explain why it cannot remove a better final answer.',
  track: 'algorithms',
  order: 18,
  concept: Concept,
  problems: [
    {
      id: 'reach-last-index',
      kind: 'code',
      completionMode: 'all-tests-pass',
      title: 'Check whether the final index is reachable',
      prompt:
        'Implement `canReachLastIndex`. The nonempty array contains nonnegative integers, and `maximumJumps[i]` is the farthest number of indexes that may be moved forward from index `i`. Return whether any sequence of jumps can reach the final index. Example: `canReachLastIndex([2, 3, 1, 1, 4])` returns `true`, while `[3, 2, 1, 0, 4]` returns `false`.',
      estimatedMinutes: 14,
      functionName: 'canReachLastIndex',
      starter: `export function canReachLastIndex(maximumJumps: number[]): boolean {
  return false
}

console.log(canReachLastIndex([2, 3, 1, 1, 4]))
`,
      tests: [
        {
          name: 'reaches the end through an expanding boundary',
          args: [[2, 3, 1, 1, 4]],
          expected: true,
        },
        {
          name: 'stops before an unreachable final index',
          args: [[3, 2, 1, 0, 4]],
          expected: false,
        },
        {
          name: 'handles one index',
          args: [[0]],
          expected: true,
        },
        {
          name: 'handles a direct jump to the end',
          args: [[4, 0, 0, 0, 0]],
          expected: true,
        },
        {
          name: 'handles several zero-length jumps',
          args: [[2, 0, 0]],
          expected: true,
        },
        {
          name: 'rejects a zero-length first jump',
          args: [[0, 1]],
          expected: false,
        },
      ],
    },
    {
      id: 'maximum-non-overlapping-meetings',
      kind: 'code',
      completionMode: 'all-tests-pass',
      title: 'Select the most non-overlapping meetings',
      prompt:
        'Implement `maximumNonOverlappingMeetings`. Each meeting is a half-open interval `[start, end)`, with `start < end`. Return the largest number of meetings one person can attend without overlap. A meeting ending at time `t` is compatible with one starting at `t`. Do not modify the input. Example: `[[1, 3], [2, 4], [3, 5], [0, 7], [5, 7]]` returns `3`.',
      estimatedMinutes: 18,
      functionName: 'maximumNonOverlappingMeetings',
      starter: `type Meeting = [start: number, end: number]

export function maximumNonOverlappingMeetings(meetings: Meeting[]): number {
  return 0
}

console.log(
  maximumNonOverlappingMeetings([[1, 3], [2, 4], [3, 5], [0, 7], [5, 7]]),
)
`,
      tests: [
        {
          name: 'selects three meetings that touch at endpoints',
          args: [[[1, 3], [2, 4], [3, 5], [0, 7], [5, 7]]],
          expected: 3,
        },
        {
          name: 'prefers several short meetings over one long meeting',
          args: [[[1, 10], [2, 3], [3, 4], [4, 5]]],
          expected: 3,
        },
        {
          name: 'accepts meetings that meet at endpoints',
          args: [[[0, 2], [2, 4], [4, 6]]],
          expected: 3,
        },
        {
          name: 'chooses one among fully overlapping meetings',
          args: [[[1, 5], [2, 6], [3, 7]]],
          expected: 1,
        },
        {
          name: 'handles one meeting',
          args: [[[2, 8]]],
          expected: 1,
        },
        {
          name: 'handles no meetings',
          args: [[]],
          expected: 0,
        },
      ],
    },
    {
      id: 'minimum-refuel-stops',
      kind: 'code',
      completionMode: 'all-tests-pass',
      title: 'Minimize refueling stops',
      prompt:
        'Implement `minimumRefuelStops`. A vehicle starts at position `0` with `startFuel`, uses one unit of fuel per distance unit, and must reach `target`. Stations have positive positions and fuel, occur before the target, and are sorted by position. The algorithm may delay deciding which reachable station it stopped at until more range is required. Return the fewest stops, or `-1` when the target is unreachable. Example: target `100`, start fuel `10`, and stations `[[10, 60], [20, 30], [30, 30], [60, 40]]` return `2`.',
      estimatedMinutes: 24,
      functionName: 'minimumRefuelStops',
      starter: `type Station = [position: number, fuel: number]

export function minimumRefuelStops(
  target: number,
  startFuel: number,
  stations: Station[],
): number {
  return -1
}

console.log(
  minimumRefuelStops(100, 10, [[10, 60], [20, 30], [30, 30], [60, 40]]),
)
`,
      tests: [
        {
          name: 'reaches the target with two stops',
          args: [100, 10, [[10, 60], [20, 30], [30, 30], [60, 40]]],
          expected: 2,
        },
        {
          name: 'reports an unreachable first station',
          args: [100, 1, [[10, 100]]],
          expected: -1,
        },
        {
          name: 'requires no stop when starting fuel is enough',
          args: [1, 1, []],
          expected: 0,
        },
        {
          name: 'chooses the largest reachable station',
          args: [100, 50, [[25, 25], [50, 50]]],
          expected: 1,
        },
        {
          name: 'uses every required evenly spaced station',
          args: [100, 25, [[25, 25], [50, 25], [75, 25]]],
          expected: 3,
        },
        {
          name: 'defers smaller reachable fuel amounts',
          args: [100, 50, [[10, 10], [20, 20], [30, 30], [60, 40]]],
          expected: 2,
        },
      ],
    },
    {
      id: 'greedy-choice-review',
      kind: 'written',
      completionMode: 'submitted-with-reference-review',
      title: 'Justify a greedy choice',
      prompt:
        'Explain what must be proved before using a greedy algorithm. Include how a reachable boundary summarizes jump choices, why earliest finish time leaves the most room for later meetings, how deferred refueling chooses among past stations, and one sign that dynamic programming may be required instead.',
      estimatedMinutes: 10,
      starter:
        'I state the local choice, then explain why replacing another valid first choice with it cannot make the final result worse.',
      referenceAnswer:
        'A greedy rule is correct only when a locally preferred choice can be included without losing a better complete answer. For jump reachability, every index at or before the farthest reachable boundary can be processed, and only the largest new boundary matters. For interval scheduling, replacing the first chosen meeting with the compatible meeting that ends earliest cannot reduce the room left for later meetings. For refueling, the algorithm stores fuel from all stations within the current reachable range without immediately committing to one. When more range is required, taking the largest stored amount represents choosing to have stopped at that station. This maximizes the new range for that stop, so no smaller choice can reach farther with the same stop count. If a choice changes which future choices are available and no safe replacement argument exists, define subproblem states and consider dynamic programming instead.',
      rubric: [
        {
          id: 'choice-rule',
          label: 'States the local rule',
          description:
            'Names the exact boundary, finish time, or priority used for each choice.',
        },
        {
          id: 'replacement',
          label: 'Provides a replacement argument',
          description:
            'Explains why the preferred choice cannot make a complete answer worse.',
        },
        {
          id: 'deferred-choice',
          label: 'Explains deferred refueling',
          description:
            'Chooses the largest fuel amount only after more reach becomes necessary.',
        },
        {
          id: 'dp-warning',
          label: 'Recognizes an unsafe greedy choice',
          description:
            'Identifies when future consequences require explicit subproblem states.',
        },
      ],
    },
  ],
  approaches: {
    'reach-last-index': [
      {
        name: 'Track the farthest reachable index',
        code: `export function canReachLastIndex(maximumJumps: number[]): boolean {
  let farthestReachable = 0

  for (let index = 0; index <= farthestReachable; index += 1) {
    farthestReachable = Math.max(
      farthestReachable,
      index + maximumJumps[index],
    )

    if (farthestReachable >= maximumJumps.length - 1) {
      return true
    }
  }

  return false
}
`,
        explanation:
          'Every index up to the current boundary is reachable. Processing those indexes only needs to retain the farthest new boundary any of them provides.',
        complexity: 'O(n) time and O(1) space.',
      },
    ],
    'maximum-non-overlapping-meetings': [
      {
        name: 'Always select the earliest compatible finish',
        code: `type Meeting = [start: number, end: number]

export function maximumNonOverlappingMeetings(meetings: Meeting[]): number {
  const sorted = meetings
    .map(([start, end]): Meeting => [start, end])
    .sort((left, right) => left[1] - right[1] || left[0] - right[0])

  let selectedCount = 0
  let previousEnd = Number.NEGATIVE_INFINITY

  for (const [start, end] of sorted) {
    if (start >= previousEnd) {
      // This compatible meeting leaves the most time for later meetings.
      selectedCount += 1
      previousEnd = end
    }
  }

  return selectedCount
}
`,
        explanation:
          'Among compatible meetings, the earliest finish leaves at least as much remaining time as any later finish. Sorting a copy also preserves the input.',
        complexity: 'O(n log n) time and O(n) space for the copied array.',
      },
    ],
    'minimum-refuel-stops': [
      {
        name: 'Choose the largest passed station only when needed',
        code: `type Station = [position: number, fuel: number]

${maxHeapHelpers}

export function minimumRefuelStops(
  target: number,
  startFuel: number,
  stations: Station[],
): number {
  const availableFuel: number[] = []
  let reachablePosition = startFuel
  let stationIndex = 0
  let stopCount = 0

  while (reachablePosition < target) {
    while (
      stationIndex < stations.length &&
      stations[stationIndex][0] <= reachablePosition
    ) {
      // Store every station already passed and not yet used.
      pushMax(availableFuel, stations[stationIndex][1])
      stationIndex += 1
    }

    if (availableFuel.length === 0) {
      return -1
    }

    // One required stop should add the most available range.
    reachablePosition += popMax(availableFuel)
    stopCount += 1
  }

  return stopCount
}
`,
        explanation:
          'Treat every reachable station as a stop the algorithm could have made. When another stop becomes necessary, choosing the largest unused amount produces the farthest reach for that stop.',
        complexity: 'O(n log n) time and O(n) space.',
      },
    ],
  },
}
