import { defineSchema, defineTable } from 'convex/server'
import { v } from 'convex/values'

import {
  userProblemProgressFields,
  userSettingsFields,
} from './progressValidators'

export default defineSchema({
  authEmailRateLimits: defineTable({
    key: v.string(),
    count: v.number(),
    windowStartedAt: v.number(),
    lastSentAt: v.number(),
  }).index('by_key', ['key']),
  authRequestRateLimits: defineTable({
    key: v.string(),
    count: v.number(),
    lastRequest: v.number(),
  })
    .index('by_key', ['key'])
    .index('by_last_request', ['lastRequest']),
  userProblemProgress: defineTable(userProblemProgressFields)
    .index('by_user', ['userId'])
    .index('by_user_problem', ['userId', 'lessonSlug', 'problemId']),
  userSettings: defineTable(userSettingsFields).index('by_user', ['userId']),
})
