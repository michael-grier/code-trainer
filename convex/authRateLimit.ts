import { v } from 'convex/values'

import { internalMutation } from './_generated/server'

const EMAIL_SEND_COOLDOWN_MS = 60 * 1_000
const EMAIL_SEND_WINDOW_MS = 60 * 60 * 1_000
const MAX_EMAIL_SENDS_PER_WINDOW = 5

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

function blockedUntil(blockedUntilMs: number, now: number) {
  return {
    allowed: false,
    retryAfterSeconds: Math.max(1, Math.ceil((blockedUntilMs - now) / 1_000)),
  }
}
