import {
  mutationGeneric,
  queryGeneric,
  type DataModelFromSchemaDefinition,
  type GenericMutationCtx,
  type GenericQueryCtx,
  type MutationBuilder,
  type QueryBuilder,
} from 'convex/server'
import { v } from 'convex/values'

import schema from './schema'
import {
  cloudProblemProgressValidator,
  cloudProgressSnapshotValidator,
} from './progressValidators'

type DataModel = DataModelFromSchemaDefinition<typeof schema>
type QueryCtx = GenericQueryCtx<DataModel>
type MutationCtx = GenericMutationCtx<DataModel>

const query = queryGeneric as QueryBuilder<DataModel, 'public'>
const mutation = mutationGeneric as MutationBuilder<DataModel, 'public'>

async function requireUserId(ctx: Pick<QueryCtx | MutationCtx, 'auth'>) {
  const identity = await ctx.auth.getUserIdentity()

  if (!identity) {
    throw new Error('Authentication required')
  }

  return identity.subject
}

export const getProgress = query({
  args: {},
  returns: cloudProgressSnapshotValidator,
  handler: async (ctx) => {
    const userId = await requireUserId(ctx)
    const problems = await ctx.db
      .query('userProblemProgress')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .collect()
    const settings = await ctx.db
      .query('userSettings')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .unique()

    return {
      problems: problems.map((problem) => ({
        lessonSlug: problem.lessonSlug,
        problemId: problem.problemId,
        completedAt: problem.completedAt,
        language: problem.language,
        drafts: problem.drafts,
        traceAnswers: problem.traceAnswers,
        writtenAnswer: problem.writtenAnswer,
        designAnswers: problem.designAnswers,
        rubricReviews: problem.rubricReviews,
        revealedReferenceAt: problem.revealedReferenceAt,
        fieldUpdatedAt: problem.fieldUpdatedAt,
        updatedAt: problem.updatedAt,
      })),
      settings: settings
        ? {
            lastLessonSlug: settings.lastLessonSlug,
            lastProblemId: settings.lastProblemId,
            pathMode: settings.pathMode,
            focusLessonSlug: settings.focusLessonSlug,
            queuedLessonSlugs: settings.queuedLessonSlugs,
            lastVisitedUpdatedAt: settings.lastVisitedUpdatedAt,
            learningPathUpdatedAt: settings.learningPathUpdatedAt,
            updatedAt: settings.updatedAt,
          }
        : null,
    }
  },
})

export const mergeProgress = mutation({
  args: {
    progress: cloudProgressSnapshotValidator,
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx)
    const existingProblems = await ctx.db
      .query('userProblemProgress')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .collect()
    const existingByProblem = new Map(
      existingProblems.map((problem) => [
        getProblemKey(problem.lessonSlug, problem.problemId),
        problem,
      ]),
    )
    const incomingProblemKeys = new Set<string>()

    for (const problem of args.progress.problems) {
      const key = getProblemKey(problem.lessonSlug, problem.problemId)
      const existing = existingByProblem.get(key)
      const document = { userId, ...problem }

      incomingProblemKeys.add(key)

      if (existing) {
        await ctx.db.replace('userProblemProgress', existing._id, document)
      } else {
        await ctx.db.insert('userProblemProgress', document)
      }
    }

    for (const problem of existingProblems) {
      if (!incomingProblemKeys.has(getProblemKey(problem.lessonSlug, problem.problemId))) {
        await ctx.db.delete('userProblemProgress', problem._id)
      }
    }

    const existingSettings = await ctx.db
      .query('userSettings')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .unique()

    if (args.progress.settings) {
      const document = { userId, ...args.progress.settings }

      if (existingSettings) {
        await ctx.db.replace('userSettings', existingSettings._id, document)
      } else {
        await ctx.db.insert('userSettings', document)
      }
    } else if (existingSettings) {
      await ctx.db.delete('userSettings', existingSettings._id)
    }

    return null
  },
})

export const upsertProblemProgress = mutation({
  args: {
    problem: cloudProblemProgressValidator,
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx)
    const existing = await ctx.db
      .query('userProblemProgress')
      .withIndex('by_user_problem', (q) =>
        q
          .eq('userId', userId)
          .eq('lessonSlug', args.problem.lessonSlug)
          .eq('problemId', args.problem.problemId),
      )
      .unique()
    const document = { userId, ...args.problem }

    if (existing) {
      await ctx.db.replace('userProblemProgress', existing._id, document)
    } else {
      await ctx.db.insert('userProblemProgress', document)
    }

    return null
  },
})

export const updateLastVisited = mutation({
  args: {
    lessonSlug: v.string(),
    problemId: v.optional(v.string()),
    updatedAt: v.number(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx)
    const existingSettings = await ctx.db
      .query('userSettings')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .unique()
    const updatedAt = Math.max(existingSettings?.updatedAt ?? 0, args.updatedAt)

    if (existingSettings) {
      await ctx.db.patch('userSettings', existingSettings._id, {
        lastLessonSlug: args.lessonSlug,
        lastProblemId: args.problemId,
        lastVisitedUpdatedAt: args.updatedAt,
        updatedAt,
      })
    } else {
      await ctx.db.insert('userSettings', {
        userId,
        lastLessonSlug: args.lessonSlug,
        lastProblemId: args.problemId,
        lastVisitedUpdatedAt: args.updatedAt,
        updatedAt,
      })
    }

    return null
  },
})

export const clearUserProgress = mutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const userId = await requireUserId(ctx)
    const problems = await ctx.db
      .query('userProblemProgress')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .collect()
    const settings = await ctx.db
      .query('userSettings')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .unique()

    for (const problem of problems) {
      await ctx.db.delete('userProblemProgress', problem._id)
    }

    if (settings) {
      await ctx.db.delete('userSettings', settings._id)
    }

    return null
  },
})

function getProblemKey(lessonSlug: string, problemId: string) {
  return `${lessonSlug}::${problemId}`
}
