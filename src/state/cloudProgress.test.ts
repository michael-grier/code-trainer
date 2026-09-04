import { describe, expect, test } from 'vitest'

import {
  cloudSnapshotToProgressState,
  mergeProgressStates,
  progressStateToCloudSnapshot,
  summarizeProgress,
} from '@/state/cloudProgress'
import {
  createEmptyProgressState,
  getDraftKey,
  getProblemKey,
  getTraceAnswerKey,
  getUpdatedAtKey,
} from '@/state/progress'

describe('cloud progress sync helpers', () => {
  test('OR-merges completion and uses last-write-wins for drafts', () => {
    const local = createEmptyProgressState(0)
    const cloud = createEmptyProgressState(0)
    const problemKey = getProblemKey('arrays-and-hashing', 'practice')
    const draftKey = getDraftKey('arrays-and-hashing', 'practice')

    local.completed[problemKey] = true
    local.updatedAt[getUpdatedAtKey('completed', 'arrays-and-hashing', 'practice')] =
      100
    local.drafts[draftKey] = 'local draft'
    local.updatedAt[
      getUpdatedAtKey('drafts', 'arrays-and-hashing', 'practice')
    ] = 100
    cloud.drafts[draftKey] = 'cloud draft'
    cloud.updatedAt[
      getUpdatedAtKey('drafts', 'arrays-and-hashing', 'practice')
    ] = 200

    const merged = mergeProgressStates(local, cloud)

    expect(merged.completed[problemKey]).toBe(true)
    expect(merged.drafts[draftKey]).toBe('cloud draft')
  })

  test('union-merges recently changed queued lessons', () => {
    const local = createEmptyProgressState(0)
    const cloud = createEmptyProgressState(0)

    local.learningPath = {
      mode: 'self-directed',
      focusLessonSlug: 'arrays-and-hashing',
      queuedLessonSlugs: ['two-pointers'],
      updatedAt: 1_000,
    }
    local.updatedAt[getUpdatedAtKey('learningPath')] = 1_000
    cloud.learningPath = {
      mode: 'self-directed',
      focusLessonSlug: 'sliding-window',
      queuedLessonSlugs: ['prefix-sums-and-difference-arrays'],
      updatedAt: 1_500,
    }
    cloud.updatedAt[getUpdatedAtKey('learningPath')] = 1_500

    const merged = mergeProgressStates(local, cloud)

    expect(merged.learningPath.focusLessonSlug).toBe('sliding-window')
    expect(merged.learningPath.queuedLessonSlugs).toEqual([
      'two-pointers',
      'prefix-sums-and-difference-arrays',
    ])
  })

  test('preserves field timestamps through cloud conversion', () => {
    const state = createEmptyProgressState(0)
    const draftKey = getDraftKey('arrays-and-hashing', 'practice')
    const traceKey = getTraceAnswerKey(
      'arrays-and-hashing',
      'practice',
      'step-one',
    )

    state.drafts[draftKey] = 'export function practice() {}'
    state.updatedAt[
      getUpdatedAtKey('drafts', 'arrays-and-hashing', 'practice')
    ] = 300
    state.traceAnswers[traceKey] = 'runs once'
    state.updatedAt[
      getUpdatedAtKey(
        'traceAnswers',
        'arrays-and-hashing',
        'practice',
        'step-one',
      )
    ] = 350

    const snapshot = progressStateToCloudSnapshot(state, 350)
    const roundTrip = cloudSnapshotToProgressState(snapshot)

    expect(snapshot.problems).toHaveLength(1)
    expect(roundTrip.drafts[draftKey]).toBe('export function practice() {}')
    expect(roundTrip.updatedAt[getUpdatedAtKey('drafts', 'arrays-and-hashing', 'practice')]).toBe(300)
    expect(roundTrip.traceAnswers[traceKey]).toBe('runs once')
  })

  test('distinguishes meaningful guest work from navigation metadata', () => {
    const navigationOnly = createEmptyProgressState(100)
    navigationOnly.lastVisited = {
      lessonSlug: 'arrays-and-hashing',
      updatedAt: 200,
    }

    expect(summarizeProgress(navigationOnly).hasMeaningfulWork).toBe(false)

    navigationOnly.traceAnswers['lesson::problem::question'] = 'answer'

    expect(summarizeProgress(navigationOnly)).toMatchObject({
      savedAnswers: 1,
      hasMeaningfulWork: true,
    })
  })
})
