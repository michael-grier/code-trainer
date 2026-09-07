import Concept from './concept.mdx'

import type { Lesson } from '../../types'

const exportRows = [
  {
    orderId: 101,
    customerEmail: 'ada@example.com',
    customerName: 'Ada',
    sku: 'mug-blue',
    productName: 'Blue mug',
    quantity: 2,
  },
  {
    orderId: 101,
    customerEmail: 'ada@example.com',
    customerName: 'Ada',
    sku: 'tee-m',
    productName: 'T-shirt (M)',
    quantity: 1,
  },
  {
    orderId: 102,
    customerEmail: 'grace@example.com',
    customerName: 'Grace',
    sku: 'mug-blue',
    productName: 'Blue mug',
    quantity: 1,
  },
  {
    orderId: 103,
    customerEmail: 'ada@example.com',
    customerName: 'Ada L.',
    sku: 'tee-m',
    productName: 'T-shirt (M)',
    quantity: 3,
  },
]

const ada = { id: 1, email: 'ada@example.com', name: 'Ada' }
const grace = { id: 2, email: 'grace@example.com', name: 'Grace' }
const blueMug = { sku: 'mug-blue', name: 'Blue mug' }
const teeM = { sku: 'tee-m', name: 'T-shirt (M)' }

const shopKeys = [
  {
    table: 'orders',
    column: 'customerId',
    references: 'customers',
    onDelete: 'restrict',
  },
  {
    table: 'orderTags',
    column: 'orderId',
    references: 'orders',
    onDelete: 'cascade',
  },
  {
    table: 'reminders',
    column: 'orderId',
    references: 'orders',
    onDelete: 'set null',
  },
]

const shopData = {
  customers: [{ id: 1 }, { id: 2 }],
  orders: [
    { id: 10, customerId: 1 },
    { id: 11, customerId: 1 },
  ],
  orderTags: [
    { id: 100, orderId: 10, tagId: 1 },
    { id: 101, orderId: 10, tagId: 2 },
  ],
  reminders: [
    { id: 500, orderId: 10 },
    { id: 501, orderId: 11 },
  ],
}

