export const PROGRESS_LIMITS = {
  maxProblems: 500,
  maxIdentifierLength: 120,
  maxDraftLength: 150_000,
  maxWrittenAnswerLength: 50_000,
  maxAnswersPerProblem: 100,
  maxRubricItemsPerProblem: 100,
  maxFieldTimestampsPerProblem: 400,
  maxQueuedLessons: 200,
  maxStructuredAnswerBytes: 32_000,
  maxProblemBytes: 400_000,
  maxSnapshotBytes: 2_000_000,
  maxFutureClockSkewMs: 5 * 60 * 1_000,
  maxJsonDepth: 8,
  maxJsonCollectionEntries: 200,
} as const

export type ProgressInputIssue = {
  code: 'PROGRESS_INPUT_INVALID' | 'PROGRESS_LIMIT_EXCEEDED'
  field: string
}

type ProblemProgressInput = {
  lessonSlug: string
  problemId: string
  completedAt?: number
  draft?: string
  traceAnswers?: unknown
  writtenAnswer?: string
  designAnswers?: unknown
  rubricReviews?: string[]
  revealedReferenceAt?: number
  fieldUpdatedAt?: Record<string, number>
  updatedAt: number
}

type UserSettingsInput = {
  lastLessonSlug?: string
  lastProblemId?: string
  pathMode?: 'guided' | 'self-directed'
  focusLessonSlug?: string
  queuedLessonSlugs?: string[]
  lastVisitedUpdatedAt?: number
  learningPathUpdatedAt?: number
  updatedAt: number
}

type ProgressSnapshotInput = {
  problems: ProblemProgressInput[]
  settings: UserSettingsInput | null
}

type LastVisitedInput = {
  lessonSlug: string
  problemId?: string
  updatedAt: number
}

const identifierPattern = /^[a-z0-9][a-z0-9-]*$/
const simpleTimestampFields = new Set([
  'completed',
  'drafts',
  'writtenAnswers',
  'revealedReferences',
])
const nestedTimestampFields = new Set([
  'traceAnswers',
  'designAnswers',
  'rubricReviews',
])
const textEncoder = new TextEncoder()

export function validateProgressSnapshot(
  snapshot: ProgressSnapshotInput,
  now = Date.now(),
): ProgressInputIssue | undefined {
  if (snapshot.problems.length > PROGRESS_LIMITS.maxProblems) {
    return limitIssue('problems')
  }

  const serializedSize = getJsonByteLength(snapshot)

  if (serializedSize === undefined) {
    return invalidIssue('progress')
  }
  if (serializedSize > PROGRESS_LIMITS.maxSnapshotBytes) {
    return limitIssue('progress')
  }

  const problemKeys = new Set<string>()

  for (const problem of snapshot.problems) {
    const issue = validateProblemProgress(problem, now)

    if (issue) {
      return issue
    }

    const problemKey = `${problem.lessonSlug}::${problem.problemId}`

    if (problemKeys.has(problemKey)) {
      return invalidIssue('problems')
    }
    problemKeys.add(problemKey)
  }

  return snapshot.settings
    ? validateUserSettings(snapshot.settings, now)
    : undefined
}

