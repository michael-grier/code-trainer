import Concept from './concept.mdx'

import type { Lesson } from '../../types'

// The type grader compiles submissions with the ES lib chain only (no DOM),
// so `console` is not declared there. Each fixture opens with this shim so
// the starter's sample console.log call type-checks. See src/runtime/typeWorker.ts.
const consoleShim =
  'declare const console: { log: (...values: unknown[]) => void }\n'

export const lesson: Lesson = {
  slug: 'narrowing-unions-and-discriminated-unions',
  title: 'Narrowing, Unions, and Discriminated Unions',
  summary: 'Model alternatives and narrow them safely in application code.',
  track: 'js-ts-core',
  order: 26,
  concept: Concept,
  problems: [
    {
      id: 'describe-union-fields',
      kind: 'code',
      completionMode: 'all-tests-pass',
      title: 'Narrow a union of primitives',
      prompt:
        "Form fields arrive as `string | number | boolean | null`. Implement `describeField`, which labels each value by its kind: a string returns `'text:'` followed by the string, a number returns `'count:'` followed by the number, a boolean returns `'flag:on'` or `'flag:off'`, and null returns `'empty'`. Falsy values are still real values: the empty string must return `'text:'` and zero must return `'count:0'`, so narrow with explicit checks rather than truthiness. This problem is graded by the TypeScript compiler as well as by tests, so keep the parameter's union type intact. Example: `describeField('hello')` returns `'text:hello'`, and `describeField(0)` returns `'count:0'`.",
      estimatedMinutes: 12,
      functionName: 'describeField',
      starter: `export function describeField(
  value: string | number | boolean | null,
): string {
  return 'empty'
}

console.log(describeField('hello'))
`,
      tests: [
        { name: 'labels a string', args: ['hello'], expected: 'text:hello' },
        { name: 'labels a number', args: [42], expected: 'count:42' },
        { name: 'labels true', args: [true], expected: 'flag:on' },
        { name: 'labels false', args: [false], expected: 'flag:off' },
        { name: 'labels null', args: [null], expected: 'empty' },
        {
          name: 'keeps the empty string as text',
          args: [''],
          expected: 'text:',
        },
        { name: 'keeps zero as a count', args: [0], expected: 'count:0' },
      ],
      typeFixture: `${consoleShim}
const described: string = describeField('sample')
void described

// @ts-expect-error only string, number, boolean, or null are accepted
describeField(undefined)

// @ts-expect-error an object is not a member of the input union
describeField({ text: 'sample' })
`,
    },
    {
      id: 'refactor-request-state',
      kind: 'refactor',
      completionMode: 'tests-and-static-checks-pass',
      title: 'Replace the flags with a discriminated union',
      prompt:
        "summarizeRequest consumes the flags-and-optionals request state from the lesson, so it has to guess which field to trust and fend off fields that may be missing. Refactor the type into a discriminated union named `RequestState` with exactly three members tagged by `status`: `{ status: 'loading' }`, `{ status: 'error'; message: string }`, and `{ status: 'success'; data: string[] }`. Then rewrite summarizeRequest as a switch on `status` returning `'still loading'` for loading, `'failed: '` followed by the message for an error, and `` `loaded ${data.length} (${data.join(', ')})` `` for success. The compiler grades your union too: impossible states such as a loading state carrying data must fail to compile. Example: `summarizeRequest({ status: 'success', data: ['ada', 'grace'] })` returns `'loaded 2 (ada, grace)'`.",
      estimatedMinutes: 18,
      functionName: 'summarizeRequest',
      originalCode: `type RequestState = {
  loading: boolean
  error?: string
  data?: string[]
}

export function summarizeRequest(state: RequestState): string {
  if (state.loading) {
    return 'still loading'
  }
  if (state.error !== undefined) {
    return \`failed: \${state.error}\`
  }
  return \`loaded \${state.data?.length ?? 0} (\${state.data?.join(', ') ?? ''})\`
}

console.log(summarizeRequest({ loading: true }))
`,
      starter: `type RequestState = {
  loading: boolean
  error?: string
  data?: string[]
}

export function summarizeRequest(state: RequestState): string {
  if (state.loading) {
    return 'still loading'
  }
  if (state.error !== undefined) {
    return \`failed: \${state.error}\`
  }
  return \`loaded \${state.data?.length ?? 0} (\${state.data?.join(', ') ?? ''})\`
}

console.log(summarizeRequest({ loading: true }))
`,
      goals: [
        "Define RequestState as a union of three members, each tagged with a literal status: 'loading', 'error', or 'success'.",
        'Give each member exactly the fields that exist in that state, with no optional fields left anywhere.',
        'Narrow with a switch on state.status so each branch reads its fields directly, without ?. or ?? fallbacks.',
        "Update the sample call at the bottom to a value of the new union, such as { status: 'loading' }, since { loading: true } no longer type-checks.",
      ],
      staticChecks: [
        {
          kind: 'require-text',
          text: 'status',
          message:
            'Tag every union member with a shared discriminant property named status.',
        },
        {
          kind: 'forbid-text',
          text: '?:',
          message:
            'No optional fields: each union member declares exactly the fields that exist in that state.',
        },
        {
          kind: 'no-any',
          message:
            'Keep the union precise. An any would let impossible states back in.',
        },
      ],
      tests: [
        {
          name: 'summarizes a loading state',
          args: [{ status: 'loading' }],
          expected: 'still loading',
        },
        {
          name: 'summarizes an error with its message',
          args: [{ status: 'error', message: 'request timed out' }],
          expected: 'failed: request timed out',
        },
        {
          name: 'keeps an empty error message honest',
          args: [{ status: 'error', message: '' }],
          expected: 'failed: ',
        },
        {
          name: 'summarizes loaded data',
          args: [{ status: 'success', data: ['ada', 'grace'] }],
          expected: 'loaded 2 (ada, grace)',
        },
        {
          name: 'summarizes a single item',
          args: [{ status: 'success', data: ['only'] }],
          expected: 'loaded 1 (only)',
        },
        {
          name: 'summarizes an empty result',
          args: [{ status: 'success', data: [] }],
          expected: 'loaded 0 ()',
        },
      ],
      typeFixture: `${consoleShim}
const loadingState: RequestState = { status: 'loading' }
void loadingState

// @ts-expect-error a loading state cannot carry data
const impossibleState: RequestState = { status: 'loading', data: ['a'] }
void impossibleState

// @ts-expect-error an error state must include its message
const silentError: RequestState = { status: 'error' }
void silentError

declare const currentState: RequestState
if (currentState.status === 'success') {
  const narrowedItems: string[] = currentState.data
  void narrowedItems
}
`,
    },
    {
      id: 'exhaustive-event-formatting',
      kind: 'refactor',
      completionMode: 'tests-and-static-checks-pass',
      title: 'Make the event formatter exhaustive',
      prompt:
        "formatEvent turns chat events into activity-feed lines, but it was written before narrowing was understood: it silences the compiler with assertions instead of narrowing, and its catch-all return quietly mislabels every reaction event. Refactor it into a switch on `event.kind` with a case per member, no assertions, and a never-typed tripwire in the default branch so a future union member becomes a compile error instead of an 'unknown event' line. The formats are: `` `${username} joined` ``, `` `${username} left` ``, `` `${from}: ${text}` ``, and `` `${from} reacted with ${emoji}` ``. Example: `formatEvent({ kind: 'reaction', from: 'grace', emoji: ':+1:' })` returns `'grace reacted with :+1:'`.",
      estimatedMinutes: 18,
      functionName: 'formatEvent',
      originalCode: `type AppEvent =
  | { kind: 'user-joined'; username: string }
  | { kind: 'user-left'; username: string }
  | { kind: 'message'; from: string; text: string }
  | { kind: 'reaction'; from: string; emoji: string }

export function formatEvent(event: AppEvent): string {
  if (event.kind === 'user-joined' || event.kind === 'user-left') {
    const named = event as { kind: string; username: string }
    const verb = event.kind === 'user-joined' ? 'joined' : 'left'
    return \`\${named.username} \${verb}\`
  }
  if (event.kind === 'message') {
    const message = event as { kind: 'message'; from: string; text: string }
    return \`\${message.from}: \${message.text}\`
  }
  return 'unknown event'
}

console.log(formatEvent({ kind: 'reaction', from: 'grace', emoji: ':+1:' }))
`,
      starter: `type AppEvent =
  | { kind: 'user-joined'; username: string }
  | { kind: 'user-left'; username: string }
  | { kind: 'message'; from: string; text: string }
  | { kind: 'reaction'; from: string; emoji: string }

export function formatEvent(event: AppEvent): string {
  if (event.kind === 'user-joined' || event.kind === 'user-left') {
    const named = event as { kind: string; username: string }
    const verb = event.kind === 'user-joined' ? 'joined' : 'left'
    return \`\${named.username} \${verb}\`
  }
  if (event.kind === 'message') {
    const message = event as { kind: 'message'; from: string; text: string }
    return \`\${message.from}: \${message.text}\`
  }
  return 'unknown event'
}

console.log(formatEvent({ kind: 'reaction', from: 'grace', emoji: ':+1:' }))
`,
      goals: [
        'Handle every AppEvent member in a switch on event.kind, letting the discriminant narrow each branch.',
        'Remove every type assertion. Narrowing makes each field available without silencing the compiler.',
        'End the switch with a default branch that assigns the event to a never-typed constant, so an unhandled member fails to compile.',
      ],
      staticChecks: [
        {
          kind: 'require-text',
          text: 'switch',
          message:
            'Narrow with a switch on the discriminant instead of an if/else chain.',
        },
        {
          kind: 'require-text',
          text: 'never',
          message:
            'Add a never-typed tripwire in the default branch to keep the switch exhaustive.',
        },
        {
          kind: 'forbid-text',
          text: ' as ',
          message:
            'No type assertions. Let the discriminant checks prove each shape.',
        },
        {
          kind: 'no-any',
          message:
            'Keep the event types precise. An any would disable narrowing entirely.',
        },
      ],
      tests: [
        {
          name: 'formats a join',
          args: [{ kind: 'user-joined', username: 'ada' }],
          expected: 'ada joined',
        },
        {
          name: 'formats a leave',
          args: [{ kind: 'user-left', username: 'grace' }],
          expected: 'grace left',
        },
        {
          name: 'formats a message',
          args: [{ kind: 'message', from: 'ada', text: 'hello there' }],
          expected: 'ada: hello there',
        },
        {
          name: 'keeps an empty message honest',
          args: [{ kind: 'message', from: 'ada', text: '' }],
          expected: 'ada: ',
        },
        {
          name: 'formats a reaction instead of dropping it',
          args: [{ kind: 'reaction', from: 'grace', emoji: ':+1:' }],
          expected: 'grace reacted with :+1:',
        },
      ],
      typeFixture: `${consoleShim}
const formattedSample: string = formatEvent({
  kind: 'message',
  from: 'ada',
  text: 'hi',
})
void formattedSample

// @ts-expect-error event kinds outside AppEvent are rejected
formatEvent({ kind: 'typing', from: 'ada' })

// @ts-expect-error a reaction event requires its emoji field
formatEvent({ kind: 'reaction', from: 'ada' })
`,
    },
    {
      id: 'impossible-states-review',
      kind: 'written',
      completionMode: 'submitted-with-reference-review',
      title: 'Explain why the tagged union wins',
      prompt:
        "A teammate models a background job as `{ running: boolean; failed?: string; result?: number }` and asks why you keep pushing for a discriminated union instead. In your own words, explain: which values the flags shape allows that no real job can be in, what a discriminated union does to those values, how checking the discriminant changes what the compiler lets each branch do, and what the never-typed default in a switch buys when the union grows. Finish with one case where an optional field is still the right model. Use a short example of your own.",
      estimatedMinutes: 10,
      referenceAnswer:
        "The flags shape allows combinations no real job can be in. running, failed, and result vary independently, so `{ running: true, failed: 'disk full', result: 42 }` compiles, and every consumer has to decide which field wins. Different call sites will decide differently, and the compiler cannot object, because the type says all eight combinations are legal when only three describe a job.\n\nA discriminated union deletes the impossible five instead of documenting around them. `{ status: 'running' } | { status: 'failed'; reason: string } | { status: 'done'; result: number }` gives each state exactly its own fields, so the contradictory value above is not merely discouraged, it cannot be constructed: the compiler rejects a running job carrying a result as an unknown property, and a failed job missing its reason as an incomplete one.\n\nNarrowing is what makes the union pleasant to consume. Checking `job.status === 'done'` narrows the whole object, so inside that branch `job.result` is a plain number, with no undefined to fend off, while in other branches reading `result` at all is a compile error. The check that routes the program is the same check that convinces the compiler.\n\nThe never-typed default is insurance against growth. When all cases are handled, the switched value has type never in the default branch, so `const unhandled: never = job` compiles. Add a 'canceled' member next quarter and that assignment fails in every switch that has not handled it, turning a silent runtime gap into a list of compile errors with locations.\n\nOptional fields still fit data that is genuinely independent of everything else. A job's `description?: string` is fine: present or absent, it contradicts nothing. The rule of thumb is that optionality models missing data, while a union models mutually exclusive states.",
      rubric: [
        {
          id: 'impossible-states',
          label: 'Impossible states',
          description:
            'Names a concrete contradictory value the flags shape accepts, and explains that the union makes such values unconstructible rather than merely discouraged.',
        },
        {
          id: 'narrowing-effect',
          label: 'Narrowing effect',
          description:
            'Explains that checking the discriminant narrows the whole object, making each branch see exactly its own fields and rejecting reads of fields from other states.',
        },
        {
          id: 'never-tripwire',
          label: 'Exhaustiveness tripwire',
          description:
            'Explains that a never-typed default compiles only while every member is handled, so a new union member becomes a compile error at each unhandled switch.',
        },
        {
          id: 'optional-when-right',
          label: 'When optional is right',
          description:
            'Gives a case where an optional field is the correct model, distinguishing independent missing data from mutually exclusive states.',
        },
      ],
    },
  ],
  approaches: {
    'describe-union-fields': [
      {
        name: 'Explicit checks, most specific first',
        code: `export function describeField(
  value: string | number | boolean | null,
): string {
  // Compare against null directly; a truthiness check would also
  // swallow the empty string, zero, and false.
  if (value === null) {
    return 'empty'
  }

  // Each typeof check narrows value for its branch and removes
  // that member from the union for the branches below.
  if (typeof value === 'string') {
    return \`text:\${value}\`
  }
  if (typeof value === 'number') {
    return \`count:\${value}\`
  }

  // Only boolean remains, so truthiness is finally safe to use.
  return value ? 'flag:on' : 'flag:off'
}`,
        explanation:
          "The order of checks carries the safety. null is ruled out first with a direct comparison, because typeof null is 'object' and a truthiness check would misfile the falsy members of every other type. After the string and number branches return, the compiler has subtracted three members from the union, so the final line sees plain boolean, and there the value itself can pick between on and off. The guarantee worth naming: each branch only compiles because the check above it proved the type, so reordering or deleting a check produces a compile error, not a silent misroute.",
        complexity: 'O(1) time and space.',
      },
    ],
    'refactor-request-state': [
      {
        name: 'Three tagged members and a switch',
        code: `type RequestState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'success'; data: string[] }

export function summarizeRequest(state: RequestState): string {
  switch (state.status) {
    case 'loading':
      // Narrowed to the loading member: nothing else to read.
      return 'still loading'
    case 'error':
      // message exists and is required on this member.
      return \`failed: \${state.message}\`
    case 'success':
      // data is a plain string[] here, so no ?. or ?? is needed.
      return \`loaded \${state.data.length} (\${state.data.join(', ')})\`
    default: {
      // With every member handled, state is never here. A new
      // member turns this assignment into a compile error.
      const unhandled: never = state
      return unhandled
    }
  }
}`,
        explanation:
          'The refactor moves the correctness burden from every consumer to the one type definition. Each member declares exactly its own fields, so the impossible combinations the flags shape allowed cannot be constructed, and the switch reads each field without the ?. and ?? fallbacks the original needed to survive maybe-missing data. The never-typed default is optional for passing the tests but cheap insurance: it keeps this function honest if RequestState grows a fourth state later. The guarantee worth naming: there is no reachable branch in which the function must guess which field to trust, because no value of the union carries a contradiction.',
        complexity:
          'O(n) time in the joined data length for the success case; O(1) for the others.',
      },
    ],
    'exhaustive-event-formatting': [
      {
        name: 'Exhaustive switch with a never tripwire',
        code: `type AppEvent =
  | { kind: 'user-joined'; username: string }
  | { kind: 'user-left'; username: string }
  | { kind: 'message'; from: string; text: string }
  | { kind: 'reaction'; from: string; emoji: string }

export function formatEvent(event: AppEvent): string {
  switch (event.kind) {
    case 'user-joined':
      return \`\${event.username} joined\`
    case 'user-left':
      return \`\${event.username} left\`
    case 'message':
      return \`\${event.from}: \${event.text}\`
    case 'reaction':
      return \`\${event.from} reacted with \${event.emoji}\`
    default: {
      // With all four kinds handled, event is never here. A fifth
      // kind makes this assignment fail to compile, naming the
      // missed member and this exact location.
      const unhandled: never = event
      return unhandled
    }
  }
}`,
        explanation:
          "Each case checks the discriminant, so the compiler narrows event for that branch and every field read is proven rather than asserted. That is what the original's assertions were papering over: `event as { kind: string; username: string }` claimed a shape without evidence, and the claim would keep compiling even after the union changed underneath it. The catch-all return was the sharper bug, because it gave every unhandled member a legal-looking output; reactions were silently mislabeled, and any future member would be too. The never-typed default inverts that failure mode. Instead of new members flowing to a wrong string at runtime, they stop compilation at this line, which is the behavior you want from a union that other people will grow.",
        complexity:
          'O(1) time and space per event, plus the length of the formatted string.',
      },
    ],
  },
}
