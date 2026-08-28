import Concept from './concept.mdx'

import type { Lesson } from '../../types'

export const lesson: Lesson = {
  slug: 'scope-closures-and-prototypes',
  title: 'Scope, Closures, and Prototypes',
  summary:
    'Understand lexical scope, retained state, and prototype-based object behavior.',
  track: 'js-ts-core',
  order: 21,
  concept: Concept,
  problems: [
    {
      id: 'closure-capture-trace',
      kind: 'trace',
      completionMode: 'structured-answer-correct',
      title: 'Predict what the closures print',
      prompt:
        'Read the program below without running it. Two steppers are created from the same factory, and the factory reassigns its variable after creating the stepper. Predict the console output and answer the questions.',
      estimatedMinutes: 10,
      code: `function makeStepper(start: number) {
  let value = start

  function step() {
    value += 1
    console.log(\`value is \${value}\`)
  }

  value = start + 100
  return step
}

const stepA = makeStepper(0)
const stepB = makeStepper(50)

stepA()
stepA()
stepB()
`,
      questions: [
        {
          id: 'output-order',
          type: 'output-order',
          label: 'Which lines print, in order?',
          options: [
            'value is 1',
            'value is 2',
            'value is 51',
            'value is 101',
            'value is 102',
            'value is 151',
          ],
          expected: ['value is 101', 'value is 102', 'value is 151'],
        },
        {
          id: 'why-not-one',
          type: 'multiple-choice',
          label: 'Why does the first stepA() print 101 instead of 1?',
          options: [
            'step closed over the variable value, and value = start + 100 ran before any call',
            'step copied the value 0 when it was created, then added 101',
            'stepA and stepB share one value variable between them',
            'the template literal converts the number before the addition runs',
          ],
          answer:
            'step closed over the variable value, and value = start + 100 ran before any call',
        },
        {
          id: 'next-call',
          type: 'multiple-choice',
          label: 'If stepB() were called one more time, what would it print?',
          options: [
            'value is 52',
            'value is 103',
            'value is 152',
            'value is 251',
          ],
          answer: 'value is 152',
        },
      ],
      explanation:
        'Each makeStepper call creates its own box holding value, and step closes over that box, not over a snapshot of the number. The line value = start + 100 writes into the box before any stepper runs, so the first stepA() reads 100 and prints 101, and the second call continues from that same box with 102. stepB has a completely separate box seeded from start = 50, so it prints 151, and another call would continue that box at 152. The two steppers never interact because two factory calls mean two boxes.',
    },
    {
      id: 'fix-shared-loop-capture',
      kind: 'debug',
      completionMode: 'all-tests-pass',
      title: 'Fix the readers that all see one variable',
      prompt:
        'readLabelsLater builds one reader function per label, then calls every reader and returns the results. It should return the labels unchanged, but every reader currently returns the same wrong result. Find the shared box and fix the capture. Example: `readLabelsLater(["save", "edit", "delete"])` should return `["save", "edit", "delete"]`.',
      estimatedMinutes: 15,
      functionName: 'readLabelsLater',
      brokenCode: `export function readLabelsLater(labels: string[]): string[] {
  const readers: Array<() => string> = []
  let position = 0

  while (position < labels.length) {
    readers.push(() => labels[position])
    position += 1
  }

  return readers.map((read) => read())
}

console.log(readLabelsLater(['save', 'edit', 'delete']))
`,
      bugHints: [
        'Count the boxes: how many position variables exist across all the readers?',
        'What does position hold at the moment the readers actually run?',
        'A let declared in a for header creates a fresh box on every iteration.',
      ],
      tests: [
        {
          name: 'returns each label from its own reader',
          args: [['save', 'edit', 'delete']],
          expected: ['save', 'edit', 'delete'],
        },
        {
          name: 'handles a single label',
          args: [['only']],
          expected: ['only'],
        },
        { name: 'handles no labels', args: [[]], expected: [] },
        {
          name: 'keeps repeated labels distinct per reader',
          args: [['x', 'x', 'y']],
          expected: ['x', 'x', 'y'],
        },
        {
          name: 'handles longer lists',
          args: [['a', 'b', 'c', 'd', 'e']],
          expected: ['a', 'b', 'c', 'd', 'e'],
        },
      ],
    },
    {
      id: 'resolve-with-prototypes',
      kind: 'code',
      completionMode: 'all-tests-pass',
      title: 'Walk a prototype chain represented as data',
      prompt:
        'Implement `resolveProperty`. `chain` models an object and its prototypes as an array of plain records: index 0 is the object itself, index 1 is its prototype, and so on outward. Return `{ foundAtIndex, value }` for the first record that defines `key` itself, walking the chain from index 0 upward, or `{ foundAtIndex: -1, value: null }` when no record defines it. Count only properties a record defines itself: built-in object members such as `toString` must not be treated as found. Example: `resolveProperty([{ theme: "dark" }, { theme: "light", fontSize: 14 }], "fontSize")` returns `{ foundAtIndex: 1, value: 14 }`.',
      estimatedMinutes: 18,
      functionName: 'resolveProperty',
      starter: `type ResolvedProperty = {
  foundAtIndex: number
  value: unknown
}

export function resolveProperty(
  chain: Array<Record<string, unknown>>,
  key: string,
): ResolvedProperty {
  return { foundAtIndex: -1, value: null }
}

console.log(
  resolveProperty([{ theme: 'dark' }, { theme: 'light', fontSize: 14 }], 'fontSize'),
)
`,
      tests: [
        {
          name: 'finds an inherited property one link up',
          args: [[{ theme: 'dark' }, { theme: 'light', fontSize: 14 }], 'fontSize'],
          expected: { foundAtIndex: 1, value: 14 },
        },
        {
          name: 'lets the nearest record shadow a later one',
          args: [[{ theme: 'dark' }, { theme: 'light', fontSize: 14 }], 'theme'],
          expected: { foundAtIndex: 0, value: 'dark' },
        },
        {
          name: 'walks a chain of three links',
          args: [[{}, { a: 1 }, { b: 2 }], 'b'],
          expected: { foundAtIndex: 2, value: 2 },
        },
        {
          name: 'reports a missing key',
          args: [[{ a: 1 }, { b: 2 }], 'c'],
          expected: { foundAtIndex: -1, value: null },
        },
        {
          name: 'ignores built-in object members',
          args: [[{ a: 1 }, { b: 2 }], 'toString'],
          expected: { foundAtIndex: -1, value: null },
        },
        {
          name: 'handles an empty chain',
          args: [[], 'a'],
          expected: { foundAtIndex: -1, value: null },
        },
      ],
    },
    {
      id: 'closure-capture-review',
      kind: 'written',
      completionMode: 'submitted-with-reference-review',
      title: 'Explain what closures capture',
      prompt:
        'A teammate is confused that a function created in a loop "saw the wrong value" when it ran later. In your own words, explain: what a closure actually captures, why later assignments to a captured variable are visible to the function, when two functions share state and when they do not, and how to get per-iteration capture in a loop. Use a short example of your own.',
      estimatedMinutes: 12,
      referenceAnswer:
        'A closure captures the variable itself, not the value the variable held when the function was created. Concretely, every function keeps a reference to the scope, the box of variables, it was written inside, and every read or write of an outer name goes through that box at call time. That is why later assignments are visible: the function looks the value up when it runs, and finds whatever the box holds at that moment.\n\nTwo functions share state exactly when they close over the same box. Two calls to a factory create two separate boxes, so the functions they return are independent; two functions created inside one call, or one loop iteration over a variable declared outside the loop, share a single box and therefore see each other\'s writes. Sharing is not itself a bug: a counter\'s increment and read functions cooperate through a shared box on purpose. The bug is creating many functions that were meant to be independent over one shared variable, the classic loop case, where every function reads the loop variable\'s final value.\n\nThe fix is to make each iteration produce its own box. Declaring the loop variable with let in the for header does this automatically, because let and const in a loop are boxed fresh per iteration. Copying the value into a const inside the loop body works the same way. For example, `for (let i = 0; i < 3; i += 1) fns.push(() => i)` yields functions returning 0, 1, and 2, while declaring `let i` once before the loop yields three functions that all return 3.',
      rubric: [
        {
          id: 'captures-variable',
          label: 'Capture rule',
          description:
            'States that closures capture the variable (its box), not a value snapshot, and that lookups happen at call time.',
        },
        {
          id: 'sharing-condition',
          label: 'Sharing condition',
          description:
            'Explains that functions share state exactly when they close over the same scope, and gives the factory case where they do not.',
        },
        {
          id: 'loop-fix',
          label: 'Per-iteration capture',
          description:
            'Shows how let in a for header, or a const copy inside the body, creates one box per iteration, with a concrete example.',
        },
      ],
    },
  ],
  approaches: {
    'fix-shared-loop-capture': [
      {
        name: 'One box per iteration',
        code: `export function readLabelsLater(labels: string[]): string[] {
  const readers: Array<() => string> = []

  // let in the for header creates a fresh position box per iteration,
  // so each reader closes over its own copy instead of a shared one.
  for (let position = 0; position < labels.length; position += 1) {
    readers.push(() => labels[position])
  }

  return readers.map((read) => read())
}`,
        explanation:
          'The broken version declares position once, so all readers close over one box, and by the time they run the loop has pushed it past the last index. Moving the declaration into the for header gives every iteration its own box, so each reader captures the position it was created with. Copying the label into a const inside the loop body (`const label = labels[position]`) is an equally correct fix that captures the value a step earlier.',
        complexity: 'O(n) time, O(n) space for the readers.',
      },
    ],
    'resolve-with-prototypes': [
      {
        name: 'Scan links with an own-property check',
        code: `type ResolvedProperty = {
  foundAtIndex: number
  value: unknown
}

export function resolveProperty(
  chain: Array<Record<string, unknown>>,
  key: string,
): ResolvedProperty {
  for (let index = 0; index < chain.length; index += 1) {
    // Object.hasOwn asks whether this record defines the key itself,
    // so inherited members like toString are never counted as found.
    if (Object.hasOwn(chain[index], key)) {
      return { foundAtIndex: index, value: chain[index][key] }
    }
  }

  // No record supplied the key anywhere along the chain.
  return { foundAtIndex: -1, value: null }
}`,
        explanation:
          'The walk mirrors real property lookup: start at the object, stop at the first record that defines the key, and let earlier records shadow later ones. The essential detail is the own-property check. A plain `key in record` test also sees members inherited from Object.prototype, so it would wrongly report toString as found; Object.hasOwn (or hasOwnProperty) restricts the check to what the record defines itself.',
        complexity: 'O(c) time for a chain of c links, O(1) space.',
      },
    ],
  },
}