export function validateProblemProgress(
  problem: ProblemProgressInput,
  now = Date.now(),
): ProgressInputIssue | undefined {
  const serializedSize = getJsonByteLength(problem)

  if (serializedSize === undefined) {
    return invalidIssue('problem')
  }
  if (serializedSize > PROGRESS_LIMITS.maxProblemBytes) {
    return limitIssue('problem')
  }

  const lessonIssue = validateIdentifier(problem.lessonSlug, 'lessonSlug')
  const problemIssue = validateIdentifier(problem.problemId, 'problemId')

  if (lessonIssue || problemIssue) {
    return lessonIssue ?? problemIssue
  }

  if (
    problem.draft !== undefined &&
    problem.draft.length > PROGRESS_LIMITS.maxDraftLength
  ) {
    return limitIssue('draft')
  }
  if (
    problem.writtenAnswer !== undefined &&
    problem.writtenAnswer.length > PROGRESS_LIMITS.maxWrittenAnswerLength
  ) {
    return limitIssue('writtenAnswer')
  }

  const traceIssue = validateAnswerRecord(
    problem.traceAnswers,
    'traceAnswers',
  )
  const designIssue = validateAnswerRecord(
    problem.designAnswers,
    'designAnswers',
  )

  if (traceIssue || designIssue) {
    return traceIssue ?? designIssue
  }

  const rubricIssue = validateIdentifierList(
    problem.rubricReviews,
    'rubricReviews',
    PROGRESS_LIMITS.maxRubricItemsPerProblem,
  )

  if (rubricIssue) {
    return rubricIssue
  }

  const timestampIssue = validateProblemTimestamps(problem, now)

  if (timestampIssue) {
    return timestampIssue
  }

  return validateFieldTimestamps(problem, now)
}

export function validateLastVisited(
  input: LastVisitedInput,
  now = Date.now(),
): ProgressInputIssue | undefined {
  return (
    validateIdentifier(input.lessonSlug, 'lessonSlug') ??
    (input.problemId === undefined
      ? undefined
      : validateIdentifier(input.problemId, 'problemId')) ??
    validateTimestamp(input.updatedAt, 'updatedAt', now)
  )
}

function validateUserSettings(
  settings: UserSettingsInput,
  now: number,
): ProgressInputIssue | undefined {
  const identifiers = [
    ['lastLessonSlug', settings.lastLessonSlug],
    ['lastProblemId', settings.lastProblemId],
    ['focusLessonSlug', settings.focusLessonSlug],
  ] as const

  for (const [field, value] of identifiers) {
    if (value !== undefined) {
      const issue = validateIdentifier(value, field)

      if (issue) {
        return issue
      }
    }
  }

  if (settings.lastProblemId && !settings.lastLessonSlug) {
    return invalidIssue('lastProblemId')
  }

  const queueIssue = validateIdentifierList(
    settings.queuedLessonSlugs,
    'queuedLessonSlugs',
    PROGRESS_LIMITS.maxQueuedLessons,
  )

  if (queueIssue) {
    return queueIssue
  }

  for (const [field, value] of [
    ['lastVisitedUpdatedAt', settings.lastVisitedUpdatedAt],
    ['learningPathUpdatedAt', settings.learningPathUpdatedAt],
    ['updatedAt', settings.updatedAt],
  ] as const) {
    if (value !== undefined) {
      const issue = validateTimestamp(value, field, now)

      if (issue) {
        return issue
      }
    }
  }

  return undefined
}

function validateProblemTimestamps(
  problem: ProblemProgressInput,
  now: number,
) {
  for (const [field, value] of [
    ['completedAt', problem.completedAt],
    ['revealedReferenceAt', problem.revealedReferenceAt],
    ['updatedAt', problem.updatedAt],
  ] as const) {
    if (value !== undefined) {
      const issue = validateTimestamp(value, field, now)

      if (issue) {
        return issue
      }
    }
  }

  return undefined
}

function validateFieldTimestamps(
  problem: ProblemProgressInput,
  now: number,
) {
  if (!problem.fieldUpdatedAt) {
    return undefined
  }

  const entries = Object.entries(problem.fieldUpdatedAt)

  if (entries.length > PROGRESS_LIMITS.maxFieldTimestampsPerProblem) {
    return limitIssue('fieldUpdatedAt')
  }

  for (const [key, value] of entries) {
    if (!isValidFieldTimestampKey(key, problem)) {
      return invalidIssue('fieldUpdatedAt')
    }

    const issue = validateTimestamp(value, 'fieldUpdatedAt', now)

    if (issue) {
      return issue
    }
  }

  return undefined
}

