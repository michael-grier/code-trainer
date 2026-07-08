import {
  createEmptyProgressState,
  getDesignAnswerKey,
  getDraftKey,
  getProblemKey,
  getTraceAnswerKey,
  getUpdatedAtKey,
  type ProgressState,
} from '@/state/progress'

export type CloudProblemProgressRecord = {
  lessonSlug: string
  problemId: string
  completedAt?: number
  draft?: string
  traceAnswers?: Record<string, unknown>
  writtenAnswer?: string
  designAnswers?: Record<string, unknown>
  rubricReviews?: string[]
  revealedReferenceAt?: number
  fieldUpdatedAt?: Record<string, number>
  updatedAt: number
}

export type CloudUserSettings = {
  lastLessonSlug?: string
  lastProblemId?: string
  pathMode?: 'guided' | 'self-directed'
  focusLessonSlug?: string
  queuedLessonSlugs?: string[]
  lastVisitedUpdatedAt?: number
  learningPathUpdatedAt?: number
  updatedAt: number
}

export type CloudProgressSnapshot = {
  problems: CloudProblemProgressRecord[]
  settings: CloudUserSettings | null
}

type MutableCloudProblemProgressRecord = CloudProblemProgressRecord & {
  traceAnswers: Record<string, unknown>
  designAnswers: Record<string, unknown>
  rubricReviews: string[]
  fieldUpdatedAt: Record<string, number>
}

const RECENT_QUEUE_MERGE_MS = 5 * 60 * 1000
const LEARNING_PATH_UPDATED_AT_KEY = getUpdatedAtKey('learningPath')

