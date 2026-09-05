import {
  mutationGeneric,
  queryGeneric,
  type DataModelFromSchemaDefinition,
  type MutationBuilder,
  type QueryBuilder,
} from 'convex/server'
import { ConvexError, v } from 'convex/values'

import { requireAuthUserId } from './auth'
import schema from './schema'
import {
  validateLastVisited,
  validateProblemProgress,
  validateProgressSnapshot,
  type ProgressInputIssue,
} from './progressLimits'
import {
  cloudProblemProgressValidator,
  cloudProgressResponseValidator,
  cloudProgressSnapshotValidator,
} from './progressValidators'

type DataModel = DataModelFromSchemaDefinition<typeof schema>

const query = queryGeneric as QueryBuilder<DataModel, 'public'>
const mutation = mutationGeneric as MutationBuilder<DataModel, 'public'>

export const getProgress = query({
  args: {},
  returns: cloudProgressResponseValidator,
  handler: async (ctx) => {
    const userId = await requireAuthUserId(ctx)
    const problems = await ctx.db
      .query('userProblemProgress')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .collect()
    const settings = await ctx.db
      .query('userSettings')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .unique()

    return {
      userId,
      progress: {
        problems: problems.map((problem) => ({
          lessonSlug: problem.lessonSlug,
          problemId: problem.problemId,
          completedAt: problem.completedAt,
          draft: problem.draft,
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
      },
    }
  },
})

export const mergeProgress = mutation({
  args: {
    expectedUserId: v.string(),
    progress: cloudProgressSnapshotValidator,
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await requireAuthUserId(ctx)

    // This value is a concurrency guard, never the source of authority. It
    // prevents an in-flight snapshot from crossing an account switch.
    if (args.expectedUserId !== userId) {
      throw new ConvexError({ code: 'AUTH_ACCOUNT_CHANGED' })
    }

    enforceProgressInput(validateProgressSnapshot(args.progress))

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
    const userId = await requireAuthUserId(ctx)
    enforceProgressInput(validateProblemProgress(args.problem))
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
    const userId = await requireAuthUserId(ctx)
    enforceProgressInput(validateLastVisited(args))
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
    const userId = await requireAuthUserId(ctx)
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

function enforceProgressInput(issue: ProgressInputIssue | undefined) {
  if (issue) {
    // Field names are safe to return; submitted answers never enter errors or logs.
    throw new ConvexError(issue)
  }
}