function isValidFieldTimestampKey(
  key: string,
  problem: ProblemProgressInput,
) {
  const [field, lessonSlug, problemId, nestedId, ...extra] = key.split('::')

  if (
    extra.length > 0 ||
    lessonSlug !== problem.lessonSlug ||
    problemId !== problem.problemId
  ) {
    return false
  }

  if (simpleTimestampFields.has(field)) {
    return nestedId === undefined
  }

  return (
    nestedTimestampFields.has(field) &&
    nestedId !== undefined &&
    !validateIdentifier(nestedId, 'fieldUpdatedAt')
  )
}

function validateAnswerRecord(
  value: unknown,
  field: string,
): ProgressInputIssue | undefined {
  if (value === undefined) {
    return undefined
  }
  if (!isRecord(value)) {
    return invalidIssue(field)
  }

  const entries = Object.entries(value)

  if (entries.length > PROGRESS_LIMITS.maxAnswersPerProblem) {
    return limitIssue(field)
  }

  for (const [answerId, answer] of entries) {
    const identifierIssue = validateIdentifier(answerId, field)

    if (identifierIssue) {
      return identifierIssue
    }

    const serializedSize = getJsonByteLength(answer)

    if (serializedSize === undefined) {
      return invalidIssue(field)
    }
    if (serializedSize > PROGRESS_LIMITS.maxStructuredAnswerBytes) {
      return limitIssue(field)
    }
    if (!isBoundedJsonValue(answer)) {
      return invalidIssue(field)
    }
  }

  return undefined
}

function isBoundedJsonValue(value: unknown, depth = 0): boolean {
  if (value === null || typeof value === 'boolean' || typeof value === 'string') {
    return true
  }
  if (typeof value === 'number') {
    return Number.isFinite(value)
  }
  if (depth >= PROGRESS_LIMITS.maxJsonDepth) {
    return false
  }
  if (Array.isArray(value)) {
    return (
      value.length <= PROGRESS_LIMITS.maxJsonCollectionEntries &&
      value.every((item) => isBoundedJsonValue(item, depth + 1))
    )
  }
  if (!isRecord(value)) {
    return false
  }

  const entries = Object.entries(value)

  return (
    entries.length <= PROGRESS_LIMITS.maxJsonCollectionEntries &&
    entries.every(
      ([key, item]) =>
        key.length <= PROGRESS_LIMITS.maxIdentifierLength &&
        isBoundedJsonValue(item, depth + 1),
    )
  )
}

function validateIdentifierList(
  values: string[] | undefined,
  field: string,
  maxItems: number,
): ProgressInputIssue | undefined {
  if (!values) {
    return undefined
  }
  if (values.length > maxItems) {
    return limitIssue(field)
  }

  const uniqueValues = new Set<string>()

  for (const value of values) {
    const issue = validateIdentifier(value, field)

    if (issue || uniqueValues.has(value)) {
      return issue ?? invalidIssue(field)
    }
    uniqueValues.add(value)
  }

  return undefined
}

function validateIdentifier(value: string, field: string) {
  if (value.length === 0) {
    return invalidIssue(field)
  }
  if (value.length > PROGRESS_LIMITS.maxIdentifierLength) {
    return limitIssue(field)
  }

  return identifierPattern.test(value) ? undefined : invalidIssue(field)
}

function validateTimestamp(value: number, field: string, now: number) {
  return Number.isFinite(value) &&
    value >= 0 &&
    value <= now + PROGRESS_LIMITS.maxFutureClockSkewMs
    ? undefined
    : invalidIssue(field)
}

function getJsonByteLength(value: unknown) {
  try {
    const serialized = JSON.stringify(value)

    return serialized === undefined
      ? undefined
      : textEncoder.encode(serialized).byteLength
  } catch {
    return undefined
  }
}

function limitIssue(field: string): ProgressInputIssue {
  return { code: 'PROGRESS_LIMIT_EXCEEDED', field }
}

function invalidIssue(field: string): ProgressInputIssue {
  return { code: 'PROGRESS_INPUT_INVALID', field }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return false
  }

  const prototype = Object.getPrototypeOf(value)

  return prototype === Object.prototype || prototype === null
}
