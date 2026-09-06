import { v } from 'convex/values'

import {
  internalMutation,
  internalQuery,
  type MutationCtx,
} from './_generated/server'

const REQUEST_RATE_LIMIT_RETENTION_MS = 24 * 60 * 60 * 1_000
const textEncoder = new TextEncoder()

type RequestRateLimitState = {
  count: number
  lastRequest: number
}

/** Hides rate-limit identifiers behind a secret-keyed digest. */
export function createPrivateAuthKey(value: string) {
  const secret = process.env.BETTER_AUTH_SECRET?.trim()

  if (!secret || secret.length < 32) {
    throw new Error('BETTER_AUTH_SECRET must contain at least 32 characters.')
  }

  return createPrivateDigest(secret, value)
}

export const getAuthRequestRateLimit = internalQuery({
  args: { key: v.string() },
  returns: v.union(
    v.null(),
    v.object({
      key: v.string(),
      count: v.number(),
      lastRequest: v.number(),
    }),
  ),
  handler: async (ctx, args) => {
    const record = await ctx.db
      .query('authRequestRateLimits')
      .withIndex('by_key', (q) => q.eq('key', args.key))
      .unique()

    return record
      ? {
          key: record.key,
          count: record.count,
          lastRequest: record.lastRequest,
        }
      : null
  },
})

export const setAuthRequestRateLimit = internalMutation({
  args: {
    key: v.string(),
    count: v.number(),
    lastRequest: v.number(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query('authRequestRateLimits')
      .withIndex('by_key', (q) => q.eq('key', args.key))
      .unique()

    if (existing) {
      await ctx.db.patch('authRequestRateLimits', existing._id, args)
    } else {
      await ctx.db.insert('authRequestRateLimits', args)
    }

    return null
  },
})

export const consumeAuthRequestRateLimit = internalMutation({
  args: {
    key: v.string(),
    windowSeconds: v.number(),
    max: v.number(),
  },
  returns: v.object({
    allowed: v.boolean(),
    retryAfter: v.union(v.number(), v.null()),
  }),
  handler: async (ctx, args) => {
    const now = Date.now()
    const existing = await ctx.db
      .query('authRequestRateLimits')
      .withIndex('by_key', (q) => q.eq('key', args.key))
      .unique()
    const decision = decideAuthRequestRateLimit(existing, {
      now,
      windowSeconds: args.windowSeconds,
      max: args.max,
    })

    if (decision.next) {
      if (existing) {
        await ctx.db.patch(
          'authRequestRateLimits',
          existing._id,
          decision.next,
        )
      } else {
        await ctx.db.insert('authRequestRateLimits', {
          key: args.key,
          ...decision.next,
        })
      }
    }

    if (!existing || decision.next?.count === 1) {
      await removeExpiredRequestLimits(ctx, now)
    }

    return {
      allowed: decision.allowed,
      retryAfter: decision.retryAfter,
    }
  },
})

export function decideAuthRequestRateLimit(
  existing: RequestRateLimitState | null,
  rule: { now: number; windowSeconds: number; max: number },
): {
  allowed: boolean
  retryAfter: number | null
  next?: RequestRateLimitState
} {
  const windowMs = rule.windowSeconds * 1_000

  if (!existing || rule.now - existing.lastRequest >= windowMs) {
    return {
      allowed: true,
      retryAfter: null,
      next: { count: 1, lastRequest: rule.now },
    }
  }

  if (existing.count >= rule.max) {
    return {
      allowed: false,
      retryAfter: Math.max(
        1,
        Math.ceil((existing.lastRequest + windowMs - rule.now) / 1_000),
      ),
    }
  }

  return {
    allowed: true,
    retryAfter: null,
    next: { count: existing.count + 1, lastRequest: rule.now },
  }
}

async function removeExpiredRequestLimits(ctx: MutationCtx, now: number) {
  const expired = await ctx.db
    .query('authRequestRateLimits')
    .withIndex('by_last_request', (q) =>
      q.lt('lastRequest', now - REQUEST_RATE_LIMIT_RETENTION_MS),
    )
    .take(20)

  for (const record of expired) {
    await ctx.db.delete('authRequestRateLimits', record._id)
  }
}

async function createPrivateDigest(secret: string, value: string) {
  const key = await crypto.subtle.importKey(
    'raw',
    textEncoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    textEncoder.encode(value),
  )

  return Array.from(new Uint8Array(signature), (byte) =>
    byte.toString(16).padStart(2, '0'),
  ).join('')
}
