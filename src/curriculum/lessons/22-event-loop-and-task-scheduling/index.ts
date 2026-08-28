import Concept from './concept.mdx'

import type { Lesson } from '../../types'

export const lesson: Lesson = {
  slug: 'event-loop-and-task-scheduling',
  title: 'Event Loop and Task Scheduling',
  summary: 'Trace task queues, microtasks, timers, and async ordering.',
  track: 'js-ts-core',
  order: 22,
  concept: Concept,
  problems: [
    {
      id: 'sync-timer-promise-trace',
      kind: 'trace',
      completionMode: 'structured-answer-correct',
      title: 'Predict the order of a mixed schedule',
      prompt:
        'A form script logs synchronously, schedules an autosave with a zero-delay timer, and schedules two promise reactions. Read it without running it, predict the console output in order, and answer the questions.',
      estimatedMinutes: 10,
      code: `console.log('form loaded')

setTimeout(() => console.log('draft saved'), 0)

Promise.resolve().then(() => console.log('input validated'))
Promise.resolve().then(() => console.log('preview rendered'))

console.log('form ready')
`,
      questions: [
        {
          id: 'output-order',
          type: 'output-order',
          label: 'Which lines print, in order?',
          options: [
            'draft saved',
            'form loaded',
            'form ready',
            'input validated',
            'preview rendered',
          ],
          expected: [
            'form loaded',
            'form ready',
            'input validated',
            'preview rendered',
            'draft saved',
          ],
        },
        {
          id: 'why-timer-last',
          type: 'multiple-choice',
          label:
            "The timer asked for a 0 ms delay. Why does 'draft saved' still print last?",
          options: [
            'setTimeout(fn, 0) means no sooner than 0 ms, and the task queue only gets a turn after the stack run and a complete microtask drain',
            'setTimeout callbacks always wait at least 4 ms, and 4 ms is longer than the promises take',
            'console.log inside a timer callback is buffered until the program ends',
            'the two promise reactions were scheduled before the timer in the source text',
          ],
          answer:
            'setTimeout(fn, 0) means no sooner than 0 ms, and the task queue only gets a turn after the stack run and a complete microtask drain',
        },
        {
          id: 'microtask-order',
          type: 'multiple-choice',
          label:
            "Why does 'input validated' print before 'preview rendered'?",
          options: [
            'microtasks run in the order they were queued, and the validated reaction was queued first',
            'shorter strings drain from the microtask queue before longer ones',
            'each .then call on a fresh promise resets the queue, so the last one queued runs last by luck',
            'the engine alphabetizes pending microtasks before draining them',
          ],
          answer:
            'microtasks run in the order they were queued, and the validated reaction was queued first',
        },
        {
          id: 'swap-scheduler',
          type: 'multiple-choice',
          label:
            "If the autosave line were changed to queueMicrotask(() => console.log('draft saved')), where would 'draft saved' print?",
          options: [
            "third, right after 'form ready', because it would join the microtask queue ahead of the two promise reactions",
            "last, unchanged, because queueMicrotask and setTimeout use the same queue",
            "first, because queueMicrotask interrupts the running script",
            "after 'input validated' but before 'preview rendered', splitting the promise reactions",
          ],
          answer:
            "third, right after 'form ready', because it would join the microtask queue ahead of the two promise reactions",
        },
      ],
      explanation:
        "The script is one stack run, so its two synchronous logs come first: 'form loaded', then 'form ready'. Along the way it queued one task (the timer) and two microtasks (the promise reactions). When the stack empties, the microtask queue drains completely in the order things were queued, printing 'input validated' and then 'preview rendered'. Only after that drain does the task queue get a turn, so 'draft saved' prints last even though its delay was zero. The zero never meant now; it meant no sooner than 0 ms, behind every pending microtask. Swapping the timer for queueMicrotask moves the autosave into the microtask queue at the front of the line, because it would be queued before either promise reaction, giving 'form loaded', 'form ready', 'draft saved', 'input validated', 'preview rendered'.",
    },
    {
      id: 'await-and-timer-trace',
      kind: 'trace',
      completionMode: 'structured-answer-correct',
      title: 'Trace an await through the microtask queue',
      prompt:
        'This program mixes an async function that suspends at await, a promise chain, and a timer that queues a microtask of its own. Predict the full console order, then answer the questions. Remember that everything after an await is queued as a microtask when the awaited value settles.',
      estimatedMinutes: 15,
      code: `async function fetchStep() {
  console.log('fetch start')
  await null
  console.log('fetch resumed')
}

console.log('script start')

setTimeout(() => {
  console.log('timeout')
  Promise.resolve().then(() => console.log('then inside timeout'))
}, 0)

fetchStep().then(() => console.log('fetch settled'))

Promise.resolve()
  .then(() => console.log('then one'))
  .then(() => console.log('then two'))

console.log('script end')
`,
      questions: [
        {
          id: 'output-order',
          type: 'output-order',
          label: 'Which lines print, in order?',
          options: [
            'fetch resumed',
            'fetch settled',
            'fetch start',
            'script end',
            'script start',
            'then inside timeout',
            'then one',
            'then two',
            'timeout',
          ],
          expected: [
            'script start',
            'fetch start',
            'script end',
            'fetch resumed',
            'then one',
            'fetch settled',
            'then two',
            'timeout',
            'then inside timeout',
          ],
        },
        {
          id: 'sync-until-await',
          type: 'multiple-choice',
          label:
            "Why does 'fetch start' print during the script run, before 'script end'?",
          options: [
            'an async function runs synchronously until its first await, and only the code after the await is deferred',
            'async functions always run their whole body synchronously and only the .then is deferred',
            "console.log calls inside async functions skip the queues entirely",
            "the call was hoisted above the setTimeout by the engine",
          ],
          answer:
            'an async function runs synchronously until its first await, and only the code after the await is deferred',
        },
        {
          id: 'settled-before-then-two',
          type: 'multiple-choice',
          label:
            "Why does 'fetch settled' print before 'then two' even though the promise chain was set up first?",
          options: [
            "resuming fetchStep queued 'fetch settled' during the drain, and 'then one' queued 'then two' after that, so the queue order is resumed, then one, settled, then two",
            "'fetch settled' is attached to an async function, and async reactions always outrank plain .then reactions",
            "the second .then in a chain waits one full task turn before it can run",
            "'then two' had to wait for the timer because chains longer than one link yield to the task queue",
          ],
          answer:
            "resuming fetchStep queued 'fetch settled' during the drain, and 'then one' queued 'then two' after that, so the queue order is resumed, then one, settled, then two",
        },
        {
          id: 'timer-microtask',
          type: 'multiple-choice',
          label:
            "When the timer finally runs, why does 'then inside timeout' print immediately after 'timeout' instead of waiting for another task turn?",
          options: [
            'the microtask queue drains completely after every stack run, including the run of a timer callback',
            'promises created inside timers are treated as tasks and run in the same turn by coincidence',
            "console output inside a timer is flushed as one block",
            'the timer callback awaited the promise before returning',
          ],
          answer:
            'the microtask queue drains completely after every stack run, including the run of a timer callback',
        },
      ],
      explanation:
        "The script run prints 'script start', queues the timer task, and calls fetchStep, which runs synchronously to its first await and prints 'fetch start'. The await suspends it, queueing its resumption as a microtask, and the script continues: the plain chain queues its first reaction, then 'script end' prints and the stack empties. Now the drain. First queued was the resumption, so 'fetch resumed' prints, which settles fetchStep's promise and queues 'fetch settled' at the back. Next in line is 'then one', which queues 'then two' behind that. The drain continues in queue order: 'fetch settled', then 'then two'. Only now does the task queue get its turn. The timer prints 'timeout' and queues one more microtask, and because the microtask queue drains completely after every stack run, 'then inside timeout' prints before the loop would ever reach another task. The whole trace is the drain rule applied four times, with await behaving as ordinary microtask scheduling.",
    },
    {
      id: 'record-execution-order',
      kind: 'code',
      completionMode: 'all-tests-pass',
      title: 'Record the true execution order of a schedule',
      prompt:
        "Implement `recordExecutionOrder`. It receives a plan: an array of steps, each with a `label` and a `phase` of 'sync', 'microtask', or 'timer'. Walk the plan once and schedule each step in its phase: run sync steps immediately, queue microtask steps with queueMicrotask, and queue timer steps with setTimeout at 0 ms. Return a promise that resolves, after every step has run, to the labels in the order they actually executed. The event loop should do the ordering; do not sort or reorder labels yourself. Example: `recordExecutionOrder([{ label: 'timer', phase: 'timer' }, { label: 'sync', phase: 'sync' }, { label: 'microtask', phase: 'microtask' }])` resolves to `['sync', 'microtask', 'timer']`, whatever order the plan listed them in.",
      estimatedMinutes: 18,
      functionName: 'recordExecutionOrder',
      starter: `type ScheduledStep = {
  label: string
  phase: 'sync' | 'microtask' | 'timer'
}

export function recordExecutionOrder(plan: ScheduledStep[]): Promise<string[]> {
  return Promise.resolve([])
}

recordExecutionOrder([
  { label: 'timer', phase: 'timer' },
  { label: 'sync', phase: 'sync' },
  { label: 'microtask', phase: 'microtask' },
]).then((order) => console.log(order))
`,
      tests: [
        {
          name: 'orders sync before microtask before timer',
          args: [
            [
              { label: 'timer', phase: 'timer' },
              { label: 'sync', phase: 'sync' },
              { label: 'microtask', phase: 'microtask' },
            ],
          ],
          expected: ['sync', 'microtask', 'timer'],
        },
        {
          name: 'keeps scheduling order within one phase',
          args: [
            [
              { label: 'micro A', phase: 'microtask' },
              { label: 'micro B', phase: 'microtask' },
              { label: 'sync A', phase: 'sync' },
            ],
          ],
          expected: ['sync A', 'micro A', 'micro B'],
        },
        {
          name: 'keeps timer scheduling order',
          args: [
            [
              { label: 'timer A', phase: 'timer' },
              { label: 'timer B', phase: 'timer' },
            ],
          ],
          expected: ['timer A', 'timer B'],
        },
        {
          name: 'handles an all-sync plan',
          args: [
            [
              { label: 'first', phase: 'sync' },
              { label: 'second', phase: 'sync' },
            ],
          ],
          expected: ['first', 'second'],
        },
        {
          name: 'resolves an empty plan',
          args: [[]],
          expected: [],
        },
        {
          name: 'timer scheduled first still runs last',
          args: [
            [
              { label: 'save', phase: 'timer' },
              { label: 'validate', phase: 'microtask' },
              { label: 'load', phase: 'sync' },
              { label: 'render', phase: 'microtask' },
            ],
          ],
          expected: ['load', 'validate', 'render', 'save'],
        },
      ],
    },
    {
      id: 'two-queues-review',
      kind: 'written',
      completionMode: 'submitted-with-reference-review',
      title: 'Explain the two queues and the drain rule',
      prompt:
        "A teammate cannot see why their zero-delay setTimeout keeps losing to promise callbacks scheduled after it. In your own words, explain: the two queues and what kind of work lands in each, the drain rule that orders them, what setTimeout(fn, 0) actually promises, and the one way the microtask queue can freeze timers out entirely. Use a short trace of your own to make the ordering concrete.",
      estimatedMinutes: 12,
      referenceAnswer:
        "JavaScript runs one stack at a time and always runs it to completion, so work triggered by timers or settled promises has to wait in a queue. There are two queues with different priorities. The task queue holds timer callbacks and similar sources such as incoming messages. The microtask queue holds promise reactions, which includes .then, .catch, and .finally callbacks, the resumption of an async function after await, and anything scheduled with queueMicrotask.\n\nThe drain rule relates them: after every stack run, the microtask queue drains completely, including microtasks queued during the drain, and only then does the task queue get one callback. After that one task runs, microtasks drain completely again before the next task. So setTimeout(fn, 0) promises only that fn will not run sooner than 0 ms. It never promises now, and it never beats a pending microtask, which is exactly why a promise callback scheduled later still prints first.\n\nA short trace makes it concrete. `console.log('a'); setTimeout(() => console.log('c'), 0); Promise.resolve().then(() => console.log('b'))` prints a, b, c: the script runs to completion, the drain runs b, and only then does the task queue deliver c.\n\nThe complete drain is also the failure mode. A microtask that queues another microtask on every run never lets the drain finish, so timers and messages starve forever. Self-queueing tasks are safe because tasks yield between turns; self-queueing microtasks are not. That asymmetry is the practical rule for choosing: queueMicrotask for work that must run before anything else observes the world, setTimeout for work that should yield.",
      rubric: [
        {
          id: 'two-queues',
          label: 'The two queues',
          description:
            'Names the task queue and the microtask queue and correctly assigns timers to the first and promise reactions, await resumptions, and queueMicrotask to the second.',
        },
        {
          id: 'drain-rule',
          label: 'Drain rule',
          description:
            'States that microtasks drain completely after every stack run, including microtasks queued during the drain, while tasks get one turn each, and shows the ordering with a concrete trace.',
        },
        {
          id: 'timeout-meaning',
          label: 'What setTimeout(fn, 0) promises',
          description:
            'Explains that the delay is a minimum, so a zero-delay timer still waits behind the current stack run and every pending microtask.',
        },
        {
          id: 'starvation',
          label: 'Starvation edge',
          description:
            'Identifies that a microtask which always queues another microtask blocks the task queue forever, and that self-queueing tasks do not have this problem.',
        },
      ],
    },
  ],
  approaches: {
    'record-execution-order': [
      {
        name: 'Schedule each phase and count completions',
        code: `type ScheduledStep = {
  label: string
  phase: 'sync' | 'microtask' | 'timer'
}

export function recordExecutionOrder(plan: ScheduledStep[]): Promise<string[]> {
  return new Promise((resolve) => {
    const order: string[] = []

    // Every step calls record when it actually runs, so the array
    // fills in true execution order, not plan order. Resolving when
    // the count matches the plan length means the promise settles
    // exactly when the last scheduled step has run.
    const record = (label: string) => {
      order.push(label)
      if (order.length === plan.length) {
        resolve(order)
      }
    }

    for (const step of plan) {
      if (step.phase === 'sync') {
        // Sync steps run right here, during the current stack run.
        record(step.label)
      } else if (step.phase === 'microtask') {
        // Microtask steps run during the drain after this stack run.
        queueMicrotask(() => record(step.label))
      } else {
        // Timer steps wait for the task queue, one turn each,
        // and 0 ms keeps the test fast without changing the order.
        setTimeout(() => record(step.label), 0)
      }
    }

    // An empty plan never calls record, so resolve it directly.
    if (plan.length === 0) {
      resolve(order)
    }
  })
}`,
        explanation:
          'The function does no ordering of its own; it hands each step to the right scheduler and lets the event loop produce the order. Sync steps land during the loop over the plan, microtask steps land during the complete drain that follows, and timer steps land one per task turn after that, each phase preserving its own queue order. The only real design decision is knowing when to resolve. Counting completed steps works for any mix of phases, where a fixed setTimeout sentinel would break if a learner-supplied plan queued later timers. The empty-plan branch matters because a promise that never resolves would hang the test run rather than fail it.',
        complexity:
          'O(n) time and space for n steps. The interesting guarantee is temporal: the promise resolves in the same task turn as the final step, so tests finish in one or two loop turns.',
      },
    ],
  },
}
