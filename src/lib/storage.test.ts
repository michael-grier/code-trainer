import { describe, expect, it } from 'vitest'

import {
  clearProgressHandoffDismissal,
  dismissProgressHandoff,
  GUEST_PROGRESS_STORAGE_KEY,
  getProgressStorageKey,
  hasDismissedProgressHandoff,
  parseProgressState,
  USER_PROGRESS_STORAGE_KEY_PREFIX,
} from '@/lib/storage'
import { createEmptyProgressState } from '@/state/progress'

describe('progress storage', () => {
  it('uses separate guest and authenticated storage keys', () => {
    expect(getProgressStorageKey()).toBe(GUEST_PROGRESS_STORAGE_KEY)
    expect(getProgressStorageKey('user_123')).toBe(
      `${USER_PROGRESS_STORAGE_KEY_PREFIX}user_123`,
    )
  })

  it('resets invalid persisted state defensively', () => {
    expect(parseProgressState('not json')).toMatchObject({
      version: 2,
      completed: {},
      drafts: {},
      learningPath: {
        mode: 'guided',
        queuedLessonSlugs: [],
      },
    })
    expect(parseProgressState(JSON.stringify({ version: 1 }))).toMatchObject({
      version: 2,
      completed: {},
      drafts: {},
      learningPath: {
        mode: 'guided',
        queuedLessonSlugs: [],
      },
    })
  })

  it('keeps valid persisted state and normalizes invalid fields', () => {
    const state = createEmptyProgressState(100)
    state.completed['lesson::problem'] = true
    state.drafts['lesson::problem'] = 'answer'

    const parsed = parseProgressState(
      JSON.stringify({
        ...state,
        completed: {
          ...state.completed,
          bad: false,
        },
        drafts: {
          ...state.drafts,
          bad: 123,
        },
      }),
    )

    expect(parsed.completed).toEqual({ 'lesson::problem': true })
    expect(parsed.drafts).toEqual({ 'lesson::problem': 'answer' })
  })

  it('dismisses a handoff only for the guest revision the user saw', () => {
    const values = new Map<string, string>()
    const storage = {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
      removeItem: (key: string) => values.delete(key),
    }

    dismissProgressHandoff(storage, 'user_123', 100)

    expect(hasDismissedProgressHandoff(storage, 'user_123', 100)).toBe(true)
    expect(hasDismissedProgressHandoff(storage, 'user_123', 101)).toBe(false)

    clearProgressHandoffDismissal(storage, 'user_123')
    expect(hasDismissedProgressHandoff(storage, 'user_123', 100)).toBe(false)
  })
})
