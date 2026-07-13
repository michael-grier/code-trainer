import Concept from './concept.mdx'

import type { Lesson } from '../../types'

const distanceHeap = `type DistanceEntry = [distance: number, vertex: number]

function pushDistance(heap: DistanceEntry[], entry: DistanceEntry): void {
  heap.push(entry)
  let index = heap.length - 1

  while (index > 0) {
    const parent = Math.floor((index - 1) / 2)

    if (heap[parent][0] <= heap[index][0]) {
      break
    }

    const parentEntry = heap[parent]
    heap[parent] = heap[index]
    heap[index] = parentEntry
    index = parent
  }
}

function popDistance(heap: DistanceEntry[]): DistanceEntry {
  const closest = heap[0]
  const last = heap.pop()!

  if (heap.length === 0) {
    return closest
  }

  heap[0] = last
  let index = 0

  while (true) {
    const left = index * 2 + 1
    const right = left + 1
    let smallest = index

    if (left < heap.length && heap[left][0] < heap[smallest][0]) {
      smallest = left
    }

    if (right < heap.length && heap[right][0] < heap[smallest][0]) {
      smallest = right
    }

    if (smallest === index) {
      break
    }

    const currentEntry = heap[index]
    heap[index] = heap[smallest]
    heap[smallest] = currentEntry
    index = smallest
  }

  return closest
}`

