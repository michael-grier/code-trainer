import Concept from './concept.mdx'

import type { Lesson } from '../../types'

export const lesson: Lesson = {
  slug: 'graph-traversal',
  title: 'Graph Traversal',
  summary:
    'Track visited locations while breadth-first or depth-first search explores each reachable vertex once.',
  track: 'algorithms',
  order: 13,
  concept: Concept,
  problems: [
    {
      id: 'breadth-first-traversal-order',
      kind: 'code',
      completionMode: 'all-tests-pass',
      title: 'Traverse a graph breadth-first',
      prompt:
        'Implement `breadthFirstTraversal`. `graph[vertex]` lists that vertex\'s neighbors in the order they should be visited. Start at `start`, return only reachable vertices, and add a vertex to `visited` when it enters the queue. Return `[]` when `start` is outside the graph. Example: `graph = [[1, 2], [3], [3], []]` and `start = 0` returns `[0, 1, 2, 3]`.',
      estimatedMinutes: 14,
      functionName: 'breadthFirstTraversal',
      starter: `export function breadthFirstTraversal(
  graph: number[][],
  start: number,
): number[] {
  return []
}

console.log(breadthFirstTraversal([[1, 2], [3], [3], []], 0))
`,
      tests: [
        {
          name: 'visits vertices one distance level at a time',
          args: [[[1, 2], [3], [3], []], 0],
          expected: [0, 1, 2, 3],
        },
        {
          name: 'uses the given neighbor order',
          args: [[[2, 1], [3], [4], [], []], 0],
          expected: [0, 2, 1, 4, 3],
        },
        {
          name: 'does not revisit vertices in a cycle',
          args: [[[1], [2], [0]], 1],
          expected: [1, 2, 0],
        },
        {
          name: 'returns only the reachable component',
          args: [[[1], [], [3], []], 2],
          expected: [2, 3],
        },
        {
          name: 'handles one vertex with a self-loop',
          args: [[[0]], 0],
          expected: [0],
        },
        {
          name: 'rejects a start outside the graph',
          args: [[], 0],
          expected: [],
        },
      ],
    },
    {
      id: 'count-grid-islands',
      kind: 'code',
      completionMode: 'all-tests-pass',
      title: 'Count connected land regions',
      prompt:
        'Implement `countGridIslands`. Each string contains `"1"` for land and `"0"` for water. Two land cells belong to the same island when they share an edge; diagonal contact does not connect them. Do not change the input. Example: `["110", "010", "101"]` contains three islands, so return `3`.',
      estimatedMinutes: 18,
      functionName: 'countGridIslands',
      starter: `export function countGridIslands(grid: string[]): number {
  return 0
}

console.log(countGridIslands(['110', '010', '101']))
`,
      tests: [
        {
          name: 'counts several connected land regions',
          args: [['110', '010', '101']],
          expected: 3,
        },
        {
          name: 'joins land through shared edges',
          args: [['111', '101', '111']],
          expected: 1,
        },
        {
          name: 'does not join diagonal land',
          args: [['10', '01']],
          expected: 2,
        },
        {
          name: 'handles all water',
          args: [['000', '000']],
          expected: 0,
        },
        {
          name: 'handles one land cell',
          args: [['1']],
          expected: 1,
        },
        {
          name: 'handles an empty grid',
          args: [[]],
          expected: 0,
        },
      ],
    },
    {
      id: 'finish-all-courses',
      kind: 'code',
      completionMode: 'all-tests-pass',
      title: 'Check whether every course can be finished',
      prompt:
        'Implement `canFinishAllCourses`. Courses are numbered from `0` through `courseCount - 1`. Each pair `[course, prerequisite]` means the prerequisite must be finished before the course. Return whether an order containing every course exists. Example: `courseCount = 3` and `prerequisites = [[1, 0], [2, 1]]` returns `true`; adding `[0, 2]` creates a cycle and returns `false`.',
      estimatedMinutes: 22,
      functionName: 'canFinishAllCourses',
      starter: `export function canFinishAllCourses(
  courseCount: number,
  prerequisites: Array<[number, number]>,
): boolean {
  return false
}

console.log(canFinishAllCourses(3, [[1, 0], [2, 1]]))
`,
      tests: [
        {
          name: 'accepts a simple prerequisite chain',
          args: [3, [[1, 0], [2, 1]]],
          expected: true,
        },
        {
          name: 'rejects a directed cycle',
          args: [3, [[1, 0], [2, 1], [0, 2]]],
          expected: false,
        },
        {
          name: 'accepts several courses that share a prerequisite',
          args: [4, [[1, 0], [2, 0], [3, 1], [3, 2]]],
          expected: true,
        },
        {
          name: 'detects a cycle in one disconnected part',
          args: [5, [[1, 0], [3, 2], [2, 3]]],
          expected: false,
        },
        {
          name: 'accepts courses without prerequisites',
          args: [4, []],
          expected: true,
        },
        {
          name: 'accepts one course',
          args: [1, []],
          expected: true,
        },
      ],
    },
    {
      id: 'graph-traversal-review',
      kind: 'written',
      completionMode: 'submitted-with-reference-review',
      title: 'Choose a traversal and visited rule',
      prompt:
        'Explain how you choose between breadth-first and depth-first search. Include what the queue or stack contains, when a vertex should be marked visited, how a grid becomes a graph, and how a directed cycle can prevent a topological order.',
      estimatedMinutes: 9,
      starter:
        'I use breadth-first search when I need distance levels, and depth-first search when I only need to explore a complete reachable region.',
      referenceAnswer:
        'Breadth-first search uses a queue and processes vertices by their number of edges from the start. Depth-first search uses the call stack or an explicit stack and follows one route before returning. In both searches, mark a vertex visited when it is scheduled, not after its neighbors are processed. This prevents the same vertex from entering the queue or stack several times. A grid is a graph whose cells are vertices and whose allowed moves are edges; boundary checks replace an explicit adjacency list. For course prerequisites, direct each edge from prerequisite to course. Repeatedly remove courses with zero remaining prerequisites. If fewer than all courses are removed, the remaining directed edges contain a cycle, so no complete course order exists.',
      rubric: [
        {
          id: 'search-choice',
          label: 'Chooses BFS or DFS',
          description:
            'Connects breadth-first search to distance levels and depth-first search to complete exploration.',
        },
        {
          id: 'visited-time',
          label: 'Marks visited at scheduling time',
          description:
            'Explains why visited state is recorded when a vertex enters the queue or stack.',
        },
        {
          id: 'grid-model',
          label: 'Models grid movement',
          description:
            'Treats cells as vertices and allowed neighboring moves as edges.',
        },
        {
          id: 'cycle-result',
          label: 'Connects cycles to ordering',
          description:
            'Explains why a directed cycle prevents a complete topological order.',
        },
      ],
    },
  ],
  approaches: {
    'breadth-first-traversal-order': [
      {
        name: 'Queue with an advancing read position',
        code: `export function breadthFirstTraversal(
  graph: number[][],
  start: number,
): number[] {
  if (start < 0 || start >= graph.length) {
    return []
  }

  const visited = new Set<number>([start])
  const queue = [start]
  const order: number[] = []
  let readIndex = 0

  while (readIndex < queue.length) {
    const vertex = queue[readIndex]
    readIndex += 1
    order.push(vertex)

    for (const neighbor of graph[vertex]) {
      if (!visited.has(neighbor)) {
        // Mark now so another edge cannot add this neighbor again.
        visited.add(neighbor)
        queue.push(neighbor)
      }
    }
  }

  return order
}
`,
        explanation:
          'The queue holds discovered vertices that have not been processed. An advancing read position avoids the O(n) work of shifting every remaining item after each removal.',
        complexity: 'O(V + E) time and O(V) space.',
      },
    ],
    'count-grid-islands': [
      {
        name: 'Iterative depth-first search from each new island',
        code: `export function countGridIslands(grid: string[]): number {
  if (grid.length === 0 || grid[0].length === 0) {
    return 0
  }

  const rowCount = grid.length
  const columnCount = grid[0].length
  const visited = Array.from({ length: rowCount }, () =>
    Array<boolean>(columnCount).fill(false),
  )
  const directions = [
    [-1, 0],
    [1, 0],
    [0, -1],
    [0, 1],
  ]
  let islandCount = 0

  for (let row = 0; row < rowCount; row += 1) {
    for (let column = 0; column < columnCount; column += 1) {
      if (grid[row][column] !== '1' || visited[row][column]) {
        continue
      }

      islandCount += 1
      visited[row][column] = true
      const stack: Array<[number, number]> = [[row, column]]

      while (stack.length > 0) {
        const [currentRow, currentColumn] = stack.pop()!

        for (const [rowChange, columnChange] of directions) {
          const nextRow = currentRow + rowChange
          const nextColumn = currentColumn + columnChange
          const isInside =
            nextRow >= 0 &&
            nextRow < rowCount &&
            nextColumn >= 0 &&
            nextColumn < columnCount

          if (
            isInside &&
            grid[nextRow][nextColumn] === '1' &&
            !visited[nextRow][nextColumn]
          ) {
            visited[nextRow][nextColumn] = true
            stack.push([nextRow, nextColumn])
          }
        }
      }
    }
  }

  return islandCount
}
`,
        explanation:
          'Each unvisited land cell starts one island. Depth-first search marks every land cell connected to it through shared edges, so later loops do not count that island again.',
        complexity: 'O(rows × columns) time and O(rows × columns) space.',
      },
    ],
    'finish-all-courses': [
      {
        name: 'Remove courses with no remaining prerequisites',
        code: `export function canFinishAllCourses(
  courseCount: number,
  prerequisites: Array<[number, number]>,
): boolean {
  const nextCourses = Array.from({ length: courseCount }, () => [] as number[])
  const remainingPrerequisites = Array<number>(courseCount).fill(0)

  for (const [course, prerequisite] of prerequisites) {
    nextCourses[prerequisite].push(course)
    remainingPrerequisites[course] += 1
  }

  const queue: number[] = []

  for (let course = 0; course < courseCount; course += 1) {
    if (remainingPrerequisites[course] === 0) {
      queue.push(course)
    }
  }

  let readIndex = 0
  let finishedCount = 0

  while (readIndex < queue.length) {
    const course = queue[readIndex]
    readIndex += 1
    finishedCount += 1

    for (const nextCourse of nextCourses[course]) {
      remainingPrerequisites[nextCourse] -= 1

      if (remainingPrerequisites[nextCourse] === 0) {
        queue.push(nextCourse)
      }
    }
  }

  return finishedCount === courseCount
}
`,
        explanation:
          'The remaining-prerequisite count is the number of incoming edges. Finishing a course removes its outgoing edges. A cycle leaves every course in that cycle with at least one incoming edge.',
        complexity: 'O(V + E) time and O(V + E) space.',
      },
    ],
  },
}
