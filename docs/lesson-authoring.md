# Lesson authoring

Use this guide when adding or revising concepts, exercises, reference answers,
or curriculum tests. Lessons teach intermediate full-stack TypeScript engineers
through concrete interview problems and practical engineering decisions.

## Start with the existing lesson

Each directory in `src/curriculum/lessons/` contains `concept.mdx`, `index.ts`,
and `index.test.ts`. The registry discovers lesson modules automatically and
orders them by their `order` field. Use the current
[Lesson and Problem types](../src/curriculum/types.ts) as the data contract.
Preserve existing slugs and problem IDs when revising content because URLs and
saved progress depend on them.

Read [Dynamic programming fundamentals](../src/curriculum/lessons/16-dynamic-programming-fundamentals/concept.mdx)
for the teaching voice. Consult the relevant track example for problem shapes:

| Track | Example | Emphasis |
| --- | --- | --- |
| Algorithms | [Sliding window](../src/curriculum/lessons/03-sliding-window/index.ts) | At least two distinct coding problems, usually three, before optional written or design review |
| JavaScript and TypeScript | [Scope, closures, and prototypes](../src/curriculum/lessons/21-scope-closures-and-prototypes/index.ts) | Observable runtime behavior, debugging, and compiler-backed type guarantees |
| React and frontend | [React component design](../src/curriculum/lessons/33-react-component-design/index.ts) | Components that render and respond to interaction, state ownership, and API design |
| Backend and data | [API design and resource modeling](../src/curriculum/lessons/47-api-design-and-resource-modeling/index.ts) | Pure TypeScript boundary logic, SQL/HTTP examples, and concrete design tradeoffs |
| Testing and design | [Unit testing strategy](../src/curriculum/lessons/55-unit-testing-strategy/index.ts) | Diagnose a failure, explain the fix, and state when the principle does not apply |

## Teach the concept

- Open with a concrete problem or observable failure before naming the technique.
  Explain every new term in plain words, and connect each section to the last.
- Spend the most explanation on the hardest step. Walk it through on a small
  input, including exact outputs, instead of asserting that it works.
- Write connected paragraphs with varied sentence lengths. Keep language literal
  and tie each explanation to the attached practice problems.
- State input shape, ordering, casing, mutation, and complexity assumptions before
  they affect the example. Show how a representation is constructed and used;
  explain compact keys, tuples, masks, and encodings before relying on them.
- Use complete TypeScript examples with defined setup values and language-tagged
  fences. Introduce each code block with the problem it solves. Label necessary
  pseudocode explicitly and keep it out of runnable-looking fences.
- Use teaching comments to explain reasoning, invariants, pointer updates, and
  failure modes. Reference approaches should model readable production code.
- Distinguish compiler diagnostics, runtime exceptions, logs, and return values.
  State module/script, strict-mode, browser/Node.js, and compiler assumptions
  where they affect behavior. Types do not validate external runtime data.
- For JS/TS concepts, progress from concrete behavior to a plain explanation,
  a complete example, a common failure, a practical rule, and practice.
- Add a diagram when it explains relationships or movement better than code.
  Introduce it in prose, give it a caption, and explain required information in
  text too. Use existing MDX diagrams and terminal transcripts; verify mobile,
  light-theme, and dark-theme rendering.
- Use realistic public interview patterns or practical scenarios. Attribute any
  company-specific claim to a reliable public source. Do not copy proprietary,
  confidential, or paywalled prompts.

## Choose a practice progression

Usually use three problems: isolate the concept, apply it under realistic
constraints, then test deeper reasoning or adaptation. Two are enough for a
narrow lesson; a fourth must add a distinct skill. Algorithm lessons may use
five when three distinct coding problems benefit from written/design review.
Avoid near-duplicate exercises and counts chosen merely to fill a quota.

| Kind | Use when the learner needs to |
| --- | --- |
| `code` | Implement a function or type contract |
| `debug` | Diagnose and repair a failure |
| `refactor` | Improve structure while preserving behavior |
| `react-code` | Implement or repair a component and exercise its interactions |
| `trace` | Predict execution order, values, or state transitions |
| `written` | Explain a tradeoff, safety guarantee, or testing decision |
| `design` | Specify APIs, data models, state ownership, or system boundaries |

Each problem must exercise something taught in the concept page. Include concrete
inputs and exact expected outputs in runnable prompts. Function starters export
the required function and include a sample `console.log` call using the prompt's
example; React starters export the named component. Keep auto-graded outputs
deterministic, including array ordering, and include useful reference material
for every problem.

## Match grading to the skill

- Function exercises use behavior tests. Cover normal inputs, empty/minimal inputs
  where relevant, repeated values where relevant, and cases that catch the main
  incorrect approaches. Refactor exercises also run their static checks.
- Type-system exercises use `typeFixture` on code, debug, or refactor problems.
  Test accepted and rejected inputs, outputs, and inference with compiler-backed
  assertions and `@ts-expect-error`. Sucrase and text checks do not prove type
  safety. Add behavior tests whenever code handles runtime values, including
  malformed external data.
- The fixed compiler options live in
  [typeGrader.ts](../src/runtime/typeGrader.ts). Changes to those options affect
  passing submissions and require reviewing the affected fixtures. Fixtures are
  hidden from the exercise UI but remain inspectable in the browser.
- React exercises execute TSX with React and linkedom inside a sandbox worker.
  Use declarative props, click/type steps, and text expectations from the current
  types. Imports are limited to React. The harness has no real layout, navigation,
  or focus management; it cannot prove visual behavior or full accessibility.
- Trace exercises grade structured answers deterministically. Verify every
  expected value and ordering against the stated execution environment.
- Written and design exercises are guided self-review. Written answers unlock
  reference reveal, after which the learner can mark the work reviewed; their
  optional rubric is advisory. Design completion requires answered sections,
  reference reveal, and all rubric items checked. Never describe either as
  automatic verification of correctness.

Explain time and space complexity when meaningful. Otherwise discuss the actual
safety guarantee, runtime behavior, API tradeoff, or failure mode. Keep lessons
and grading usable without an account or backend. See
[Architecture](architecture.md) for the execution and persistence boundaries.

## Before finishing a lesson change

1. Review the concept, prompt, starter, tests, and reference together. Confirm
   they agree on inputs, output shape, assumptions, and the skill being taught.
2. Run the affected lesson tests. Check that reference solutions pass and the
   main incorrect approaches fail, including compiler fixtures where relevant.
3. Verify every problem has a reachable completion path. Review written/design
   rubrics against the lesson rather than using generic criteria.
4. Run `bun run test`, `bun run lint`, and `bun run build`. For runtime changes,
   also run the browser checks described in [Deployment](../DEPLOYMENT.md#local-checks).
5. Inspect changed lesson presentation on mobile and desktop, with keyboard
   navigation and both themes. Check diagrams, transcripts, prompts, and editors.
