import Concept from './concept.mdx'

import type { Lesson } from '../../types'

const eventIndexes = [
  { name: 'events_customer_idx', columns: ['customer_id'] },
  { name: 'events_customer_created_idx', columns: ['customer_id', 'created_at'] },
  { name: 'events_email_idx', columns: ['email'] },
]

const selectEvents = 'SELECT id, customer_id, kind, created_at FROM events'
const orderAndLimit = ' ORDER BY created_at DESC LIMIT 50'

export const lesson: Lesson = {
  slug: 'indexes-and-query-performance',
  title: 'Indexes and Query Performance',
  summary:
    'Use indexes to support query patterns and reason about performance tradeoffs.',
  track: 'backend-data',
  order: 51,
  concept: Concept,
  problems: [
    {
      id: 'choose-index',
      kind: 'code',
      completionMode: 'all-tests-pass',
      title: 'Apply the leftmost-prefix rule',
      prompt:
        'Implement `chooseIndex`. It receives the available B-tree indexes as `{ name, columns }` and a query shape `{ equals, range?, orderBy? }`: the columns compared with equality, at most one column compared with a range, and at most one ORDER BY column. For each index, count how many leading columns it can use: walk the columns from the left while each is in `equals`; then, if the next column is the `range` column, count it too and stop. The index delivers rows already sorted when the column right after the equality prefix is the `orderBy` column and either there is no range or the range column is that same column. An index with zero usable columns that is not sorted cannot be used. Choose the index with the most usable columns; on a tie prefer one that is sorted; on a further tie prefer the earlier one in the list. Return `{ index, usedColumns, sorted }`, or `{ index: null, usedColumns: 0, sorted: false }` when no index applies. Example: `chooseIndex([{ name: "by_customer", columns: ["customer_id"] }, { name: "by_customer_created", columns: ["customer_id", "created_at"] }], { equals: ["customer_id"], orderBy: "created_at" })` returns `{ index: "by_customer_created", usedColumns: 1, sorted: true }`.',
      estimatedMinutes: 25,
      functionName: 'chooseIndex',
      starter: `type IndexDefinition = { name: string; columns: string[] }

type QueryShape = { equals: string[]; range?: string; orderBy?: string }

type IndexChoice = { index: string | null; usedColumns: number; sorted: boolean }

export function chooseIndex(
  indexes: IndexDefinition[],
  query: QueryShape,
): IndexChoice {
  return { index: null, usedColumns: 0, sorted: false }
}

console.log(
  chooseIndex(
    [
      { name: 'by_customer', columns: ['customer_id'] },
      { name: 'by_customer_created', columns: ['customer_id', 'created_at'] },
    ],
    { equals: ['customer_id'], orderBy: 'created_at' },
  ),
)
`,
      tests: [
        {
          name: 'prefers the composite index that also satisfies the ORDER BY',
          args: [eventIndexes, { equals: ['customer_id'], orderBy: 'created_at' }],
          expected: {
            index: 'events_customer_created_idx',
            usedColumns: 1,
            sorted: true,
          },
        },
        {
          name: 'uses a range on the column right after the equality prefix',
          args: [eventIndexes, { equals: ['customer_id'], range: 'created_at' }],
          expected: {
            index: 'events_customer_created_idx',
            usedColumns: 2,
            sorted: false,
          },
        },
        {
          name: 'a range column that is also the ORDER BY column delivers rows sorted',
          args: [
            eventIndexes,
            { equals: ['customer_id'], range: 'created_at', orderBy: 'created_at' },
          ],
          expected: {
            index: 'events_customer_created_idx',
            usedColumns: 2,
            sorted: true,
          },
        },
        {
          name: 'cannot use an index whose first column is not in the query',
          args: [eventIndexes, { equals: ['created_at'] }],
          expected: { index: null, usedColumns: 0, sorted: false },
        },
        {
          name: 'matches equality columns in any order',
          args: [[{ name: 'ab', columns: ['a', 'b'] }], { equals: ['b', 'a'] }],
          expected: { index: 'ab', usedColumns: 2, sorted: false },
        },
        {
          name: 'stops counting after a range column',
          args: [
            [{ name: 'abc', columns: ['a', 'b', 'c'] }],
            { equals: ['a', 'c'], range: 'b' },
          ],
          expected: { index: 'abc', usedColumns: 2, sorted: false },
        },
        {
          name: 'picks the first index on a tie',
          args: [
            [
              { name: 'first', columns: ['a'] },
              { name: 'second', columns: ['a'] },
            ],
            { equals: ['a'] },
          ],
          expected: { index: 'first', usedColumns: 1, sorted: false },
        },
        {
          name: 'returns no index when there are none',
          args: [[], { equals: ['a'] }],
          expected: { index: null, usedColumns: 0, sorted: false },
        },
        {
          name: 'an ORDER BY alone can use an index whose first column matches',
          args: [eventIndexes, { equals: [], orderBy: 'email' }],
          expected: { index: 'events_email_idx', usedColumns: 0, sorted: true },
        },
      ],
    },
    {
      id: 'fix-index-hiding-filters',
      kind: 'debug',
      completionMode: 'all-tests-pass',
      title: 'Fix the filters that hide their columns from the index',
      prompt:
        'buildEventSearch builds the query behind the event search screen. The events table stores every email in lowercase and has B-tree indexes on `email` and on `created_at`, yet EXPLAIN shows sequential scans for both filters. The text must start with `SELECT id, customer_id, kind, created_at FROM events`, add a WHERE clause only when a filter is present, and end with ` ORDER BY created_at DESC LIMIT 50`. When `email` is given, lowercase it in code and compare the raw column: `email = $n`. When `day` is given as "YYYY-MM-DD", compare the raw column against a half-open range: `created_at >= $n AND created_at < $n+1`, pushing the day and then the following day (also "YYYY-MM-DD") as two values. Filters appear in the order email, day, joined with " AND ", with placeholders numbered from $1 in push order. Example: `buildEventSearch({ email: "Ada@Example.com", day: "2026-08-31" })` returns `{ text: "SELECT id, customer_id, kind, created_at FROM events WHERE email = $1 AND created_at >= $2 AND created_at < $3 ORDER BY created_at DESC LIMIT 50", values: ["ada@example.com", "2026-08-31", "2026-09-01"] }`.',
      estimatedMinutes: 15,
      functionName: 'buildEventSearch',
      brokenCode: `type SearchFilters = { email?: string; day?: string }

type Query = { text: string; values: string[] }

export function buildEventSearch(filters: SearchFilters): Query {
  const where: string[] = []
  const values: string[] = []

  if (filters.email !== undefined) {
    values.push(filters.email)
    where.push(\`lower(email) = lower($\${values.length})\`)
  }

  if (filters.day !== undefined) {
    values.push(filters.day)
    where.push(\`date(created_at) = $\${values.length}\`)
  }

  const whereClause = where.length > 0 ? \` WHERE \${where.join(' AND ')}\` : ''

  return {
    text:
      'SELECT id, customer_id, kind, created_at FROM events' +
      whereClause +
      ' ORDER BY created_at DESC LIMIT 50',
    values,
  }
}

console.log(buildEventSearch({ email: 'Ada@Example.com', day: '2026-08-31' }))
`,
      bugHints: [
        'The index on email holds the stored values. What does the index hold for lower(email)?',
        'Which side of the comparison can be computed without touching the column? Lowercase the value in TypeScript instead.',
        'date(created_at) hides the timestamp column the same way. A day is the range from its midnight to the next midnight, and a range on the raw column can use the index.',
        'Computing the next day needs to roll over month and year ends; Date with UTC methods handles that.',
      ],
      tests: [
        {
          name: 'compares the stored lowercase email directly and lowercases the value in code',
          args: [{ email: 'Ada@Example.com' }],
          expected: {
            text: `${selectEvents} WHERE email = $1${orderAndLimit}`,
            values: ['ada@example.com'],
          },
        },
        {
          name: 'turns a day into a half-open range on the raw column',
          args: [{ day: '2026-08-01' }],
          expected: {
            text: `${selectEvents} WHERE created_at >= $1 AND created_at < $2${orderAndLimit}`,
            values: ['2026-08-01', '2026-08-02'],
          },
        },
        {
          name: 'rolls the range over a month boundary',
          args: [{ day: '2026-08-31' }],
          expected: {
            text: `${selectEvents} WHERE created_at >= $1 AND created_at < $2${orderAndLimit}`,
            values: ['2026-08-31', '2026-09-01'],
          },
        },
        {
          name: 'rolls the range over a year boundary',
          args: [{ day: '2026-12-31' }],
          expected: {
            text: `${selectEvents} WHERE created_at >= $1 AND created_at < $2${orderAndLimit}`,
            values: ['2026-12-31', '2027-01-01'],
          },
        },
        {
          name: 'combines both filters with placeholders numbered in order',
          args: [{ email: 'grace@example.com', day: '2026-08-01' }],
          expected: {
            text: `${selectEvents} WHERE email = $1 AND created_at >= $2 AND created_at < $3${orderAndLimit}`,
            values: ['grace@example.com', '2026-08-01', '2026-08-02'],
          },
        },
        {
          name: 'builds the unfiltered query with no WHERE clause',
          args: [{}],
          expected: { text: `${selectEvents}${orderAndLimit}`, values: [] },
        },
      ],
    },
    {
      id: 'book-club-index-plan',
      kind: 'design',
      completionMode: 'submitted-with-rubric-review',
      title: 'Plan the indexes for the book club workload',
      prompt:
        'Decide which indexes the book club schema needs for its real queries, which it already has, and which one you would refuse to add.',
      estimatedMinutes: 25,
      scenario:
        'The book club schema from lesson 50 is live: users (id, email UNIQUE, display_name), clubs (id, name, owner_id), memberships (user_id, club_id, joined_at, primary key on (user_id, club_id)), and picks (id, club_id, suggested_by, title, position). Production logs show six queries account for almost all load, in this order of frequency: the club detail page loads a club by id; the members tab lists a club\'s members newest-first, paginated by joined_at; the home screen lists the clubs one user belongs to; the picks tab lists a club\'s picks ordered by position; login looks a user up by email; and a search box finds clubs whose name starts with typed text. Some clubs have thousands of members. Joins and leaves happen constantly. A teammate has proposed adding an index on picks(title) "in case we search titles later".',
      sections: [
        {
          id: 'existing',
          type: 'short-answer',
          label: 'Indexes you already have',
          prompt:
            'List the indexes the schema\'s primary keys and UNIQUE constraints already create, and name the queries from the scenario they already serve without any new index.',
        },
        {
          id: 'new-indexes',
          type: 'entity-list',
          label: 'Indexes to add',
          prompt:
            'For each remaining query, give the index as table plus ordered column list, and explain the column order with the leftmost-prefix rule, including any ORDER BY the index should satisfy.',
        },
        {
          id: 'membership-index',
          type: 'tradeoff',
          label: 'The members tab',
          prompt:
            'The composite primary key on memberships is (user_id, club_id). Choose how to serve the members tab, which filters by club_id and sorts by joined_at, and justify it with the leftmost-prefix rule and the write pattern.',
          options: [
            'Add a second composite index on memberships (club_id, joined_at DESC)',
            'Reorder the primary key to (club_id, user_id) and add a single-column index on joined_at',
          ],
        },
        {
          id: 'refuse',
          type: 'short-answer',
          label: 'The index you refuse',
          prompt:
            'Respond to the proposed picks(title) index: would it serve any query in the scenario, what would it cost, and what would you say to the teammate?',
        },
      ],
      rubric: [
        {
          id: 'counts-existing',
          label: 'Counts the free indexes first',
          description:
            'Identifies that primary keys and the UNIQUE email constraint already create indexes, so club-by-id, login-by-email, and lookups by (user_id, club_id) need nothing new.',
        },
        {
          id: 'leftmost-prefix-order',
          label: 'Column order follows the leftmost-prefix rule',
          description:
            'Every proposed composite index puts the equality column first and the sort or range column last, with an explicit reason, for example memberships (club_id, joined_at) and picks (club_id, position).',
        },
        {
          id: 'foreign-keys-indexed',
          label: 'Indexes the child side of joins',
          description:
            'Recognizes that foreign key columns are not indexed automatically and adds an index on memberships.club_id (or a composite starting with it) and picks.club_id to serve the club-side lookups.',
        },
        {
          id: 'tradeoff-grounded',
          label: 'Members-tab tradeoff argued from rule and writes',
          description:
            'Either option can earn credit, but the answer must explain why the existing (user_id, club_id) key cannot serve a filter on club_id alone, and weigh the extra index\'s write cost on constant joins and leaves against the read it enables.',
        },
        {
          id: 'refuses-speculative-index',
          label: 'Refuses the speculative index with a cost',
          description:
            'Declines picks(title) because no query in the scenario uses it, names its cost (slower writes, disk, maintenance), and proposes adding it only when a measured query needs it, noting a B-tree would not serve a contains-style title search anyway.',
        },
      ],
      referenceAnswer:
        'Already present. Every primary key is a unique index: clubs(id) serves the club detail page, users(id) serves any lookup by user id, picks(id) exists but no listed query uses it, and memberships(user_id, club_id) is a composite index whose leftmost column is user_id. The UNIQUE constraint on users.email is also an index, so login by email is already one index lookup. The home screen lists the clubs one user belongs to, which is a filter on memberships.user_id, and the primary key\'s leftmost column serves it without a new index.\n\nTo add. The members tab filters memberships by club_id and sorts by joined_at descending: memberships (club_id, joined_at DESC), equality column first so all of one club\'s rows sit together, then the sort column so the index walk delivers them newest-first and the paginated LIMIT stops early without a Sort step, exactly the opener\'s composite index. The picks tab filters picks by club_id and orders by position: picks (club_id, position). Both are foreign key columns, which get no index automatically, and both indexes also speed up the join from clubs to its children. Club search by name prefix: clubs (name), because a LIKE with a literal prefix and no leading wildcard can use a B-tree; if the search must be case-insensitive, store a lowercased name column and index that rather than wrapping name in lower() in the query.\n\nMembers tab tradeoff. I would add the second composite index on memberships (club_id, joined_at DESC). The primary key (user_id, club_id) cannot serve a filter on club_id alone because of the leftmost-prefix rule: entries for one club are scattered across every user. Reordering the primary key to (club_id, user_id) would serve the club filter but not the joined_at sort, so the members tab would still sort thousands of rows per page, and it would break the home screen\'s user_id lookup, which would then need its own index anyway. The cost of the extra index is real, since joins and leaves happen constantly and each write now maintains two indexes on memberships, but the members tab is the second most frequent query and the alternative is a sort over thousands of rows on every page load.\n\nThe refused index. picks(title) serves nothing in the scenario. No query filters or sorts by title. It would slow every pick insert, take disk proportional to the titles, and if a title search does arrive it will almost certainly be a contains-style search, which a B-tree cannot serve regardless; that would call for a text search index designed for it. I would tell the teammate: indexes are bets placed against measured queries, not insurance, and we will add one the day EXPLAIN ANALYZE shows a slow title query, with the column order that query needs.',
    },
    {
      id: 'index-cost-review',
      kind: 'written',
      completionMode: 'submitted-with-reference-review',
      title: 'Explain the 33 milliseconds',
      prompt:
        'A teammate proposes fixing slow queries across the product by adding an index on every column that appears in any WHERE clause. In your own words: why did the opener\'s feed query take 33 milliseconds, why did the single-column index leave a Sort step that the composite index removed, what does the leftmost-prefix rule say about which queries a composite index serves, what does every index cost, and why is "index every column" the wrong policy? Use the plan output and numbers from the lesson.',
      estimatedMinutes: 12,
      referenceAnswer:
        'The feed query took 33 milliseconds because the plan was a Seq Scan: with no index on customer_id, the only way to find customer 4242\'s rows was to read all million and discard the ones that did not match, which the plan reported as 333,324 rows removed by the filter per worker. The work was proportional to the table, not to the answer.\n\nAn index on customer_id changed that to an Index Scan with an Index Cond: the B-tree found the 28 matching entries in a few comparisons and the database fetched only those rows, 0.23 milliseconds. But the plan still showed a Sort on created_at, because the index is ordered by customer_id only, so the 28 rows came out in no useful order and had to be sorted before the LIMIT. The composite index on (customer_id, created_at DESC) removed the Sort: within one customer the entries are already in date order, so the index walk produces rows newest-first and the LIMIT stops after 20. That is why the time fell again, to 0.06 milliseconds.\n\nThe leftmost-prefix rule says a composite index can serve a query only if the query constrains its columns from the left without skipping: equality on the first, then equality or a range on the next, and a sort on the column right after the equality prefix. Once a range is used, later columns are no longer useful. So (customer_id, created_at) serves "customer equals X ordered by date" and "customer equals X in a date range," but a query that filters only on created_at gets a Seq Scan, as the lesson showed at 47 milliseconds, because the first column is missing.\n\nEvery index is a second copy of its columns that must be updated on every insert, update, and delete, plus disk space. The lesson\'s 100,000-row insert took 901 milliseconds with three secondary indexes and 439 with only the primary key, roughly double. Indexing every WHERE column pays that cost for each column while buying little: an index on kind, with four distinct values, was used by the planner and still took 40 milliseconds against 47 for a scan, because it excluded almost nothing. And many WHERE clauses wrap the column in a function or a leading-wildcard LIKE, which no B-tree on that column can serve. The right policy is to read EXPLAIN ANALYZE for the queries that matter, add the specific composite index each one needs with equality columns first and the sort column last, count the indexes the primary keys and UNIQUE constraints already provide, and refuse indexes that no measured query uses.',
      rubric: [
        {
          id: 'seq-scan-explained',
          label: 'Explains the sequential scan',
          description:
            'Attributes the 33 ms to reading and filtering the whole table, citing the Seq Scan and rows removed by the filter, and contrasts it with the logarithmic index lookup.',
        },
        {
          id: 'sort-and-column-order',
          label: 'Explains the Sort step and column order',
          description:
            'Notes that the single-column index left a Sort because rows came out unordered, and that placing created_at after customer_id in the composite index delivered rows sorted so the LIMIT could stop early.',
        },
        {
          id: 'leftmost-prefix',
          label: 'States the leftmost-prefix rule',
          description:
            'Describes that a composite index serves queries constraining its columns from the left without gaps, that a range ends the usable prefix, and gives the created_at-only query as a case the index cannot serve.',
        },
        {
          id: 'write-cost-and-policy',
          label: 'Names the cost and rejects the blanket policy',
          description:
            'Cites write slowdown (the doubled insert time) and space, notes low-selectivity and function-wrapped columns as indexes that would not pay, and argues for measured, query-specific indexes instead of indexing every column.',
        },
      ],
    },
  ],
  approaches: {
    'choose-index': [
      {
        name: 'Walk each index from the left, keep the best',
        code: `type IndexDefinition = { name: string; columns: string[] }

type QueryShape = { equals: string[]; range?: string; orderBy?: string }

type IndexChoice = { index: string | null; usedColumns: number; sorted: boolean }

export function chooseIndex(
  indexes: IndexDefinition[],
  query: QueryShape,
): IndexChoice {
  let best: IndexChoice = { index: null, usedColumns: 0, sorted: false }

  for (const index of indexes) {
    // Leftmost prefix: consume columns while the query pins each one with
    // equality. Order within the equality list does not matter.
    let used = 0
    while (
      used < index.columns.length &&
      query.equals.includes(index.columns[used])
    ) {
      used += 1
    }

    // The column right after the prefix may carry a range, which ends the
    // usable prefix, or may be the ORDER BY column, which makes the index
    // deliver rows already sorted.
    const next = index.columns[used]
    let sorted = false

    if (next !== undefined && next === query.range) {
      used += 1
      sorted = query.orderBy === next
    } else if (next !== undefined && next === query.orderBy && query.range === undefined) {
      sorted = true
    }

    // An index that neither narrows the rows nor orders them is no help.
    if (used === 0 && !sorted) continue

    const betterByColumns = used > best.usedColumns
    const betterBySort = used === best.usedColumns && sorted && !best.sorted
    if (betterByColumns || betterBySort) {
      best = { index: index.name, usedColumns: used, sorted }
    }
  }

  return best
}`,
        explanation:
          'The function is the leftmost-prefix rule written as a loop. For each index it counts how many leading columns the query pins with equality, then looks at the one column after that prefix, which is the only place a range or a sort can still benefit: a range there is usable and ends the prefix, and an ORDER BY there means the index delivers rows in the requested order. Anything further right is in no useful order, so it is never examined, which is why the test with equality on a and c and a range on b counts two columns and not three. The comparison at the end encodes the planner\'s preference in miniature: more usable columns beats fewer, a sorted result breaks ties, and the earlier index wins otherwise, using strict greater-than so the first index seen is kept.',
        complexity:
          'O(i × c) time for i indexes with up to c columns each, O(1) space. The guarantee that matters is that an index is never chosen for a query that skips its leading column.',
      },
    ],
    'fix-index-hiding-filters': [
      {
        name: 'Compute on the value side, leave the column bare',
        code: `type SearchFilters = { email?: string; day?: string }

type Query = { text: string; values: string[] }

// The day after a "YYYY-MM-DD" date, rolling over month and year ends.
function nextDay(day: string): string {
  const date = new Date(\`\${day}T00:00:00Z\`)
  date.setUTCDate(date.getUTCDate() + 1)
  return date.toISOString().slice(0, 10)
}

export function buildEventSearch(filters: SearchFilters): Query {
  const where: string[] = []
  const values: string[] = []

  if (filters.email !== undefined) {
    // Emails are stored lowercase, so lowercase the search term here and
    // compare the bare column. The index holds email, not lower(email).
    values.push(filters.email.toLowerCase())
    where.push(\`email = $\${values.length}\`)
  }

  if (filters.day !== undefined) {
    // A calendar day is the half-open range [midnight, next midnight).
    // Comparing created_at directly lets the index on it do the work.
    values.push(filters.day, nextDay(filters.day))
    where.push(
      \`created_at >= $\${values.length - 1} AND created_at < $\${values.length}\`,
    )
  }

  const whereClause = where.length > 0 ? \` WHERE \${where.join(' AND ')}\` : ''

  return {
    text:
      'SELECT id, customer_id, kind, created_at FROM events' +
      whereClause +
      ' ORDER BY created_at DESC LIMIT 50',
    values,
  }
}`,
        explanation:
          'Both broken filters compared a computed expression against a value, and an index holds stored values, not computed ones, so the planner had to scan. The repair moves every computation to the side of the comparison that does not involve the column. Lowercasing the search term in TypeScript costs nothing and leaves email bare, so the index on email applies; the lesson\'s transcript shows the same change taking a lookup from 160 milliseconds to 0.08. The date filter is the same idea with a twist: a day is not a value the timestamp column can equal, but it is a range the column can fall inside, so the builder pushes the day and the following day and compares created_at to both. The half-open range, inclusive at the start and exclusive at the end, is what makes midnight belong to exactly one day. Rolling the next day over month and year ends is left to Date\'s UTC methods rather than string arithmetic.',
        complexity:
          'O(1) time and space. The guarantee that matters is that every comparison in the text is against a bare indexed column, so the plans become index scans.',
      },
    ],
  },
}
