import { v } from 'convex/values'

export const fieldUpdatedAtValidator = v.record(v.string(), v.number())

export const cloudProblemProgressFields = {
  lessonSlug: v.string(),
  problemId: v.string(),
  completedAt: v.optional(v.number()),
  draft: v.optional(v.string()),
  traceAnswers: v.optional(v.any()),
  writtenAnswer: v.optional(v.string()),
  designAnswers: v.optional(v.any()),
  rubricReviews: v.optional(v.array(v.string())),
  revealedReferenceAt: v.optional(v.number()),
  fieldUpdatedAt: v.optional(fieldUpdatedAtValidator),
  updatedAt: v.number(),
}

export const userProblemProgressFields = {
  userId: v.string(),
  ...cloudProblemProgressFields,
}

export const cloudUserSettingsFields = {
  lastLessonSlug: v.optional(v.string()),
  lastProblemId: v.optional(v.string()),
  pathMode: v.optional(v.union(v.literal('guided'), v.literal('self-directed'))),
  focusLessonSlug: v.optional(v.string()),
  queuedLessonSlugs: v.optional(v.array(v.string())),
  lastVisitedUpdatedAt: v.optional(v.number()),
  learningPathUpdatedAt: v.optional(v.number()),
  updatedAt: v.number(),
}

export const userSettingsFields = {
  userId: v.string(),
  ...cloudUserSettingsFields,
}

export const cloudProblemProgressValidator = v.object(cloudProblemProgressFields)

export const cloudUserSettingsValidator = v.object(cloudUserSettingsFields)

export const cloudProgressSnapshotValidator = v.object({
  problems: v.array(cloudProblemProgressValidator),
  settings: v.union(cloudUserSettingsValidator, v.null()),
})

export const cloudProgressResponseValidator = v.object({
  userId: v.string(),
  progress: cloudProgressSnapshotValidator,
})