export function progressStateToCloudSnapshot(
  state: ProgressState,
  fallbackUpdatedAt = Date.now(),
): CloudProgressSnapshot {
  const records = new Map<string, MutableCloudProblemProgressRecord>()
  const ensureRecord = (lessonSlug: string, problemId: string) => {
    const problemKey = getProblemKey(lessonSlug, problemId)
    const existing = records.get(problemKey)

    if (existing) {
      return existing
    }

    const record: MutableCloudProblemProgressRecord = {
      lessonSlug,
      problemId,
      traceAnswers: {},
      designAnswers: {},
      rubricReviews: [],
      fieldUpdatedAt: {},
      updatedAt: 0,
    }

    records.set(problemKey, record)
    return record
  }
  const touchRecord = (
    record: MutableCloudProblemProgressRecord,
    updatedAtKey: string,
  ) => {
    const updatedAt = state.updatedAt[updatedAtKey] ?? fallbackUpdatedAt

    record.fieldUpdatedAt[updatedAtKey] = updatedAt
    record.updatedAt = Math.max(record.updatedAt, updatedAt)

    return updatedAt
  }

  for (const problemKey of Object.keys(state.completed)) {
    const parts = parseProgressKey(problemKey, 2)

    if (!parts) {
      continue
    }

    const [lessonSlug, problemId] = parts
    const record = ensureRecord(lessonSlug, problemId)
    const updatedAtKey = getUpdatedAtKey('completed', lessonSlug, problemId)

    record.completedAt = touchRecord(record, updatedAtKey)
  }

  for (const [draftKey, draft] of Object.entries(state.drafts)) {
    const parts = parseProgressKey(draftKey, 2)

    if (!parts) {
      continue
    }

    const [lessonSlug, problemId] = parts
    const record = ensureRecord(lessonSlug, problemId)

    record.draft = draft
    touchRecord(record, getUpdatedAtKey('drafts', lessonSlug, problemId))
  }

  for (const [answerKey, answer] of Object.entries(state.traceAnswers)) {
    const parts = parseProgressKey(answerKey, 3)

    if (!parts) {
      continue
    }

    const [lessonSlug, problemId, questionId] = parts
    const record = ensureRecord(lessonSlug, problemId)

    record.traceAnswers[questionId] = answer
    touchRecord(
      record,
      getUpdatedAtKey('traceAnswers', lessonSlug, problemId, questionId),
    )
  }

  for (const [problemKey, answer] of Object.entries(state.writtenAnswers)) {
    const parts = parseProgressKey(problemKey, 2)

    if (!parts) {
      continue
    }

    const [lessonSlug, problemId] = parts
    const record = ensureRecord(lessonSlug, problemId)

    record.writtenAnswer = answer
    touchRecord(record, getUpdatedAtKey('writtenAnswers', lessonSlug, problemId))
  }

  for (const [answerKey, answer] of Object.entries(state.designAnswers)) {
    const parts = parseProgressKey(answerKey, 3)

    if (!parts) {
      continue
    }

    const [lessonSlug, problemId, sectionId] = parts
    const record = ensureRecord(lessonSlug, problemId)

    record.designAnswers[sectionId] = answer
    touchRecord(
      record,
      getUpdatedAtKey('designAnswers', lessonSlug, problemId, sectionId),
    )
  }

  for (const [problemKey, review] of Object.entries(state.rubricReviews)) {
    const parts = parseProgressKey(problemKey, 2)

    if (!parts) {
      continue
    }

    const [lessonSlug, problemId] = parts
    const record = ensureRecord(lessonSlug, problemId)
    const rubricItemIds = Object.keys(review).sort()

    record.rubricReviews = rubricItemIds

    for (const rubricItemId of rubricItemIds) {
      touchRecord(
        record,
        getUpdatedAtKey('rubricReviews', lessonSlug, problemId, rubricItemId),
      )
    }
  }

  for (const problemKey of Object.keys(state.revealedReferences)) {
    const parts = parseProgressKey(problemKey, 2)

    if (!parts) {
      continue
    }

    const [lessonSlug, problemId] = parts
    const record = ensureRecord(lessonSlug, problemId)
    const updatedAtKey = getUpdatedAtKey('revealedReferences', lessonSlug, problemId)

    record.revealedReferenceAt = touchRecord(record, updatedAtKey)
  }

  const problems = [...records.values()].map(toCloudRecord)
  const learningPathUpdatedAt = getLearningPathUpdatedAt(state)
  const lastVisitedUpdatedAt =
    state.lastVisited?.updatedAt ?? state.updatedAt[getUpdatedAtKey('lastVisited')]
  const settingsUpdatedAt = Math.max(
    learningPathUpdatedAt,
    lastVisitedUpdatedAt ?? 0,
    fallbackUpdatedAt,
  )

  return {
    problems,
    settings: {
      lastLessonSlug: state.lastVisited?.lessonSlug,
      lastProblemId: state.lastVisited?.problemId,
      pathMode: state.learningPath.mode,
      focusLessonSlug: state.learningPath.focusLessonSlug,
      queuedLessonSlugs: state.learningPath.queuedLessonSlugs,
      lastVisitedUpdatedAt,
      learningPathUpdatedAt,
      updatedAt: settingsUpdatedAt,
    },
  }
}

