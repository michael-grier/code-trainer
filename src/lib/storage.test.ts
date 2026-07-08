import { describe, expect, it } from 'vitest'

import {
  GUEST_PROGRESS_STORAGE_KEY,
  getProgressStorageKey,
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
})
