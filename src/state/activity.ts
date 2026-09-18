import { getProblemKey, type ProgressState } from '@/state/progress'

const DAY_MS = 86_400_000

// Days are numbered by local calendar date rather than elapsed time, so
// consecutive dates always differ by one, even across daylight-saving changes.
export function getDayNumber(date: Date) {
  return Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / DAY_MS
}

// Read the result with UTC getters or a UTC-zoned formatter.
export function dayNumberToDate(dayNumber: number) {
  return new Date(dayNumber * DAY_MS)
}

export function getSolvedCountsByDay(progress: ProgressState) {
  const solvedByDay = new Map<number, number>()

  for (const [key, updatedAt] of Object.entries(progress.updatedAt)) {
    const [field, lessonSlug, problemId] = key.split('::')

    if (
      field !== 'completed' ||
      !lessonSlug ||
      !problemId ||
      !progress.completed[getProblemKey(lessonSlug, problemId)]
    ) {
      continue
    }

    const day = getDayNumber(new Date(updatedAt))

    solvedByDay.set(day, (solvedByDay.get(day) ?? 0) + 1)
  }

  return solvedByDay
}

export function getStreaks(solvedByDay: Map<number, number>, today = new Date()) {
  let best = 0

  for (const day of solvedByDay.keys()) {
    // Count each run once, from its first day.
    if (solvedByDay.has(day - 1)) {
      continue
    }

    let length = 1

    while (solvedByDay.has(day + length)) {
      length += 1
    }

    best = Math.max(best, length)
  }

  const todayNumber = getDayNumber(today)
  // A day without a completion only breaks the streak once it has ended.
  let day = solvedByDay.has(todayNumber) ? todayNumber : todayNumber - 1
  let current = 0

  while (solvedByDay.has(day)) {
    current += 1
    day -= 1
  }

  return { current, best }
}