export function cloudSnapshotToProgressState(
  snapshot: CloudProgressSnapshot,
): ProgressState {
  const state = createEmptyProgressState(0)

  for (const problem of snapshot.problems) {
    const problemKey = getProblemKey(problem.lessonSlug, problem.problemId)

    if (typeof problem.completedAt === 'number') {
      const updatedAtKey = getUpdatedAtKey(
        'completed',
        problem.lessonSlug,
        problem.problemId,
      )

      state.completed[problemKey] = true
      state.updatedAt[updatedAtKey] = getProblemFieldUpdatedAt(
        problem,
        updatedAtKey,
        problem.completedAt,
      )
    }

    if (typeof problem.draft === 'string') {
      const draftKey = getDraftKey(problem.lessonSlug, problem.problemId)
      const updatedAtKey = getUpdatedAtKey(
        'drafts',
        problem.lessonSlug,
        problem.problemId,
      )

      state.drafts[draftKey] = problem.draft
      state.updatedAt[updatedAtKey] = getProblemFieldUpdatedAt(problem, updatedAtKey)
    }

    if (isRecord(problem.traceAnswers)) {
      for (const [questionId, answer] of Object.entries(problem.traceAnswers)) {
        const answerKey = getTraceAnswerKey(
          problem.lessonSlug,
          problem.problemId,
          questionId,
        )
        const updatedAtKey = getUpdatedAtKey(
          'traceAnswers',
          problem.lessonSlug,
          problem.problemId,
          questionId,
        )

        state.traceAnswers[answerKey] = answer
        state.updatedAt[updatedAtKey] = getProblemFieldUpdatedAt(
          problem,
          updatedAtKey,
        )
      }
    }

    if (typeof problem.writtenAnswer === 'string') {
      const updatedAtKey = getUpdatedAtKey(
        'writtenAnswers',
        problem.lessonSlug,
        problem.problemId,
      )

      state.writtenAnswers[problemKey] = problem.writtenAnswer
      state.updatedAt[updatedAtKey] = getProblemFieldUpdatedAt(problem, updatedAtKey)
    }

    if (isRecord(problem.designAnswers)) {
      for (const [sectionId, answer] of Object.entries(problem.designAnswers)) {
        const answerKey = getDesignAnswerKey(
          problem.lessonSlug,
          problem.problemId,
          sectionId,
        )
        const updatedAtKey = getUpdatedAtKey(
          'designAnswers',
          problem.lessonSlug,
          problem.problemId,
          sectionId,
        )

        state.designAnswers[answerKey] = answer
        state.updatedAt[updatedAtKey] = getProblemFieldUpdatedAt(
          problem,
          updatedAtKey,
        )
      }
    }

    if (problem.rubricReviews && problem.rubricReviews.length > 0) {
      state.rubricReviews[problemKey] = {}

      for (const rubricItemId of problem.rubricReviews) {
        const updatedAtKey = getUpdatedAtKey(
          'rubricReviews',
          problem.lessonSlug,
          problem.problemId,
          rubricItemId,
        )

        state.rubricReviews[problemKey][rubricItemId] = true
        state.updatedAt[updatedAtKey] = getProblemFieldUpdatedAt(
          problem,
          updatedAtKey,
        )
      }
    }

    if (typeof problem.revealedReferenceAt === 'number') {
      const updatedAtKey = getUpdatedAtKey(
        'revealedReferences',
        problem.lessonSlug,
        problem.problemId,
      )

      state.revealedReferences[problemKey] = true
      state.updatedAt[updatedAtKey] = getProblemFieldUpdatedAt(
        problem,
        updatedAtKey,
        problem.revealedReferenceAt,
      )
    }
  }

  if (snapshot.settings) {
    const settings = snapshot.settings
    const learningPathUpdatedAt =
      settings.learningPathUpdatedAt ?? settings.updatedAt

    state.learningPath = {
      mode: settings.pathMode === 'self-directed' ? 'self-directed' : 'guided',
      focusLessonSlug: settings.focusLessonSlug,
      queuedLessonSlugs: settings.queuedLessonSlugs ?? [],
      updatedAt: learningPathUpdatedAt,
    }

    if (learningPathUpdatedAt > 0) {
      state.updatedAt[LEARNING_PATH_UPDATED_AT_KEY] = learningPathUpdatedAt
    }

    if (settings.lastLessonSlug) {
      const lastVisitedUpdatedAt =
        settings.lastVisitedUpdatedAt ?? settings.updatedAt

      state.lastVisited = {
        lessonSlug: settings.lastLessonSlug,
        problemId: settings.lastProblemId,
        updatedAt: lastVisitedUpdatedAt,
      }
      state.updatedAt[getUpdatedAtKey('lastVisited')] = lastVisitedUpdatedAt
    }
  }

  return state
}

export function mergeProgressStates(
  local: ProgressState,
  cloud: ProgressState,
): ProgressState {
  const merged = createEmptyProgressState(0)

  mergeTrueRecord(merged, local, cloud, 'completed')
  mergeLastWriteRecord(merged.drafts, merged, local, cloud, 'drafts')
  mergeLastWriteRecord(merged.traceAnswers, merged, local, cloud, 'traceAnswers')
  mergeLastWriteRecord(
    merged.writtenAnswers,
    merged,
    local,
    cloud,
    'writtenAnswers',
  )
  mergeLastWriteRecord(merged.designAnswers, merged, local, cloud, 'designAnswers')
  mergeNestedTrueRecord(merged, local, cloud, 'rubricReviews')
  mergeTrueRecord(merged, local, cloud, 'revealedReferences')
  mergeLearningPath(merged, local, cloud)
  mergeLastVisited(merged, local, cloud)

  merged.lastSyncedAt = Math.max(local.lastSyncedAt ?? 0, cloud.lastSyncedAt ?? 0) || undefined

  return merged
}

