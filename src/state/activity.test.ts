import { describe, expect, it } from 'vitest'

import { getDayNumber, getSolvedCountsByDay, getStreaks } from '@/state/activity'
import {
  createEmptyProgressState,
  getProblemKey,
  getUpdatedAtKey,
} from '@/state/progress'

const today = new Date(2026, 8, 18, 9)
const daysAgo = (days: number) => getDayNumber(today) - days
const solvedOn = (...days: number[]) => new Map(days.map((day) => [day, 1]))

describe('getSolvedCountsByDay', () => {
  it('counts completions by local calendar day', () => {
    const progress = createEmptyProgressState()

    for (const [problemId, completedAt] of [
      ['one', new Date(2026, 8, 17, 0, 5)],
      ['two', new Date(2026, 8, 17, 23, 55)],
      ['three', new Date(2026, 8, 18, 0, 5)],
    ] as const) {
      progress.completed[getProblemKey('lesson', problemId)] = true
      progress.updatedAt[getUpdatedAtKey('completed', 'lesson', problemId)] =
        completedAt.getTime()
    }
    progress.updatedAt[getUpdatedAtKey('drafts', 'lesson', 'four')] = today.getTime()

    expect(getSolvedCountsByDay(progress)).toEqual(
      new Map([
        [daysAgo(1), 2],
        [daysAgo(0), 1],
      ]),
    )
  })
})

describe('getStreaks', () => {
  it('keeps the current streak alive until today ends without a completion', () => {
    const solvedByDay = solvedOn(daysAgo(3), daysAgo(2), daysAgo(1))

    expect(getStreaks(solvedByDay, today)).toEqual({ current: 3, best: 3 })
  })

  it('resets the current streak after a missed day and keeps the best run', () => {
    const solvedByDay = solvedOn(
      daysAgo(9),
      daysAgo(8),
      daysAgo(7),
      daysAgo(6),
      daysAgo(2),
      daysAgo(0),
    )

    expect(getStreaks(solvedByDay, today)).toEqual({ current: 1, best: 4 })
    expect(getStreaks(solvedOn(daysAgo(2)), today)).toEqual({ current: 0, best: 1 })
  })
})
