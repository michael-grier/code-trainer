import { defineSchema, defineTable } from 'convex/server'

import {
  userProblemProgressFields,
  userSettingsFields,
} from './progressValidators'

export default defineSchema({
  userProblemProgress: defineTable(userProblemProgressFields)
    .index('by_user', ['userId'])
    .index('by_user_problem', ['userId', 'lessonSlug', 'problemId']),
  userSettings: defineTable(userSettingsFields).index('by_user', ['userId']),
})