export function markProgressSynced(
  state: ProgressState,
  syncedAt = Date.now(),
): ProgressState {
  return {
    ...state,
    lastSyncedAt: syncedAt,
  }
}

export function getProgressRevision(state: ProgressState) {
  return Math.max(
    ...Object.values(state.updatedAt),
    getLearningPathUpdatedAt(state),
    state.lastVisited?.updatedAt ?? 0,
    0,
  )
}

export function getLearningPathUpdatedAt(state: ProgressState) {
  const explicitUpdatedAt = state.updatedAt[LEARNING_PATH_UPDATED_AT_KEY]

  if (typeof explicitUpdatedAt === 'number') {
    return explicitUpdatedAt
  }

  if (
    state.learningPath.mode !== 'guided' ||
    state.learningPath.focusLessonSlug ||
    state.learningPath.queuedLessonSlugs.length > 0
  ) {
    return state.learningPath.updatedAt
  }

  return 0
}

function toCloudRecord(
  record: MutableCloudProblemProgressRecord,
): CloudProblemProgressRecord {
  const traceAnswers = hasKeys(record.traceAnswers) ? record.traceAnswers : undefined
  const designAnswers = hasKeys(record.designAnswers)
    ? record.designAnswers
    : undefined
  const rubricReviews =
    record.rubricReviews.length > 0 ? record.rubricReviews : undefined
  const updatedAt = record.updatedAt || Math.max(...Object.values(record.fieldUpdatedAt), 0)

  return {
    lessonSlug: record.lessonSlug,
    problemId: record.problemId,
    completedAt: record.completedAt,
    draft: record.draft,
    traceAnswers,
    writtenAnswer: record.writtenAnswer,
    designAnswers,
    rubricReviews,
    revealedReferenceAt: record.revealedReferenceAt,
    fieldUpdatedAt: hasKeys(record.fieldUpdatedAt) ? record.fieldUpdatedAt : undefined,
    updatedAt,
  }
}

function getProblemFieldUpdatedAt(
  problem: CloudProblemProgressRecord,
  updatedAtKey: string,
  fallback = problem.updatedAt,
) {
  return problem.fieldUpdatedAt?.[updatedAtKey] ?? fallback
}

function mergeTrueRecord(
  merged: ProgressState,
  local: ProgressState,
  cloud: ProgressState,
  field: 'completed' | 'revealedReferences',
) {
  for (const key of unionKeys(local[field], cloud[field])) {
    const updatedAtKey = getUpdatedAtKey(field, ...key.split('::'))
    const localUpdatedAt = local.updatedAt[updatedAtKey] ?? 0
    const cloudUpdatedAt = cloud.updatedAt[updatedAtKey] ?? 0

    merged[field][key] = true
    merged.updatedAt[updatedAtKey] = Math.max(localUpdatedAt, cloudUpdatedAt)
  }
}

function mergeLastWriteRecord<T>(
  target: Record<string, T>,
  merged: ProgressState,
  local: ProgressState,
  cloud: ProgressState,
  field:
    | 'drafts'
    | 'traceAnswers'
    | 'writtenAnswers'
    | 'designAnswers',
) {
  const localRecord = local[field] as Record<string, T>
  const cloudRecord = cloud[field] as Record<string, T>

  for (const key of unionKeys(localRecord, cloudRecord)) {
    const updatedAtKey = getUpdatedAtKey(field, ...key.split('::'))
    const hasLocalValue = hasOwn(localRecord, key)
    const hasCloudValue = hasOwn(cloudRecord, key)

    if (!hasLocalValue && !hasCloudValue) {
      continue
    }

    if (!hasCloudValue) {
      target[key] = localRecord[key]
      merged.updatedAt[updatedAtKey] = local.updatedAt[updatedAtKey] ?? 0
      continue
    }

    if (!hasLocalValue) {
      target[key] = cloudRecord[key]
      merged.updatedAt[updatedAtKey] = cloud.updatedAt[updatedAtKey] ?? 0
      continue
    }

    const localUpdatedAt = local.updatedAt[updatedAtKey] ?? 0
    const cloudUpdatedAt = cloud.updatedAt[updatedAtKey] ?? 0
    const useLocal = localUpdatedAt >= cloudUpdatedAt

    target[key] = useLocal ? localRecord[key] : cloudRecord[key]
    merged.updatedAt[updatedAtKey] = useLocal ? localUpdatedAt : cloudUpdatedAt
  }
}

