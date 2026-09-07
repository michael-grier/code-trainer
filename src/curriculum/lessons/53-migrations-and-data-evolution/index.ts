import Concept from './concept.mdx'

import type { Lesson } from '../../types'

const migrationFolder = [
  { version: 3, name: 'add_total_cents' },
  { version: 1, name: 'create_orders' },
  { version: 2, name: 'add_status' },
]

export const lesson: Lesson = {
  slug: 'migrations-and-data-evolution',
  title: 'Migrations and Data Evolution',
  summary:
    'Plan schema changes, backfills, rollbacks, and compatibility windows.',
  track: 'backend-data',
  order: 53,
  concept: Concept,
  problems: [
    {
      id: 'plan-migration-run',
      kind: 'code',
      completionMode: 'all-tests-pass',
      title: 'Plan which migrations to run',
      prompt:
        'Implement `planMigrationRun`, the check a migration tool performs before executing anything. It receives the versions already applied to the database and the migrations found in the folder as `{ version, name }` in arbitrary order. Return `{ ok: true, toRun }` with the unapplied migrations sorted by ascending version, or `{ ok: false, error: { code, version } }` for the first problem found, checking in this order: "duplicate_version" if two folder migrations share a version (report that version); "unknown_applied" if an applied version has no migration in the folder (report the first such applied version in the order given); "out_of_order" if an unapplied migration has a lower version than the highest applied one (report the lowest such version). Example: `planMigrationRun([1, 2], [{ version: 3, name: "add_total_cents" }, { version: 1, name: "create_orders" }, { version: 2, name: "add_status" }])` returns `{ ok: true, toRun: [{ version: 3, name: "add_total_cents" }] }`.',
      estimatedMinutes: 20,
      functionName: 'planMigrationRun',
      starter: `type Migration = { version: number; name: string }

type MigrationPlan =
  | { ok: true; toRun: Migration[] }
  | {
      ok: false
      error: {
        code: 'duplicate_version' | 'unknown_applied' | 'out_of_order'
        version: number
      }
    }

export function planMigrationRun(
  applied: number[],
  available: Migration[],
): MigrationPlan {
  return { ok: true, toRun: [] }
}

console.log(
  planMigrationRun(
    [1, 2],
    [
      { version: 3, name: 'add_total_cents' },
      { version: 1, name: 'create_orders' },
      { version: 2, name: 'add_status' },
    ],
  ),
)
`,
      tests: [
        {
          name: 'runs everything in version order on a fresh database',
          args: [[], migrationFolder],
          expected: {
            ok: true,
            toRun: [
              { version: 1, name: 'create_orders' },
              { version: 2, name: 'add_status' },
              { version: 3, name: 'add_total_cents' },
            ],
          },
        },
        {
          name: 'skips migrations already applied',
          args: [[1, 2], migrationFolder],
          expected: { ok: true, toRun: [{ version: 3, name: 'add_total_cents' }] },
        },
        {
          name: 'returns an empty run when everything is applied',
          args: [[1, 2, 3], migrationFolder],
          expected: { ok: true, toRun: [] },
        },
        {
          name: 'rejects two migrations with the same version',
          args: [
            [],
            [
              { version: 1, name: 'a' },
              { version: 1, name: 'b' },
            ],
          ],
          expected: { ok: false, error: { code: 'duplicate_version', version: 1 } },
        },
        {
          name: 'rejects an applied version that no longer exists in the folder',
          args: [[1, 4], migrationFolder],
          expected: { ok: false, error: { code: 'unknown_applied', version: 4 } },
        },
        {
          name: 'rejects an unapplied migration older than one already applied',
          args: [[1, 3], migrationFolder],
          expected: { ok: false, error: { code: 'out_of_order', version: 2 } },
        },
        {
          name: 'reports the duplicate before checking applied versions',
          args: [
            [9],
            [
              { version: 2, name: 'a' },
              { version: 2, name: 'b' },
            ],
          ],
          expected: { ok: false, error: { code: 'duplicate_version', version: 2 } },
        },
      ],
    },
    {
      id: 'fix-cents-backfill',
      kind: 'debug',
      completionMode: 'all-tests-pass',
      title: 'Fix the backfill that loses a cent',
      prompt:
        'backfillCents is the transform a backfill job applies to each batch while migrating order totals from decimal dollars to integer cents. It receives rows `{ id, total }` where `total` is a number of dollars or null when the total was never recorded, and returns rows `{ id, totalCents }` in the same order. A known total must become the nearest whole number of cents. An unknown total must stay unknown: `totalCents` is null. Finance found that orders for 19.99 were migrated as 1998 cents and that orders with no total now show 0. Fix both. Example: `backfillCents([{ id: 1, total: 19.99 }, { id: 2, total: null }])` returns `[{ id: 1, totalCents: 1999 }, { id: 2, totalCents: null }]`.',
      estimatedMinutes: 10,
      functionName: 'backfillCents',
      brokenCode: `type OldRow = { id: number; total: number | null }

type NewRow = { id: number; totalCents: number | null }

export function backfillCents(rows: OldRow[]): NewRow[] {
  return rows.map((row) => ({
    id: row.id,
    // Cents are whole numbers, so drop anything after the decimal point.
    totalCents: row.total === null ? 0 : Math.trunc(row.total * 100),
  }))
}

console.log(
  backfillCents([
    { id: 1, total: 19.99 },
    { id: 2, total: null },
  ]),
)
`,
      bugHints: [
        'Evaluate 19.99 * 100 in JavaScript before deciding how to turn it into a whole number.',
        'Truncation and rounding differ exactly when floating point lands a hair below the intended value.',
        'A null total means the value was never known. What does writing 0 claim about that order?',
      ],
      tests: [
        {
          name: 'converts a whole-dollar total',
          args: [[{ id: 1, total: 20 }]],
          expected: [{ id: 1, totalCents: 2000 }],
        },
        {
          name: 'converts 19.99 to 1999, not 1998',
          args: [[{ id: 1, total: 19.99 }]],
          expected: [{ id: 1, totalCents: 1999 }],
        },
        {
          name: 'converts 0.29 to 29, not 28',
          args: [[{ id: 2, total: 0.29 }]],
          expected: [{ id: 2, totalCents: 29 }],
        },
        {
          name: 'keeps an unknown total unknown instead of inventing zero',
          args: [[{ id: 3, total: null }]],
          expected: [{ id: 3, totalCents: null }],
        },
        {
          name: 'converts zero to zero',
          args: [[{ id: 4, total: 0 }]],
          expected: [{ id: 4, totalCents: 0 }],
        },
        {
          name: 'handles a batch with mixed rows in order',
          args: [
            [
              { id: 1, total: 19.99 },
              { id: 2, total: null },
              { id: 3, total: 1.1 },
            ],
          ],
          expected: [
            { id: 1, totalCents: 1999 },
            { id: 2, totalCents: null },
            { id: 3, totalCents: 110 },
          ],
        },
        {
          name: 'returns an empty batch unchanged',
          args: [[]],
          expected: [],
        },
      ],
    },
    {
      id: 'total-cents-migration-plan',
      kind: 'design',
      completionMode: 'submitted-with-rubric-review',
      title: 'Plan the total to total_cents migration',
      prompt:
        'Plan the migration from decimal dollars to integer cents on a live orders table under rolling deploys, and defend how you would back out of it.',
      estimatedMinutes: 25,
      scenario:
        'The shop\'s orders table holds two million rows with a `total numeric(10,2)` column in dollars. Lesson 52\'s conditional updates need an integer `total_cents` column instead. The application runs on six instances that a deploy replaces one at a time over about ten minutes, so for that window two versions of the code run against the same database. Reports run against the table for up to a minute at a time throughout the day. The team must be able to roll back any single deploy without losing orders. A teammate has proposed doing it in one migration: add total_cents NOT NULL DEFAULT 0, update every row to set it from total, drop total, and ship the new code in the same deploy.',
      sections: [
        {
          id: 'steps',
          type: 'entity-list',
          label: 'Deploys and migrations',
          prompt:
            'List each deploy in order. For each, give the migration statements it runs (if any) and what the application code reads and writes, so that at every point old and new code both work.',
        },
        {
          id: 'backfill',
          type: 'short-answer',
          label: 'The backfill',
          prompt:
            'Describe how the two million rows get their total_cents value: batch size and boundaries, what makes a batch safe to rerun, how rows written during the backfill are handled, and when the NOT NULL constraint is added.',
        },
        {
          id: 'locks',
          type: 'tradeoff',
          label: 'Schema changes under load',
          prompt:
            'Reports hold the table for up to a minute. Choose how the ALTER TABLE statements are run and justify it with what happens to the application while an ALTER waits.',
          options: [
            'Run each ALTER with a short lock_timeout and retry until it acquires the lock',
            'Run the ALTERs during a scheduled maintenance window with the application stopped',
          ],
        },
        {
          id: 'rollback',
          type: 'short-answer',
          label: 'Rolling back',
          prompt:
            'For each deploy, state what a rollback to the previous code version does and why it is safe, and explain what breaks in the teammate\'s single-migration proposal if the new code has to be rolled back.',
        },
      ],
      rubric: [
        {
          id: 'expand-migrate-contract',
          label: 'Expand, migrate, contract in separate deploys',
          description:
            'Adds total_cents nullable (or with a constant default) first, has code write both columns, backfills, switches reads, stops writing total, and drops total only in a later deploy after no running code references it.',
        },
        {
          id: 'compatible-at-every-step',
          label: 'Old and new code both work at every step',
          description:
            'For each deploy, states what the previous and current code versions read and write and shows the schema satisfies both during the rolling window.',
        },
        {
          id: 'batched-idempotent-backfill',
          label: 'Backfill is batched and idempotent',
          description:
            'Backfills in bounded id ranges each in its own transaction, filters on total_cents IS NULL so batches can rerun, relies on dual writes for rows inserted meanwhile, verifies no nulls remain, and only then sets NOT NULL.',
        },
        {
          id: 'lock-tradeoff',
          label: 'Lock behavior argued from the queue',
          description:
            'Either option can earn credit, but the answer must explain that a waiting ALTER queues every subsequent query behind it, and weigh lock_timeout with retry against the cost of a maintenance window.',
        },
        {
          id: 'rollback-safety',
          label: 'Rollback reasoned per deploy',
          description:
            'Shows each deploy can be rolled back to the previous code because the schema it expects still exists, and identifies that the single-migration proposal drops total so old code cannot come back and the DEFAULT 0 backfill (or a dropped column) loses information.',
        },
      ],
      referenceAnswer:
        'Deploys. Deploy 1, expand: migration adds total_cents integer, nullable, no default, which is a catalog-only change; code writes both total and total_cents on every insert and update and still reads total. Old code, still running during the rollout, reads and writes total only and is unaffected; rows it writes have a null total_cents, which the backfill will fill. Deploy 2, migrate: a backfill job fills total_cents for existing rows, and once the null count is zero a migration sets NOT NULL; code switches reads to total_cents while still writing both. Deploy 3, contract: code stops writing total. Deploy 4: migration drops total, after confirming no instance of any older version is running. Each deploy changes one thing, and the schema at every step is usable by the code version before and after it.\n\nBackfill. UPDATE orders SET total_cents = round(total * 100) WHERE id BETWEEN lo AND hi AND total_cents IS NULL, in ranges of ten to fifty thousand ids, each its own transaction, with a short pause between batches so reports and requests get the table back. The IS NULL filter makes a batch idempotent: a rerun after a crash skips rows already converted. Rows inserted or updated during the backfill already carry total_cents because deploy 1 made the code write both, so the batches skip them too. The multiplication happens in SQL on numeric, which is exact; if it ran in application code it would round, never truncate. When SELECT count(*) WHERE total_cents IS NULL returns zero, ALTER TABLE ... SET NOT NULL, which scans the table once but rewrites nothing.\n\nLocks. I would run each ALTER with SET lock_timeout = \'2s\' inside a retry loop. An ALTER TABLE waits for any transaction using the table, and while it waits every new query, including plain reads, queues behind it, so a one-minute report turns a one-millisecond schema change into a minute-long outage for the whole application. With the timeout the ALTER gives up after two seconds, the queued requests proceed, and the tool retries until it lands in a gap between reports. A maintenance window also works and is simpler, but it costs downtime for a change that needs none, and the team has to find one every time they touch the schema.\n\nRollback. Rolling back deploy 1 returns to code that reads and writes total, which still exists; the nullable total_cents column is ignored. Rolling back deploy 2 returns to code that reads total and writes both, both columns exist and are filled. Rolling back deploy 3 returns to writing both, harmless. Deploy 4 is the only irreversible step, which is why it runs last and only after every older version is gone; rolling back after it means restoring the column by a new forward migration from total_cents. The teammate\'s proposal fails on both counts. Dropping total in the same deploy as the code means the old instances fail on every query during the ten-minute rollout, and if the new code has a bug there is nothing to roll back to, because the column it needs is gone. The DEFAULT 0 also stamps every existing row with zero cents before the update runs, and any row the update misses or any order with an unknown total now asserts a total of zero, which is a fact the data never held.',
    },
    {
      id: 'compatibility-window-review',
      kind: 'written',
      completionMode: 'submitted-with-reference-review',
      title: 'Explain the compatibility window',
      prompt:
        'A teammate argues that since the migration and the code ship in the same pull request, they are one change and can be applied together. In your own words: why did the opener\'s rename break the running application, what is the window during which two code versions share one schema, what rule must every migration satisfy because of it, why is undoing a migration a forward migration rather than a down script, and which statements in the lesson were fast and which locked or rewrote the table? Use the opener\'s rename as the running example.',
      estimatedMinutes: 12,
      referenceAnswer:
        'The rename broke the application because a deploy is not instantaneous. The migration ran in a moment, but the six instances were replaced one at a time over minutes, and every old instance that served a request in that window asked for a column named total that no longer existed. Reads and inserts both failed. The pull request was one change to the repository, but in production the schema changed at one instant and the code changed over a window, and during that window the schema served two versions of the code.\n\nThat window is the compatibility window, and it is wider than a deploy: it lasts as long as a rollback to the previous version is possible, which is until the next deploy is proven good. The rule that follows is that every migration must leave a schema both the previous code version and the new one can use. Adding a nullable column satisfies it, since old code ignores columns it does not know. Renaming or dropping a column does not, because old code names the old column. So a rename becomes expand, migrate, contract: add total_cents, have new code write both and read total, backfill, switch reads, stop writing total, and drop it only when no running version mentions it. Each step is compatible with its neighbors.\n\nUndoing a migration is a forward migration because down scripts are untested code run under pressure, and because some steps cannot be undone by any script: a dropped column\'s data is gone. The pattern above makes rollback a code operation instead. Rolling back the code after the expand step lands on a schema that still has total, so nothing breaks. The only destructive step, dropping total, is scheduled last, after the rollback target no longer needs it, and if it ever has to be reversed the answer is a new forward migration that recreates the column from total_cents, reviewed and tested like any other.\n\nOn cost: adding a nullable column or one with a constant default took a millisecond, because it changes only the catalog. Adding a NOT NULL column with no default failed outright on a populated table. A column with a per-row computed default rewrites every row under a lock, as does a single-statement backfill, which is why the backfill ran in batches with an IS NULL filter. And ALTER TABLE itself is fast but must acquire an exclusive lock; waiting for a long report while every new query queued behind it turned a one-millisecond change into a three-second stall for a simple read, which a lock_timeout of one second prevented by making the migration fail fast and retry later.',
      rubric: [
        {
          id: 'window-explained',
          label: 'Explains the compatibility window',
          description:
            'States that code rolls out over time while the schema changes at once, so old and new code share one schema during the deploy and for as long as rollback is possible.',
        },
        {
          id: 'compatibility-rule',
          label: 'States the migration rule and applies it',
          description:
            'Every migration must leave a schema usable by both the previous and the new code, and the rename is restructured into expand, migrate, contract steps that each satisfy it.',
        },
        {
          id: 'forward-rollback',
          label: 'Rollback as a forward migration',
          description:
            'Explains that down scripts are untested and cannot restore dropped data, that keeping the old column makes rollback a code-only operation, and that reversing the final drop means a new forward migration.',
        },
        {
          id: 'cost-awareness',
          label: 'Distinguishes fast from locking changes',
          description:
            'Identifies catalog-only additions as fast, NOT NULL without default as failing, computed defaults and single-statement backfills as table rewrites, and a waiting ALTER as a queue that lock_timeout prevents.',
        },
      ],
    },
  ],
  approaches: {
    'plan-migration-run': [
      {
        name: 'Validate the folder, then the ledger, then the order',
        code: `type Migration = { version: number; name: string }

type MigrationPlan =
  | { ok: true; toRun: Migration[] }
  | {
      ok: false
      error: {
        code: 'duplicate_version' | 'unknown_applied' | 'out_of_order'
        version: number
      }
    }

export function planMigrationRun(
  applied: number[],
  available: Migration[],
): MigrationPlan {
  // Sort a copy so the folder order never matters and the input is untouched.
  const sorted = [...available].sort((a, b) => a.version - b.version)

  // Two scripts with one version means two branches picked the same number.
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i].version === sorted[i - 1].version) {
      return {
        ok: false,
        error: { code: 'duplicate_version', version: sorted[i].version },
      }
    }
  }

  // An applied version with no script means the folder and the database
  // disagree about history, which no run should paper over.
  const known = new Set(sorted.map((migration) => migration.version))
  for (const version of applied) {
    if (!known.has(version)) {
      return { ok: false, error: { code: 'unknown_applied', version } }
    }
  }

  // Anything unapplied must be newer than everything applied; otherwise an
  // old branch merged after a newer migration ran, and order is lost.
  const appliedSet = new Set(applied)
  const highestApplied = applied.length > 0 ? Math.max(...applied) : -Infinity
  const toRun: Migration[] = []

  for (const migration of sorted) {
    if (appliedSet.has(migration.version)) continue
    if (migration.version < highestApplied) {
      return {
        ok: false,
        error: { code: 'out_of_order', version: migration.version },
      }
    }
    toRun.push(migration)
  }

  return { ok: true, toRun }
}`,
        explanation:
          'The planner refuses to run anything until three invariants hold, in an order that reports the most fundamental problem first. Duplicate versions are checked on the sorted folder by comparing neighbors, which is why sorting happens before anything else. Unknown applied versions come next, because if the database records history the folder cannot explain, no plan built from the folder can be trusted. Only then does it build the run list: walking the sorted folder, skipping applied versions, and stopping at the first unapplied version that is lower than the highest applied one, which is the signature of an old branch merged late. Because the walk is in ascending order, the first violation found is also the lowest, matching the prompt. The happy path falls out of the same walk, so the returned list is already sorted.',
        complexity:
          'O(n log n) time for n folder migrations, dominated by the sort, O(n) space. The guarantee that matters is that no migration runs out of order and no unexplained history is silently accepted.',
      },
    ],
    'fix-cents-backfill': [
      {
        name: 'Round, and keep unknown unknown',
        code: `type OldRow = { id: number; total: number | null }

type NewRow = { id: number; totalCents: number | null }

export function backfillCents(rows: OldRow[]): NewRow[] {
  return rows.map((row) => ({
    id: row.id,
    // A missing total stays missing: writing 0 would assert a fact the data
    // never held. A known total is rounded, because 19.99 * 100 is
    // 1998.9999999999998 in floating point and truncation loses the cent.
    totalCents: row.total === null ? null : Math.round(row.total * 100),
  }))
}`,
        explanation:
          'Both bugs are one-word changes and both would have corrupted two million rows silently. Multiplying a decimal dollar amount by 100 in binary floating point often lands a hair below the intended integer, so Math.trunc turns 1998.9999999999998 into 1998 and 28.999999999999996 into 28; Math.round recovers the intended 1999 and 29. The second bug is a data-modeling error rather than an arithmetic one: a null total means the value was never recorded, and replacing it with 0 converts "unknown" into "free," which downstream reports and lesson 52\'s conditional updates would treat as true. The new column stays nullable for exactly those rows, and deciding what to do about them is a business question, not something a backfill should answer on its own.',
        complexity:
          'O(n) time and space for n rows. The guarantee that matters is that every known total converts to the nearest cent and no unknown total becomes a number.',
      },
    ],
  },
}
