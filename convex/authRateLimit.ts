import { v } from 'convex/values'

import {
  internalMutation,
  internalQuery,
  type MutationCtx,
} from './_generated/server'

const EMAIL_SEND_COOLDOWN_MS = 60 * 1_000
const EMAIL_SEND_WINDOW_MS = 60 * 60 * 1_000
const MAX_EMAIL_SENDS_PER_WINDOW = 5
const REQUEST_RATE_LIMIT_RETENTION_MS = 24 * 60 * 60 * 1_000

type RequestRateLimitState = {
  count: number
  lastRequest: number
}

export const consumeAuthEmailSend = internalMutation({
  args: {
    key: v.string(),
  },
  returns: v.object({
    allowed: v.boolean(),
    retryAfterSeconds: v.number(),
  }),
  handler: async (ctx, args) => {
    const now = Date.now()
    const existing = await ctx.db
      .query('authEmailRateLimits')
      .withIndex('by_key', (q) => q.eq('key', args.key))
      .unique()

    if (!existing) {
      await ctx.db.insert('authEmailRateLimits', {
        key: args.key,
        count: 1,
        windowStartedAt: now,
        lastSentAt: now,
      })
      return { allowed: true, retryAfterSeconds: 0 }
    }

    const windowEndsAt = existing.windowStartedAt + EMAIL_SEND_WINDOW_MS

    if (now >= windowEndsAt) {
      await ctx.db.patch('authEmailRateLimits', existing._id, {
        count: 1,
        windowStartedAt: now,
        lastSentAt: now,
      })
      return { allowed: true, retryAfterSeconds: 0 }
    }

    const cooldownEndsAt = existing.lastSentAt + EMAIL_SEND_COOLDOWN_MS

    if (now < cooldownEndsAt) {
      return blockedUntil(cooldownEndsAt, now)
    }

    if (existing.count >= MAX_EMAIL_SENDS_PER_WINDOW) {
      return blockedUntil(windowEndsAt, now)
    }

    await ctx.db.patch('authEmailRateLimits', existing._id, {
      count: existing.count + 1,
      lastSentAt: now,
    })
    return { allowed: true, retryAfterSeconds: 0 }
  },
})

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

function blockedUntil(blockedUntilMs: number, now: number) {
  return {
    allowed: false,
    retryAfterSeconds: Math.max(1, Math.ceil((blockedUntilMs - now) / 1_000)),
  }
}
