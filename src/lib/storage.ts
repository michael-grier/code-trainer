import {
  createEmptyProgressState,
  PROGRESS_VERSION,
  type ProgressState,
} from '@/state/progress'

export const GUEST_PROGRESS_STORAGE_KEY = 'code-trainer:progress:v2:guest'
export const USER_PROGRESS_STORAGE_KEY_PREFIX = 'code-trainer:progress:v2:user:'

type ProgressStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>

export function getProgressStorageKey(accountId?: string) {
  return accountId
    ? `${USER_PROGRESS_STORAGE_KEY_PREFIX}${accountId}`
    : GUEST_PROGRESS_STORAGE_KEY
}

export function loadProgressState(
  storage: ProgressStorage,
  key: string,
): ProgressState {
  return parseProgressState(storage.getItem(key))
}

export function saveProgressState(
  storage: ProgressStorage,
  key: string,
  state: ProgressState,
) {
  storage.setItem(key, JSON.stringify(state))
}

export function clearProgressState(storage: ProgressStorage, key: string) {
  storage.removeItem(key)
}

export function parseProgressState(value: string | null): ProgressState {
  if (!value) {
    return createEmptyProgressState()
  }

  try {
    const parsed: unknown = JSON.parse(value)

    if (!isProgressLike(parsed)) {
      return createEmptyProgressState()
    }

    return {
      version: PROGRESS_VERSION,
      completed: normalizeTrueRecord(parsed.completed),
      drafts: normalizeStringRecord(parsed.drafts),
      traceAnswers: normalizeRecord(parsed.traceAnswers),
      writtenAnswers: normalizeStringRecord(parsed.writtenAnswers),
      designAnswers: normalizeRecord(parsed.designAnswers),
      rubricReviews: normalizeNestedTrueRecord(parsed.rubricReviews),
      revealedReferences: normalizeTrueRecord(parsed.revealedReferences),
      updatedAt: normalizeNumberRecord(parsed.updatedAt),
      lastSyncedAt:
        typeof parsed.lastSyncedAt === 'number' ? parsed.lastSyncedAt : undefined,
      learningPath: {
        mode:
          parsed.learningPath.mode === 'self-directed'
            ? 'self-directed'
            : 'guided',
        focusLessonSlug:
          typeof parsed.learningPath.focusLessonSlug === 'string'
            ? parsed.learningPath.focusLessonSlug
            : undefined,
        queuedLessonSlugs: Array.isArray(parsed.learningPath.queuedLessonSlugs)
          ? parsed.learningPath.queuedLessonSlugs.filter(
              (value): value is string => typeof value === 'string',
            )
          : [],
        updatedAt:
          typeof parsed.learningPath.updatedAt === 'number'
            ? parsed.learningPath.updatedAt
            : Date.now(),
      },
      lastVisited: isRecord(parsed.lastVisited)
        ? {
            lessonSlug:
              typeof parsed.lastVisited.lessonSlug === 'string'
                ? parsed.lastVisited.lessonSlug
                : '',
            problemId:
              typeof parsed.lastVisited.problemId === 'string'
                ? parsed.lastVisited.problemId
                : undefined,
            updatedAt:
              typeof parsed.lastVisited.updatedAt === 'number'
                ? parsed.lastVisited.updatedAt
                : Date.now(),
          }
        : undefined,
    }
  } catch {
    return createEmptyProgressState()
  }
}

function isProgressLike(value: unknown): value is ProgressState {
  return (
    isRecord(value) &&
    value.version === PROGRESS_VERSION &&
    isRecord(value.completed) &&
    isRecord(value.drafts) &&
    isRecord(value.traceAnswers) &&
    isRecord(value.writtenAnswers) &&
    isRecord(value.designAnswers) &&
    isRecord(value.rubricReviews) &&
    isRecord(value.revealedReferences) &&
    isRecord(value.updatedAt) &&
    isRecord(value.learningPath)
  )
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function normalizeRecord(value: unknown): Record<string, unknown> {
  return isRecord(value) ? { ...value } : {}
}

function normalizeStringRecord(value: unknown): Record<string, string> {
  if (!isRecord(value)) {
    return {}
  }

  return Object.fromEntries(
    Object.entries(value).filter(
      (entry): entry is [string, string] => typeof entry[1] === 'string',
    ),
  )
}

function normalizeNumberRecord(value: unknown): Record<string, number> {
  if (!isRecord(value)) {
    return {}
  }

  return Object.fromEntries(
    Object.entries(value).filter(
      (entry): entry is [string, number] => typeof entry[1] === 'number',
    ),
  )
}

function normalizeTrueRecord(value: unknown): Record<string, true> {
  if (!isRecord(value)) {
    return {}
  }

  return Object.fromEntries(
    Object.entries(value)
      .filter(([, recordValue]) => recordValue === true)
      .map(([key]) => [key, true]),
  )
}

function normalizeNestedTrueRecord(
  value: unknown,
): Record<string, Record<string, true>> {
  if (!isRecord(value)) {
    return {}
  }

  return Object.fromEntries(
    Object.entries(value)
      .filter((entry): entry is [string, Record<string, unknown>] =>
        isRecord(entry[1]),
      )
      .map(([key, recordValue]) => [key, normalizeTrueRecord(recordValue)]),
  )
}