export const lesson: Lesson = {
  slug: 'schema-design-and-relationships',
  title: 'Schema Design and Relationships',
  summary:
    'Model entities, relationships, constraints, and nullability intentionally.',
  track: 'backend-data',
  order: 50,
  concept: Concept,
  problems: [
    {
      id: 'normalize-order-rows',
      kind: 'code',
      completionMode: 'all-tests-pass',
      title: 'Normalize a flat order export',
      prompt:
        'Implement `normalizeOrderRows`. It receives the rows of a spreadsheet export, one row per order line with the customer and product repeated on every line, and splits them into four tables: `customers` as `{ id, email, name }`, `products` as `{ sku, name }`, `orders` as `{ id, customerId }`, and `orderItems` as `{ orderId, sku, quantity }`. A customer is identified by email and appears once, numbered from 1 in order of first appearance, keeping the name from the first row where that email was seen. A product is identified by sku and appears once with the first name seen. An order appears once, using the export\'s orderId and the id of its customer. Every input row becomes one order item, in input order. Example: `normalizeOrderRows([{ orderId: 101, customerEmail: "ada@example.com", customerName: "Ada", sku: "mug-blue", productName: "Blue mug", quantity: 2 }])` returns `{ customers: [{ id: 1, email: "ada@example.com", name: "Ada" }], products: [{ sku: "mug-blue", name: "Blue mug" }], orders: [{ id: 101, customerId: 1 }], orderItems: [{ orderId: 101, sku: "mug-blue", quantity: 2 }] }`.',
      estimatedMinutes: 20,
      functionName: 'normalizeOrderRows',
      starter: `type ExportRow = {
  orderId: number
  customerEmail: string
  customerName: string
  sku: string
  productName: string
  quantity: number
}

type NormalizedTables = {
  customers: { id: number; email: string; name: string }[]
  products: { sku: string; name: string }[]
  orders: { id: number; customerId: number }[]
  orderItems: { orderId: number; sku: string; quantity: number }[]
}

export function normalizeOrderRows(rows: ExportRow[]): NormalizedTables {
  return { customers: [], products: [], orders: [], orderItems: [] }
}

console.log(
  normalizeOrderRows([
    {
      orderId: 101,
      customerEmail: 'ada@example.com',
      customerName: 'Ada',
      sku: 'mug-blue',
      productName: 'Blue mug',
      quantity: 2,
    },
  ]),
)
`,
      tests: [
        {
          name: 'splits a small export into four tables',
          args: [exportRows],
          expected: {
            customers: [ada, grace],
            products: [blueMug, teeM],
            orders: [
              { id: 101, customerId: 1 },
              { id: 102, customerId: 2 },
              { id: 103, customerId: 1 },
            ],
            orderItems: [
              { orderId: 101, sku: 'mug-blue', quantity: 2 },
              { orderId: 101, sku: 'tee-m', quantity: 1 },
              { orderId: 102, sku: 'mug-blue', quantity: 1 },
              { orderId: 103, sku: 'tee-m', quantity: 3 },
            ],
          },
        },
        {
          name: 'returns four empty tables for an empty export',
          args: [[]],
          expected: { customers: [], products: [], orders: [], orderItems: [] },
        },
        {
          name: 'stores each customer once, keyed by email, keeping the first name seen',
          args: [[exportRows[0], exportRows[3]]],
          expected: {
            customers: [ada],
            products: [blueMug, teeM],
            orders: [
              { id: 101, customerId: 1 },
              { id: 103, customerId: 1 },
            ],
            orderItems: [
              { orderId: 101, sku: 'mug-blue', quantity: 2 },
              { orderId: 103, sku: 'tee-m', quantity: 3 },
            ],
          },
        },
        {
          name: 'numbers customers by first appearance',
          args: [[exportRows[2], exportRows[0]]],
          expected: {
            customers: [
              { id: 1, email: 'grace@example.com', name: 'Grace' },
              { id: 2, email: 'ada@example.com', name: 'Ada' },
            ],
            products: [blueMug],
            orders: [
              { id: 102, customerId: 1 },
              { id: 101, customerId: 2 },
            ],
            orderItems: [
              { orderId: 102, sku: 'mug-blue', quantity: 1 },
              { orderId: 101, sku: 'mug-blue', quantity: 2 },
            ],
          },
        },
        {
          name: 'keeps one order row for an order with several lines',
          args: [[exportRows[0], exportRows[1]]],
          expected: {
            customers: [ada],
            products: [blueMug, teeM],
            orders: [{ id: 101, customerId: 1 }],
            orderItems: [
              { orderId: 101, sku: 'mug-blue', quantity: 2 },
              { orderId: 101, sku: 'tee-m', quantity: 1 },
            ],
          },
        },
        {
          name: 'stores a product once even when many orders include it',
          args: [[exportRows[0], exportRows[2]]],
          expected: {
            customers: [ada, grace],
            products: [blueMug],
            orders: [
              { id: 101, customerId: 1 },
              { id: 102, customerId: 2 },
            ],
            orderItems: [
              { orderId: 101, sku: 'mug-blue', quantity: 2 },
              { orderId: 102, sku: 'mug-blue', quantity: 1 },
            ],
          },
        },
      ],
    },
    {
      id: 'plan-delete',
      kind: 'code',
      completionMode: 'all-tests-pass',
      title: 'Plan what one delete does',
      prompt:
        'Implement `planDelete`. It receives the schema\'s foreign keys as `{ table, column, references, onDelete }` where `onDelete` is "restrict", "cascade", or "set null"; the data as a record from table name to rows, each row having an `id`; and the table and id to delete. It computes what the database would do. Visit the deleted row, then walk the foreign keys in the given order: for each key that references the deleted row\'s table, find the child rows whose `column` equals the deleted id, in data order. A "restrict" child blocks the whole operation: return `{ ok: false, blockedBy: { table, id } }` naming the first such child found. A "set null" child is recorded in `nulled` as `{ table, id, column }`. A "cascade" child is deleted too, recursively, with the same rules, before moving on to the next child. On success return `{ ok: true, deleted, nulled }` where `deleted` lists `{ table, id }` in the order rows were visited, starting with the requested row, and `nulled` is in the order recorded. A table missing from the data has no rows. Example: with keys `[{ table: "orders", column: "customerId", references: "customers", onDelete: "restrict" }]` and data `{ customers: [{ id: 1 }], orders: [{ id: 10, customerId: 1 }] }`, `planDelete(keys, data, "customers", 1)` returns `{ ok: false, blockedBy: { table: "orders", id: 10 } }`.',
      estimatedMinutes: 25,
      functionName: 'planDelete',
      starter: `type ForeignKey = {
  table: string
  column: string
  references: string
  onDelete: 'restrict' | 'cascade' | 'set null'
}

type Row = { id: number } & Record<string, unknown>

type DeletePlan =
  | {
      ok: true
      deleted: { table: string; id: number }[]
      nulled: { table: string; id: number; column: string }[]
    }
  | { ok: false; blockedBy: { table: string; id: number } }

export function planDelete(
  foreignKeys: ForeignKey[],
  data: Record<string, Row[]>,
  table: string,
  id: number,
): DeletePlan {
  return { ok: true, deleted: [], nulled: [] }
}

console.log(
  planDelete(
    [
      {
        table: 'orders',
        column: 'customerId',
        references: 'customers',
        onDelete: 'restrict',
      },
    ],
    { customers: [{ id: 1 }], orders: [{ id: 10, customerId: 1 }] },
    'customers',
    1,
  ),
)
`,
      tests: [
        {
          name: 'deletes a row with no dependents',
          args: [shopKeys, shopData, 'customers', 2],
          expected: {
            ok: true,
            deleted: [{ table: 'customers', id: 2 }],
            nulled: [],
          },
        },
        {
          name: 'is blocked by a restricting child and names it',
          args: [shopKeys, shopData, 'customers', 1],
          expected: { ok: false, blockedBy: { table: 'orders', id: 10 } },
        },
        {
          name: 'cascades to tag rows and nulls reminders',
          args: [shopKeys, shopData, 'orders', 10],
          expected: {
            ok: true,
            deleted: [
              { table: 'orders', id: 10 },
              { table: 'orderTags', id: 100 },
              { table: 'orderTags', id: 101 },
            ],
            nulled: [{ table: 'reminders', id: 500, column: 'orderId' }],
          },
        },
        {
          name: 'nulls a reminder for an order with no tags',
          args: [shopKeys, shopData, 'orders', 11],
          expected: {
            ok: true,
            deleted: [{ table: 'orders', id: 11 }],
            nulled: [{ table: 'reminders', id: 501, column: 'orderId' }],
          },
        },
        {
          name: 'cascades through two levels',
          args: [
            [
              {
                table: 'orders',
                column: 'customerId',
                references: 'customers',
                onDelete: 'cascade',
              },
              {
                table: 'orderTags',
                column: 'orderId',
                references: 'orders',
                onDelete: 'cascade',
              },
            ],
            {
              customers: [{ id: 1 }],
              orders: [{ id: 10, customerId: 1 }],
              orderTags: [{ id: 100, orderId: 10, tagId: 1 }],
            },
            'customers',
            1,
          ],
          expected: {
            ok: true,
            deleted: [
              { table: 'customers', id: 1 },
              { table: 'orders', id: 10 },
              { table: 'orderTags', id: 100 },
            ],
            nulled: [],
          },
        },
        {
          name: 'a restrict deep in a cascade blocks the whole delete',
          args: [
            [
              {
                table: 'orders',
                column: 'customerId',
                references: 'customers',
                onDelete: 'cascade',
              },
              {
                table: 'shipments',
                column: 'orderId',
                references: 'orders',
                onDelete: 'restrict',
              },
            ],
            {
              customers: [{ id: 1 }],
              orders: [{ id: 10, customerId: 1 }],
              shipments: [{ id: 7, orderId: 10 }],
            },
            'customers',
            1,
          ],
          expected: { ok: false, blockedBy: { table: 'shipments', id: 7 } },
        },
        {
          name: 'treats a table with no rows as having no dependents',
          args: [shopKeys, { customers: [{ id: 1 }], orders: [] }, 'customers', 1],
          expected: {
            ok: true,
            deleted: [{ table: 'customers', id: 1 }],
            nulled: [],
          },
        },
      ],
    },
    {
      id: 'book-club-schema-design',
      kind: 'design',
      completionMode: 'submitted-with-rubric-review',
      title: 'Design the schema for the book club app',
      prompt:
        'Design the tables behind the book club API from lesson 47, then defend one modeling decision.',
      estimatedMinutes: 25,
      scenario:
        'The book club app from lesson 47 is getting a real database. Users have an email and a display name. A club has a name and exactly one owner, who is a user. Users join and leave clubs, and the app needs to know when each member joined. Each club keeps a reading list of picks, each naming a book title and the member who suggested it, in the order they were added. The club list screen shows every club with its member count, and some clubs have thousands of members. When a user deletes their account, the product team wants their memberships gone but the clubs they owned and the picks they suggested preserved.',
      sections: [
        {
          id: 'tables',
          type: 'entity-list',
          label: 'Tables and keys',
          prompt:
            'List the tables with their primary key and foreign keys. For each relationship say whether it is one-to-many or many-to-many and which table carries the reference.',
        },
        {
          id: 'constraints',
          type: 'short-answer',
          label: 'Constraints and nullability',
          prompt:
            'For each table, name the NOT NULL, UNIQUE, and CHECK constraints you would add and one column you would deliberately leave nullable, with the reason "unknown" is a real state for it.',
        },
        {
          id: 'member-count',
          type: 'tradeoff',
          label: 'Member count',
          prompt:
            'The club list shows a member count per club. Choose how to produce it and justify the choice with the read and write patterns described in the scenario, including what can go wrong with each option.',
          options: [
            'Compute it on read with COUNT over the memberships table, grouped by club',
            'Store a member_count column on clubs and update it whenever a membership is added or removed',
          ],
        },
        {
          id: 'delete-behavior',
          type: 'short-answer',
          label: 'Deleting a user',
          prompt:
            'Give the ON DELETE clause for every foreign key that points at users, and explain how each satisfies the product requirement that memberships disappear while owned clubs and suggested picks survive.',
        },
      ],
      rubric: [
        {
          id: 'entities-once',
          label: 'One table per entity, facts stored once',
          description:
            'Users, clubs, memberships, and picks are separate tables; no user fact such as email or display name is copied onto clubs, memberships, or picks.',
        },
        {
          id: 'membership-join-table',
          label: 'Membership modeled as a join table',
          description:
            'The user-club relationship is a many-to-many join table with a primary key or unique constraint on (user_id, club_id) so a user cannot join the same club twice, and it carries the joined_at timestamp.',
        },
        {
          id: 'deliberate-constraints',
          label: 'Constraints and nullability decided per column',
          description:
            'Names NOT NULL for required columns, UNIQUE for email and for the club membership pair, at least one CHECK or equivalent, and justifies at least one nullable column by naming the real "unknown" state it represents.',
        },
        {
          id: 'count-tradeoff-grounded',
          label: 'Member count tradeoff argued from the workload',
          description:
            'Either option can earn credit, but the answer must weigh the club list read (thousands of members, tens of thousands of clubs) against the join and leave writes, and must name the failure mode of the chosen option (a slow read, or a counter that drifts) with a mitigation.',
        },
        {
          id: 'delete-behavior-matches-product',
          label: 'ON DELETE choices match the requirement',
          description:
            'Memberships cascade on user delete; the owner and suggester references do not cascade, and the answer explains how ownership and picks survive (for example SET NULL with a nullable column, RESTRICT with a transfer step, or a soft delete), noting the nullability consequence.',
        },
      ],
      referenceAnswer:
        'Tables. users (id PK, email, display_name). clubs (id PK, name, owner_id FK to users). memberships (user_id FK to users, club_id FK to clubs, joined_at, primary key on (user_id, club_id)). picks (id PK, club_id FK to clubs, suggested_by FK to users, title, position). Users to clubs through ownership is one-to-many, carried by clubs.owner_id. Users to clubs through membership is many-to-many, carried by the memberships join table. Clubs to picks is one-to-many, carried by picks.club_id, and users to picks through suggestion is one-to-many, carried by picks.suggested_by.\n\nConstraints. users.email NOT NULL UNIQUE, since an email identifies one account; display_name NOT NULL. clubs.name NOT NULL; owner_id nullable, explained below. memberships: both keys NOT NULL, joined_at NOT NULL DEFAULT now(), and the composite primary key makes joining twice impossible, which is the 409 from lesson 47 enforced by the database. picks: club_id NOT NULL, title NOT NULL, position NOT NULL with a UNIQUE on (club_id, position) so two picks cannot share a slot, and a CHECK (position >= 1). suggested_by is deliberately nullable: a pick whose suggester deleted their account is still a real pick, and "suggested by nobody we can name" is a real state.\n\nMember count. I would compute it on read to start, with COUNT(*) over memberships grouped by club_id, because the count is derived data and a stored counter is the update anomaly reintroduced on purpose: every join and leave must increment or decrement it inside the same transaction, and any path that forgets, an import or an admin tool, leaves it wrong with nothing to catch the drift. The club list is paginated at 20 per page from lesson 47, so the read is 20 counts over an indexed club_id, which is cheap even for clubs with thousands of members. If measurement later shows the list is too slow, the fallback is a member_count column maintained by a trigger or in the same transaction as the membership write, with a periodic job that recomputes it from memberships to repair drift. Choosing the stored counter first is defensible if the club list is the hottest read in the product, provided the answer names the drift risk and the repair job.\n\nDeleting a user. memberships.user_id ON DELETE CASCADE: a membership has no meaning without its user, and the product wants them gone. clubs.owner_id ON DELETE SET NULL: the club survives with no owner, which is why owner_id must be nullable, and the application prompts remaining members to claim it; RESTRICT with a required ownership-transfer step is the stricter alternative if an ownerless club is unacceptable. picks.suggested_by ON DELETE SET NULL: the pick remains in the reading list with its suggester blanked, matching the nullable column above. Nothing else cascades, so deleting a user removes exactly their memberships and nothing the rest of the club relies on.',
    },
    {
      id: 'snapshot-or-anomaly-review',
      kind: 'written',
      completionMode: 'submitted-with-reference-review',
      title: 'Decide when a copy is a snapshot',
      prompt:
        'A teammate points out that the order_items table copies unit_price from products, and argues that by the lesson\'s own rule this is the same anomaly as copying the customer\'s email onto invoices. In your own words: why was the copied email an anomaly, why is the copied price not, what single question separates the two cases, and when would you deliberately add a redundant column anyway? Give one concrete example of each kind and say what code has to exist next to a deliberate copy.',
      estimatedMinutes: 12,
      referenceAnswer:
        'The copied email was an anomaly because it was a fact about the customer stored on rows about invoices. When Ada changed her email, the truth changed in one place and the copies did not follow, so the database held two answers to "what is Ada\'s email" with no rule saying which was right. Normalization fixes that by giving the customer one row and pointing every invoice at it, so the fact has one home and the join reads the current value.\n\nThe copied unit_price is not the same case, because it is not a fact about the product. It is a fact about the order: what the customer agreed to pay at the time. If the catalog price changes next week, the order must still show the old price, or the receipt and the charge stop agreeing. The copy is a snapshot, and its whole purpose is to not follow the source. Storing a foreign key to the product and reading the current price would be the actual bug here, the mirror image of the email problem.\n\nThe question that separates them is: when the source changes, should this value change too? If yes, it is the same fact and must live once, referenced by id. If no, it is a different fact that happens to start with the same number, and copying it is correct. Ada\'s email should follow Ada, so no copy. The price a customer paid should not follow the catalog, so copy it.\n\nA deliberate redundant copy for speed, denormalization, is a third case: a member_count on clubs so the club list avoids a count per row. Here the copy is supposed to follow the source, which is exactly the anomaly, accepted on purpose for a measured read that is too slow. That is only acceptable when the code that keeps the copy in sync lives next to it: the membership insert and delete update the counter in the same transaction, or a trigger does, and a repair job recomputes it from the memberships table so that drift is bounded rather than permanent. Without that code, the shortcut is just the opener\'s bug with a performance excuse.',
      rubric: [
        {
          id: 'anomaly-explained',
          label: 'Explains the update anomaly',
          description:
            'States that the copied email was a customer fact stored per invoice, so an update changed one copy and left others stale, and that normalization gives the fact one home.',
        },
        {
          id: 'snapshot-distinguished',
          label: 'Recognizes the price as a snapshot',
          description:
            'Argues that the copied price records what the order cost at the time and must not follow the catalog, so copying it is correct and referencing the live price would be the bug.',
        },
        {
          id: 'separating-question',
          label: 'Names the deciding question',
          description:
            'Gives a single test along the lines of "should this value change when the source changes?" and applies it to both examples.',
        },
        {
          id: 'denormalization-with-sync',
          label: 'Denormalization requires sync code',
          description:
            'Describes deliberate redundancy for a measured slow read, names its drift risk, and requires the keeping-in-sync code (same transaction or trigger, plus a repair job) to live alongside the copy.',
        },
      ],
    },
  ],
  approaches: {
    'normalize-order-rows': [
      {
        name: 'One map per entity, keyed by its natural identifier',
        code: `type ExportRow = {
  orderId: number
  customerEmail: string
  customerName: string
  sku: string
  productName: string
  quantity: number
}

type NormalizedTables = {
  customers: { id: number; email: string; name: string }[]
  products: { sku: string; name: string }[]
  orders: { id: number; customerId: number }[]
  orderItems: { orderId: number; sku: string; quantity: number }[]
}

export function normalizeOrderRows(rows: ExportRow[]): NormalizedTables {
  // Each map is one table. The key is the value that identifies the entity
  // in the export: email for a customer, sku for a product, orderId for an
  // order. Maps keep insertion order, which gives first-appearance numbering.
  const customers = new Map<string, NormalizedTables['customers'][number]>()
  const products = new Map<string, NormalizedTables['products'][number]>()
  const orders = new Map<number, NormalizedTables['orders'][number]>()
  const orderItems: NormalizedTables['orderItems'] = []

  for (const row of rows) {
    // The first row for an email wins, so later spelling variations of the
    // name do not create a second customer or overwrite the first.
    let customer = customers.get(row.customerEmail)
    if (!customer) {
      customer = {
        id: customers.size + 1,
        email: row.customerEmail,
        name: row.customerName,
      }
      customers.set(row.customerEmail, customer)
    }

    if (!products.has(row.sku)) {
      products.set(row.sku, { sku: row.sku, name: row.productName })
    }

    // The order points at its customer by id, never by copying the email.
    if (!orders.has(row.orderId)) {
      orders.set(row.orderId, { id: row.orderId, customerId: customer.id })
    }

    // Every export row is exactly one line item; nothing is deduplicated here.
    orderItems.push({ orderId: row.orderId, sku: row.sku, quantity: row.quantity })
  }

  return {
    customers: [...customers.values()],
    products: [...products.values()],
    orders: [...orders.values()],
    orderItems,
  }
}`,
        explanation:
          'The transform is normalization performed by hand: each entity gets one collection keyed by whatever identifies it in the flat data, and a row is only added the first time that key appears. That single rule produces every property the tests check. Customers are stored once because the map is keyed by email; they are numbered by first appearance because ids are assigned when the entry is created and Maps preserve insertion order; the first name wins because later rows find the entry already present and do not touch it. Orders point at customers through the id the map assigned, which is the foreign key the schema will carry. Order items are the one table that is not deduplicated, because each export row genuinely is one line item, and collapsing them would lose quantities.',
        complexity:
          'O(n) time and space for n export rows, with O(1) map lookups per row. The guarantee that matters is that each customer, product, and order appears exactly once in its table.',
      },
    ],
    'plan-delete': [
      {
        name: 'Depth-first walk of the foreign keys',
        code: `type ForeignKey = {
  table: string
  column: string
  references: string
  onDelete: 'restrict' | 'cascade' | 'set null'
}

type Row = { id: number } & Record<string, unknown>

type DeletePlan =
  | {
      ok: true
      deleted: { table: string; id: number }[]
      nulled: { table: string; id: number; column: string }[]
    }
  | { ok: false; blockedBy: { table: string; id: number } }

export function planDelete(
  foreignKeys: ForeignKey[],
  data: Record<string, Row[]>,
  table: string,
  id: number,
): DeletePlan {
  const deleted: { table: string; id: number }[] = []
  const nulled: { table: string; id: number; column: string }[] = []

  // Visit one row that is being deleted. Returns the blocking child if a
  // RESTRICT key stops the operation anywhere beneath this row.
  const visit = (
    parentTable: string,
    parentId: number,
  ): { table: string; id: number } | undefined => {
    deleted.push({ table: parentTable, id: parentId })

    for (const key of foreignKeys) {
      if (key.references !== parentTable) continue

      // A table absent from the data simply has no rows pointing here.
      const children = (data[key.table] ?? []).filter(
        (row) => row[key.column] === parentId,
      )

      for (const child of children) {
        if (key.onDelete === 'restrict') {
          return { table: key.table, id: child.id }
        }

        if (key.onDelete === 'set null') {
          nulled.push({ table: key.table, id: child.id, column: key.column })
          continue
        }

        // CASCADE: the child is deleted too, and its own children are
        // examined before the next sibling, which is what makes a RESTRICT
        // two levels down block the whole plan.
        const blocked = visit(key.table, child.id)
        if (blocked) return blocked
      }
    }

    return undefined
  }

  const blocked = visit(table, id)

  return blocked ? { ok: false, blockedBy: blocked } : { ok: true, deleted, nulled }
}`,
        explanation:
          'The planner is a depth-first traversal of the foreign-key graph starting at the row being deleted. For each key that points at the current table, it finds the children referencing the current id and applies the key\'s rule: RESTRICT stops everything and reports the child, SET NULL records the child and moves on, CASCADE recurses into the child so its own dependents are handled before the next sibling. Recursion is what gives the two-level tests their answers: a cascade from customers to orders to order tags lists all three, and a RESTRICT on shipments beneath a cascading order blocks the delete of the customer even though customers has no restricting key of its own. Returning the blocker up the call stack rather than throwing keeps the function pure and its result a plain value the caller can display before running anything.',
        complexity:
          'O(k × r) time for k foreign keys and r total rows in the worst case, O(d) stack depth for d levels of cascade. The guarantee that matters is that the plan matches what the database would do, including refusing the whole operation when any reachable child is protected.',
      },
    ],
  },
}
