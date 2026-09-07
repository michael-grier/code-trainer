import Concept from './concept.mdx'

import type { Lesson } from '../../types'

const selectInvoices =
  'SELECT id, customer_id, total, status, created_at FROM invoices'

const overdueText =
  'SELECT id, customer_id, total FROM invoices WHERE due_date < $1 AND (status IS NULL OR status <> ALL($2)) ORDER BY due_date'

const customers = [
  { id: 1, name: 'Ada' },
  { id: 2, name: 'Grace' },
  { id: 3, name: 'Linus' },
]

const invoices = [
  { id: 1, customerId: 1, total: 1800 },
  { id: 2, customerId: 2, total: 250 },
  { id: 3, customerId: 2, total: 900 },
]

export const lesson: Lesson = {
  slug: 'sql-fundamentals',
  title: 'SQL Fundamentals',
  summary:
    'Query relational data with filtering, joins, grouping, and clear result shapes.',
  track: 'backend-data',
  order: 49,
  concept: Concept,
  problems: [
    {
      id: 'build-invoice-list-query',
      kind: 'code',
      completionMode: 'all-tests-pass',
      title: 'Build the invoice list query with parameters',
      prompt:
        'Implement `buildInvoiceListQuery`. It receives the parsed filters of `GET /invoices` and returns `{ text, values }`, the query text with numbered placeholders and the values array a database driver binds to them. The text always starts with `SELECT id, customer_id, total, status, created_at FROM invoices`. Filters that are present add conditions, in the fixed order `customer_id = $n`, `status = $n`, `total >= $n`, joined with " AND " inside a single WHERE clause; placeholders are numbered from $1 in the order values are pushed, with no gaps. Then append ` ORDER BY created_at DESC` unless `sort` is "total", in which case ` ORDER BY total DESC`, and finally ` LIMIT $n` where the limit value is `limit` or 20 when absent. No filter value may ever appear inside the text. Example: `buildInvoiceListQuery({ customerId: 7 })` returns `{ text: "SELECT id, customer_id, total, status, created_at FROM invoices WHERE customer_id = $1 ORDER BY created_at DESC LIMIT $2", values: [7, 20] }`.',
      estimatedMinutes: 20,
      functionName: 'buildInvoiceListQuery',
      starter: `type InvoiceFilters = {
  customerId?: number
  status?: string
  minTotal?: number
  sort?: 'createdAt' | 'total'
  limit?: number
}

type Query = { text: string; values: (string | number)[] }

export function buildInvoiceListQuery(filters: InvoiceFilters): Query {
  return { text: '', values: [] }
}

console.log(buildInvoiceListQuery({ customerId: 7 }))
`,
      tests: [
        {
          name: 'builds the unfiltered list with default order and limit',
          args: [{}],
          expected: {
            text: `${selectInvoices} ORDER BY created_at DESC LIMIT $1`,
            values: [20],
          },
        },
        {
          name: 'filters by customer with a placeholder, never an inlined value',
          args: [{ customerId: 7 }],
          expected: {
            text: `${selectInvoices} WHERE customer_id = $1 ORDER BY created_at DESC LIMIT $2`,
            values: [7, 20],
          },
        },
        {
          name: 'combines filters with AND in customer, status, total order',
          args: [{ status: 'sent', customerId: 7, minTotal: 100 }],
          expected: {
            text: `${selectInvoices} WHERE customer_id = $1 AND status = $2 AND total >= $3 ORDER BY created_at DESC LIMIT $4`,
            values: [7, 'sent', 100, 20],
          },
        },
        {
          name: 'sorts by total when asked',
          args: [{ sort: 'total', limit: 5 }],
          expected: {
            text: `${selectInvoices} ORDER BY total DESC LIMIT $1`,
            values: [5],
          },
        },
        {
          name: 'keeps a hostile status string as a value',
          args: [{ status: "paid' OR '1'='1" }],
          expected: {
            text: `${selectInvoices} WHERE status = $1 ORDER BY created_at DESC LIMIT $2`,
            values: ["paid' OR '1'='1", 20],
          },
        },
        {
          name: 'numbers placeholders after skipped filters without gaps',
          args: [{ minTotal: 500, limit: 3 }],
          expected: {
            text: `${selectInvoices} WHERE total >= $1 ORDER BY created_at DESC LIMIT $2`,
            values: [500, 3],
          },
        },
      ],
    },
    {
      id: 'summarize-by-customer',
      kind: 'code',
      completionMode: 'all-tests-pass',
      title: 'Reproduce LEFT JOIN and GROUP BY in TypeScript',
      prompt:
        'Implement `summarizeByCustomer`. It receives the customers table and the invoices table as arrays and returns the customer statement the lesson built in SQL: one row per customer with `{ customerId, name, invoiceCount, invoicedTotal }`. Every customer appears, including those with no invoices, who report 0 and 0, exactly as a LEFT JOIN with COALESCE would. Invoices whose customerId matches no customer are ignored. Sort by invoicedTotal descending, then by name ascending. Example: `summarizeByCustomer([{ id: 1, name: "Ada" }, { id: 3, name: "Linus" }], [{ id: 1, customerId: 1, total: 1800 }])` returns `[{ customerId: 1, name: "Ada", invoiceCount: 1, invoicedTotal: 1800 }, { customerId: 3, name: "Linus", invoiceCount: 0, invoicedTotal: 0 }]`.',
      estimatedMinutes: 15,
      functionName: 'summarizeByCustomer',
      starter: `type Customer = { id: number; name: string }

type Invoice = { id: number; customerId: number; total: number }

type CustomerSummary = {
  customerId: number
  name: string
  invoiceCount: number
  invoicedTotal: number
}

export function summarizeByCustomer(
  customers: Customer[],
  invoices: Invoice[],
): CustomerSummary[] {
  return []
}

console.log(
  summarizeByCustomer(
    [
      { id: 1, name: 'Ada' },
      { id: 3, name: 'Linus' },
    ],
    [{ id: 1, customerId: 1, total: 1800 }],
  ),
)
`,
      tests: [
        {
          name: 'keeps every customer, including those with no invoices',
          args: [customers, invoices],
          expected: [
            { customerId: 1, name: 'Ada', invoiceCount: 1, invoicedTotal: 1800 },
            { customerId: 2, name: 'Grace', invoiceCount: 2, invoicedTotal: 1150 },
            { customerId: 3, name: 'Linus', invoiceCount: 0, invoicedTotal: 0 },
          ],
        },
        {
          name: 'returns zero rows for zero customers even when invoices exist',
          args: [[], invoices],
          expected: [],
        },
        {
          name: 'reports zeros when there are no invoices at all',
          args: [[{ id: 1, name: 'Ada' }], []],
          expected: [
            { customerId: 1, name: 'Ada', invoiceCount: 0, invoicedTotal: 0 },
          ],
        },
        {
          name: 'breaks total ties by name ascending',
          args: [
            [
              { id: 2, name: 'Grace' },
              { id: 1, name: 'Ada' },
            ],
            [
              { id: 1, customerId: 1, total: 500 },
              { id: 2, customerId: 2, total: 500 },
            ],
          ],
          expected: [
            { customerId: 1, name: 'Ada', invoiceCount: 1, invoicedTotal: 500 },
            { customerId: 2, name: 'Grace', invoiceCount: 1, invoicedTotal: 500 },
          ],
        },
        {
          name: 'ignores invoices whose customer is not in the list',
          args: [
            [{ id: 1, name: 'Ada' }],
            [
              { id: 9, customerId: 42, total: 10 },
              { id: 1, customerId: 1, total: 30 },
            ],
          ],
          expected: [
            { customerId: 1, name: 'Ada', invoiceCount: 1, invoicedTotal: 30 },
          ],
        },
        {
          name: 'counts each invoice once even when totals repeat',
          args: [
            [{ id: 1, name: 'Ada' }],
            [
              { id: 1, customerId: 1, total: 100 },
              { id: 2, customerId: 1, total: 100 },
              { id: 3, customerId: 1, total: 100 },
            ],
          ],
          expected: [
            { customerId: 1, name: 'Ada', invoiceCount: 3, invoicedTotal: 300 },
          ],
        },
      ],
    },
    {
      id: 'fix-overdue-query-builder',
      kind: 'debug',
      completionMode: 'all-tests-pass',
      title: 'Fix the overdue query that trusts its inputs',
      prompt:
        'buildOverdueQuery builds the query behind the overdue-invoices report. It receives the cutoff date as a string and a list of statuses to exclude, and must return `{ text, values }` with the exact text `SELECT id, customer_id, total FROM invoices WHERE due_date < $1 AND (status IS NULL OR status <> ALL($2)) ORDER BY due_date` and `values` equal to `[asOf, excludedStatuses]`. A security review found that the date and statuses are pasted into the text, and finance reports that invoices with no status never appear as overdue. Fix both. Example: `buildOverdueQuery("2026-04-01", ["paid", "void"])` returns `{ text: "SELECT id, customer_id, total FROM invoices WHERE due_date < $1 AND (status IS NULL OR status <> ALL($2)) ORDER BY due_date", values: ["2026-04-01", ["paid", "void"]] }`.',
      estimatedMinutes: 12,
      functionName: 'buildOverdueQuery',
      brokenCode: `type Query = { text: string; values: unknown[] }

export function buildOverdueQuery(
  asOf: string,
  excludedStatuses: string[],
): Query {
  const list = excludedStatuses.map((status) => \`'\${status}'\`).join(', ')

  return {
    text: \`SELECT id, customer_id, total FROM invoices WHERE due_date < '\${asOf}' AND status NOT IN (\${list}) ORDER BY due_date\`,
    values: [],
  }
}

console.log(buildOverdueQuery('2026-04-01', ['paid', 'void']))
`,
      bugHints: [
        "Who controls asOf? What does the text become when it is \"2026-04-01' OR '1'='1\"?",
        'Values belong in the values array and placeholders in the text. A whole list can be one array value compared with <> ALL($n).',
        'What does status NOT IN (...) evaluate to when status is NULL, and does WHERE keep such a row?',
      ],
      tests: [
        {
          name: 'parameterizes the date and the excluded statuses',
          args: ['2026-04-01', ['paid', 'void']],
          expected: { text: overdueText, values: ['2026-04-01', ['paid', 'void']] },
        },
        {
          name: 'passes a hostile date string through as a value',
          args: ["2026-04-01' OR '1'='1", ['paid']],
          expected: { text: overdueText, values: ["2026-04-01' OR '1'='1", ['paid']] },
        },
        {
          name: 'passes a status containing a quote through as a value',
          args: ['2026-04-01', ["pa'id"]],
          expected: { text: overdueText, values: ['2026-04-01', ["pa'id"]] },
        },
        {
          name: 'keeps rows whose status is NULL by testing IS NULL in the text',
          args: ['2026-04-01', ['paid']],
          expected: { text: overdueText, values: ['2026-04-01', ['paid']] },
        },
        {
          name: 'handles an empty exclusion list',
          args: ['2026-04-01', []],
          expected: { text: overdueText, values: ['2026-04-01', []] },
        },
      ],
    },
    {
      id: 'fan-out-review',
      kind: 'written',
      completionMode: 'submitted-with-reference-review',
      title: 'Explain the 3600',
      prompt:
        'A teammate ran the opener\'s customer statement query, saw Ada invoiced for 3600 and Linus missing, and concluded the payments data must be corrupt. In your own words: why did the query report 3600 for a single 1800 invoice, why did Linus and Grace\'s 900 invoice disappear, how would you rewrite the query so every number is right and every customer appears, and what rule would you give the team for aggregating over joins? Mention how NULL enters the fixed query and how you handle it.',
      estimatedMinutes: 12,
      referenceAnswer:
        'The data is fine; the query multiplied it. A join produces one row per matching pair, so when invoice 1 is joined to its two payments, the invoice appears in two rows and each row carries its full total of 1800. GROUP BY then sums that repeated column and gets 3600. This is fan-out: joining a child table with several matching rows repeats the parent\'s columns once per match, and any SUM over the parent\'s columns is inflated by the match count. The paid column was right only because payments were the innermost table and each payment appeared once.\n\nLinus and the 900 invoice vanished for the other property of an inner join: it keeps only rows with a match on both sides. Linus has no invoices, so he fails the first join. Grace\'s 900 invoice has no payments, so it fails the second. Neither row was ever in the grouped result to be summed.\n\nThe rewrite aggregates each table at its own grain before joining. A subquery sums payments per invoice_id, so each invoice meets at most one payment row and its total cannot be repeated. Customers are LEFT JOINed to invoices and then to that subquery, so customers without invoices and invoices without payments survive with NULLs on the right side. The outer GROUP BY c.name then sums correctly: Ada 1800 and 1800, Grace 1150 and 100, Linus 0 and 0. NULL enters through the LEFT JOINs: a customer with nothing gets NULL for every invoice and payment column, SUM over all-NULL rows is NULL, and COALESCE(SUM(...), 0) turns that into the 0 the report should show. If the report counted invoices, it would use COUNT(i.id) rather than COUNT(*), because COUNT(*) counts the NULL row a left join produces for a customer with no invoices.\n\nThe rule: before summing a column across a join, ask which table fans out. If the column belongs to a table on the repeated side, aggregate first and join second. And when the report must list every parent, join with LEFT JOIN and COALESCE the aggregates, because inner joins are filters as much as they are combinations.',
      rubric: [
        {
          id: 'fan-out-mechanism',
          label: 'Explains fan-out',
          description:
            'States that a join yields one row per matching pair, so the invoice total is repeated once per payment and SUM adds it twice; identifies which table fanned out.',
        },
        {
          id: 'inner-join-drops',
          label: 'Explains the missing rows',
          description:
            'Attributes the missing Linus and the missing 900 invoice to inner joins keeping only matched rows, and names LEFT JOIN as the fix for listing every customer.',
        },
        {
          id: 'aggregate-then-join',
          label: 'Rewrites by aggregating first',
          description:
            'Proposes pre-aggregating payments per invoice in a subquery (or equivalent) before joining, so the parent total is never repeated, and states the general aggregate-first rule.',
        },
        {
          id: 'null-handling',
          label: 'Handles NULL from the outer join',
          description:
            'Notes that LEFT JOIN introduces NULLs, that SUM over them is NULL, and uses COALESCE (and COUNT(column) rather than COUNT(*)) to report zeros correctly.',
        },
      ],
    },
  ],
  approaches: {
    'build-invoice-list-query': [
      {
        name: 'Push the value, then name its slot',
        code: `type InvoiceFilters = {
  customerId?: number
  status?: string
  minTotal?: number
  sort?: 'createdAt' | 'total'
  limit?: number
}

type Query = { text: string; values: (string | number)[] }

export function buildInvoiceListQuery(filters: InvoiceFilters): Query {
  const where: string[] = []
  const values: (string | number)[] = []

  // Each filter pushes its value first and then names the slot it just
  // took, so placeholders stay numbered without gaps whatever is present.
  if (filters.customerId !== undefined) {
    values.push(filters.customerId)
    where.push(\`customer_id = $\${values.length}\`)
  }

  if (filters.status !== undefined) {
    values.push(filters.status)
    where.push(\`status = $\${values.length}\`)
  }

  if (filters.minTotal !== undefined) {
    values.push(filters.minTotal)
    where.push(\`total >= $\${values.length}\`)
  }

  // The caller chooses between two column names the code wrote; the
  // caller's string itself never reaches the text.
  const orderBy = filters.sort === 'total' ? 'total DESC' : 'created_at DESC'

  // The limit is a value like any other, so it gets a placeholder too.
  values.push(filters.limit ?? 20)

  const whereClause = where.length > 0 ? \` WHERE \${where.join(' AND ')}\` : ''

  return {
    text:
      'SELECT id, customer_id, total, status, created_at FROM invoices' +
      whereClause +
      \` ORDER BY \${orderBy} LIMIT $\${values.length}\`,
    values,
  }
}`,
        explanation:
          'The builder keeps a hard line between the two outputs. Everything in text was written by this function: column names, operators, the two allowed ORDER BY targets. Everything the caller supplied goes into values, which is why the hostile status string test passes untouched; to the database it is a value being compared with a column, and the quote inside it is just a character. The push-then-name pattern is what keeps the placeholder numbers correct when filters are skipped: the slot number is always the current length of values, so a query with only minTotal gets $1 for the total and $2 for the limit. The sort mapping is the same allowlist idea as lesson 47\'s query parser, needed because a column name cannot be a bound parameter.',
        complexity:
          'O(1) time and space for a fixed set of filters. The guarantee that matters is that no caller-supplied string ever appears in the query text.',
      },
    ],
    'summarize-by-customer': [
      {
        name: 'Seed a group per customer, then fold invoices in',
        code: `type Customer = { id: number; name: string }

type Invoice = { id: number; customerId: number; total: number }

type CustomerSummary = {
  customerId: number
  name: string
  invoiceCount: number
  invoicedTotal: number
}

export function summarizeByCustomer(
  customers: Customer[],
  invoices: Invoice[],
): CustomerSummary[] {
  // LEFT JOIN semantics: every customer gets a group up front, so a
  // customer with no invoices still produces a row with zeros.
  const groups = new Map<number, CustomerSummary>()
  for (const customer of customers) {
    groups.set(customer.id, {
      customerId: customer.id,
      name: customer.name,
      invoiceCount: 0,
      invoicedTotal: 0,
    })
  }

  // GROUP BY semantics: each invoice folds into exactly one group. An
  // invoice whose customer is unknown matches nothing, like an inner
  // join miss, and is skipped.
  for (const invoice of invoices) {
    const group = groups.get(invoice.customerId)
    if (!group) continue
    group.invoiceCount += 1
    group.invoicedTotal += invoice.total
  }

  // ORDER BY invoicedTotal DESC, name ASC.
  return [...groups.values()].sort(
    (a, b) => b.invoicedTotal - a.invoicedTotal || a.name.localeCompare(b.name),
  )
}`,
        explanation:
          'The function mirrors the fixed SQL step by step. Seeding one group per customer before touching invoices is the LEFT JOIN plus COALESCE: the row exists whether or not anything matches, and its zeros are the COALESCE defaults. Folding each invoice into the group keyed by its customer is GROUP BY with COUNT and SUM, and because each invoice is visited exactly once there is no fan-out to worry about; this is the aggregate-at-the-right-grain shape the lesson recommended, written in a language where the grain is explicit. Skipping an invoice with no matching customer is what an inner join would do to it. The sort comparator encodes ORDER BY with a tie-breaker, using the numeric difference first and falling through to the name only when totals are equal.',
        complexity:
          'O(c + i + c log c) time for c customers and i invoices, O(c) space for the groups. The guarantee that matters is one output row per customer, never fewer.',
      },
    ],
    'fix-overdue-query-builder': [
      {
        name: 'Parameters for the values, IS NULL for the unknowns',
        code: `type Query = { text: string; values: unknown[] }

export function buildOverdueQuery(
  asOf: string,
  excludedStatuses: string[],
): Query {
  // The date and the whole status list travel as two bound values. The
  // database compares status against each array element with <> ALL, so
  // no quoting or joining happens in application code.
  return {
    text:
      'SELECT id, customer_id, total FROM invoices ' +
      'WHERE due_date < $1 AND (status IS NULL OR status <> ALL($2)) ' +
      'ORDER BY due_date',
    values: [asOf, excludedStatuses],
  }
}`,
        explanation:
          'The broken builder had one security bug and one correctness bug, and both came from treating the query as a string to assemble. Pasting asOf into the text let a caller who controls the date write SQL: the hostile date in the tests turns the WHERE clause into a condition that is always true, and a malicious value could do far worse. Quoting each status by hand had the same problem and would also break on a legitimate status containing an apostrophe. The fix passes both as bound values, with the whole status list as a single array parameter compared using <> ALL($2), which is the parameterized form of NOT IN. The second bug was NULL logic: for an invoice with no status, status NOT IN (...) evaluates to NULL, WHERE treats NULL as not true, and the invoice never appears as overdue. Adding status IS NULL OR makes the intent explicit: an invoice with unknown status is not excluded. That decision is a business rule, and writing it into the query is what makes the report trustworthy.',
        complexity:
          'O(1) time and space. The guarantee that matters is that the text is a constant the caller cannot alter, and that rows with NULL status are included by explicit choice.',
      },
    ],
  },
}