export const lesson: Lesson = {
  slug: 'graph-shortest-paths',
  title: 'Graph Shortest Paths',
  summary:
    'Match the shortest-path method to unweighted edges, nonnegative weights, or a limit on the number of edges.',
  track: 'algorithms',
  order: 14,
  concept: Concept,
  problems: [
    {
      id: 'shortest-unweighted-distance',
      kind: 'code',
      completionMode: 'all-tests-pass',
      title: 'Find an unweighted shortest distance',
      prompt:
        'Implement `shortestUnweightedDistance`. `graph[vertex]` lists outgoing neighbors, and every edge has equal cost. Return the smallest number of edges from `start` to `target`, or `-1` when the target is unreachable or either vertex is outside the graph. Example: `graph = [[1, 2], [3], [3], []]`, `start = 0`, and `target = 3` returns `2`.',
      estimatedMinutes: 14,
      functionName: 'shortestUnweightedDistance',
      starter: `export function shortestUnweightedDistance(
  graph: number[][],
  start: number,
  target: number,
): number {
  return -1
}

console.log(shortestUnweightedDistance([[1, 2], [3], [3], []], 0, 3))
`,
      tests: [
        {
          name: 'finds the first two-edge route',
          args: [[[1, 2], [3], [3], []], 0, 3],
          expected: 2,
        },
        {
          name: 'prefers a direct edge over a longer route',
          args: [[[1, 3], [2], [3], []], 0, 3],
          expected: 1,
        },
        {
          name: 'handles a target equal to the start',
          args: [[[1], [0]], 1, 1],
          expected: 0,
        },
        {
          name: 'does not loop on cycles',
          args: [[[1], [2], [0, 3], []], 0, 3],
          expected: 3,
        },
        {
          name: 'reports an unreachable target',
          args: [[[1], [], []], 0, 2],
          expected: -1,
        },
        {
          name: 'rejects a vertex outside the graph',
          args: [[[1], []], 0, 2],
          expected: -1,
        },
      ],
    },
    {
      id: 'network-delay-time',
      kind: 'code',
      completionMode: 'all-tests-pass',
      title: 'Measure weighted network delay',
      prompt:
        'Implement `networkDelayTime`. Vertices are numbered from `0` through `nodeCount - 1`. Each directed edge is `[from, to, time]`, and times are nonnegative. Return the earliest time when every vertex has received a signal sent from `start`, or `-1` when some vertex is unreachable. Example: `nodeCount = 3`, `edges = [[0, 1, 2], [0, 2, 5], [1, 2, 1]]`, and `start = 0` returns `3`.',
      estimatedMinutes: 24,
      functionName: 'networkDelayTime',
      starter: `export function networkDelayTime(
  nodeCount: number,
  edges: Array<[number, number, number]>,
  start: number,
): number {
  return -1
}

console.log(networkDelayTime(3, [[0, 1, 2], [0, 2, 5], [1, 2, 1]], 0))
`,
      tests: [
        {
          name: 'uses a cheaper route through another vertex',
          args: [3, [[0, 1, 2], [0, 2, 5], [1, 2, 1]], 0],
          expected: 3,
        },
        {
          name: 'returns the largest shortest arrival time',
          args: [4, [[0, 1, 1], [0, 2, 4], [1, 2, 2], [2, 3, 3]], 0],
          expected: 6,
        },
        {
          name: 'ignores a later heap entry for the same vertex',
          args: [3, [[0, 1, 8], [0, 2, 1], [2, 1, 2]], 0],
          expected: 3,
        },
        {
          name: 'respects directed edges',
          args: [2, [[1, 0, 4]], 0],
          expected: -1,
        },
        {
          name: 'reports an unreachable vertex',
          args: [3, [[0, 1, 2]], 0],
          expected: -1,
        },
        {
          name: 'handles a one-vertex network',
          args: [1, [], 0],
          expected: 0,
        },
      ],
    },
    {
      id: 'cheapest-route-with-stops',
      kind: 'code',
      completionMode: 'all-tests-pass',
      title: 'Find a cheapest route with a stop limit',
      prompt:
        'Implement `cheapestRouteWithStops`. Cities are numbered from `0` through `cityCount - 1`, and each flight is `[from, to, price]` with a nonnegative price. Return the lowest price from `source` to `destination` using at most `maxStops` intermediate cities, or `-1` if no allowed route exists. Example: flights `[[0, 1, 100], [1, 2, 100], [0, 2, 500]]` from `0` to `2` with `maxStops = 1` return `200`.',
      estimatedMinutes: 24,
      functionName: 'cheapestRouteWithStops',
      starter: `export function cheapestRouteWithStops(
  cityCount: number,
  flights: Array<[number, number, number]>,
  source: number,
  destination: number,
  maxStops: number,
): number {
  return -1
}

console.log(
  cheapestRouteWithStops(3, [[0, 1, 100], [1, 2, 100], [0, 2, 500]], 0, 2, 1),
)
`,
      tests: [
        {
          name: 'uses one stop when it lowers the price',
          args: [3, [[0, 1, 100], [1, 2, 100], [0, 2, 500]], 0, 2, 1],
          expected: 200,
        },
        {
          name: 'uses the direct route when no stops are allowed',
          args: [3, [[0, 1, 100], [1, 2, 100], [0, 2, 500]], 0, 2, 0],
          expected: 500,
        },
        {
          name: 'does not use more edges than the stop limit allows',
          args: [4, [[0, 1, 1], [1, 2, 1], [2, 3, 1], [0, 3, 10]], 0, 3, 1],
          expected: 10,
        },
        {
          name: 'handles several prices for the same destination',
          args: [4, [[0, 1, 5], [0, 2, 2], [2, 1, 1], [1, 3, 2], [2, 3, 9]], 0, 3, 2],
          expected: 5,
        },
        {
          name: 'reports an unreachable destination',
          args: [3, [[0, 1, 4]], 0, 2, 2],
          expected: -1,
        },
        {
          name: 'returns zero when the route starts at its destination',
          args: [2, [[0, 1, 4]], 1, 1, 0],
          expected: 0,
        },
      ],
    },
    {
      id: 'shortest-path-method-review',
      kind: 'written',
      completionMode: 'submitted-with-reference-review',
      title: 'Choose a shortest-path method',
      prompt:
        'Compare breadth-first search, Dijkstra\'s algorithm, and repeated edge relaxation. State which edge conditions each method requires, what information each stores, and why copying the previous distance array enforces an edge limit.',
      estimatedMinutes: 10,
      starter:
        'I first inspect whether all edges have equal cost, whether weights can be negative, and whether the route has an edge limit.',
      referenceAnswer:
        'Use breadth-first search when every edge has equal cost because the queue reaches vertices in increasing edge count. Store a distance beside each queued vertex or in a distance array. Use Dijkstra\'s algorithm for nonnegative weights. Its min-heap selects the unsettled route with the smallest known distance; skip a heap entry when a shorter distance has already been recorded. Repeated edge relaxation works by considering every edge for a fixed number of rounds. Starting each round from a copy of the previous distance array prevents a route improved during that round from immediately improving another route. Therefore one round adds at most one edge. A limit of k intermediate stops permits at most k + 1 edges. Standard Dijkstra does not support negative weights because a later negative edge can invalidate a distance that was treated as final.',
      rubric: [
        {
          id: 'equal-edges',
          label: 'Identifies the unweighted case',
          description:
            'Uses breadth-first search when every edge has equal cost.',
        },
        {
          id: 'weighted-edges',
          label: 'States Dijkstra requirements',
          description:
            'Uses a min-heap for nonnegative weighted edges and explains stale entries.',
        },
        {
          id: 'limited-edges',
          label: 'Enforces the edge limit',
          description:
            'Explains why copied distances allow at most one additional edge per round.',
        },
        {
          id: 'negative-warning',
          label: 'Accounts for negative weights',
          description:
            'Explains why standard Dijkstra cannot safely process negative edges.',
        },
      ],
    },
  ],
  approaches: {
    'shortest-unweighted-distance': [
      {
        name: 'Breadth-first distance levels',
        code: `export function shortestUnweightedDistance(
  graph: number[][],
  start: number,
  target: number,
): number {
  if (
    start < 0 ||
    start >= graph.length ||
    target < 0 ||
    target >= graph.length
  ) {
    return -1
  }

  const distances = Array<number>(graph.length).fill(-1)
  distances[start] = 0
  const queue = [start]
  let readIndex = 0

  while (readIndex < queue.length) {
    const vertex = queue[readIndex]
    readIndex += 1

    if (vertex === target) {
      return distances[vertex]
    }

    for (const neighbor of graph[vertex]) {
      if (distances[neighbor] === -1) {
        distances[neighbor] = distances[vertex] + 1
        queue.push(neighbor)
      }
    }
  }

  return -1
}
`,
        explanation:
          'Breadth-first search processes all routes with d edges before routes with d + 1 edges. The first stored distance for a vertex is therefore its shortest distance.',
        complexity: 'O(V + E) time and O(V) space.',
      },
    ],
    'network-delay-time': [
      {
        name: 'Dijkstra with a distance min-heap',
        code: `${distanceHeap}

export function networkDelayTime(
  nodeCount: number,
  edges: Array<[number, number, number]>,
  start: number,
): number {
  const graph = Array.from({ length: nodeCount }, () =>
    [] as Array<[vertex: number, time: number]>,
  )

  for (const [from, to, time] of edges) {
    graph[from].push([to, time])
  }

  const distances = Array<number>(nodeCount).fill(Infinity)
  distances[start] = 0
  const heap: DistanceEntry[] = [[0, start]]

  while (heap.length > 0) {
    const [distance, vertex] = popDistance(heap)

    if (distance !== distances[vertex]) {
      continue
    }

    for (const [neighbor, travelTime] of graph[vertex]) {
      const nextDistance = distance + travelTime

      if (nextDistance < distances[neighbor]) {
        distances[neighbor] = nextDistance
        pushDistance(heap, [nextDistance, neighbor])
      }
    }
  }

  let delay = 0

  for (const distance of distances) {
    if (distance === Infinity) {
      return -1
    }

    delay = Math.max(delay, distance)
  }

  return delay
}
`,
        explanation:
          'The min-heap selects the smallest known arrival time. A vertex can have several heap entries after its distance improves, so skip any entry that no longer matches the recorded distance.',
        complexity: 'O((V + E) log E) time and O(V + E) space.',
      },
    ],
    'cheapest-route-with-stops': [
      {
        name: 'One copied relaxation round per allowed edge',
        code: `export function cheapestRouteWithStops(
  cityCount: number,
  flights: Array<[number, number, number]>,
  source: number,
  destination: number,
  maxStops: number,
): number {
  let prices = Array<number>(cityCount).fill(Infinity)
  prices[source] = 0

  // At most maxStops intermediate cities means at most maxStops + 1 edges.
  for (let edgeCount = 0; edgeCount <= maxStops; edgeCount += 1) {
    const nextPrices = [...prices]

    for (const [from, to, price] of flights) {
      if (prices[from] !== Infinity) {
        nextPrices[to] = Math.min(nextPrices[to], prices[from] + price)
      }
    }

    prices = nextPrices
  }

  return prices[destination] === Infinity ? -1 : prices[destination]
}
`,
        explanation:
          'Each round reads only distances from the previous round, so it can add at most one edge to a route. Copying first also preserves any cheaper route that uses fewer edges.',
        complexity: 'O((k + 1)E) time and O(V) space for stop limit k.',
      },
    ],
  },
}