function mergeNestedTrueRecord(
  merged: ProgressState,
  local: ProgressState,
  cloud: ProgressState,
  field: 'rubricReviews',
) {
  for (const problemKey of unionKeys(local[field], cloud[field])) {
    const localReview = local[field][problemKey] ?? {}
    const cloudReview = cloud[field][problemKey] ?? {}
    const rubricItemIds = unionKeys(localReview, cloudReview)

    if (rubricItemIds.length === 0) {
      continue
    }

    merged[field][problemKey] = {}

    for (const rubricItemId of rubricItemIds) {
      const updatedAtKey = getUpdatedAtKey(
        field,
        ...problemKey.split('::'),
        rubricItemId,
      )
      const localUpdatedAt = local.updatedAt[updatedAtKey] ?? 0
      const cloudUpdatedAt = cloud.updatedAt[updatedAtKey] ?? 0

      merged[field][problemKey][rubricItemId] = true
      merged.updatedAt[updatedAtKey] = Math.max(localUpdatedAt, cloudUpdatedAt)
    }
  }
}

function mergeLearningPath(
  merged: ProgressState,
  local: ProgressState,
  cloud: ProgressState,
) {
  const localUpdatedAt = getLearningPathUpdatedAt(local)
  const cloudUpdatedAt = getLearningPathUpdatedAt(cloud)
  const latest =
    localUpdatedAt >= cloudUpdatedAt ? local.learningPath : cloud.learningPath
  const shouldUnionQueue =
    localUpdatedAt > 0 &&
    cloudUpdatedAt > 0 &&
    Math.abs(localUpdatedAt - cloudUpdatedAt) <= RECENT_QUEUE_MERGE_MS
  const queuedLessonSlugs = shouldUnionQueue
    ? unionValues(
        local.learningPath.queuedLessonSlugs,
        cloud.learningPath.queuedLessonSlugs,
      )
    : latest.queuedLessonSlugs
  const updatedAt = Math.max(localUpdatedAt, cloudUpdatedAt)

  merged.learningPath = {
    mode: latest.mode,
    focusLessonSlug: latest.focusLessonSlug,
    queuedLessonSlugs,
    updatedAt,
  }

  if (updatedAt > 0) {
    merged.updatedAt[LEARNING_PATH_UPDATED_AT_KEY] = updatedAt
  }
}

function mergeLastVisited(
  merged: ProgressState,
  local: ProgressState,
  cloud: ProgressState,
) {
  const localUpdatedAt = local.lastVisited?.updatedAt ?? 0
  const cloudUpdatedAt = cloud.lastVisited?.updatedAt ?? 0

  if (!local.lastVisited && !cloud.lastVisited) {
    return
  }

  const lastVisited =
    localUpdatedAt >= cloudUpdatedAt ? local.lastVisited : cloud.lastVisited

  if (!lastVisited) {
    return
  }

  merged.lastVisited = { ...lastVisited }
  merged.updatedAt[getUpdatedAtKey('lastVisited')] = Math.max(
    localUpdatedAt,
    cloudUpdatedAt,
  )
}

function parseProgressKey(key: string, expectedParts: number) {
  const parts = key.split('::')

  return parts.length === expectedParts ? parts : null
}

function unionKeys(
  first: Record<string, unknown>,
  second: Record<string, unknown>,
) {
  return [...new Set([...Object.keys(first), ...Object.keys(second)])]
}

function unionValues(first: string[], second: string[]) {
  return [...new Set([...first, ...second])]
}

function hasKeys(value: Record<string, unknown>) {
  return Object.keys(value).length > 0
}

function hasOwn(record: Record<string, unknown>, key: string) {
  return Object.prototype.hasOwnProperty.call(record, key)
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}
