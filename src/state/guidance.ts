import {
  isLessonAvailable,
  type Lesson,
  type Problem,
  type Track,
} from '@/curriculum/types'
import {
  getDraftKey,
  getProblemKey,
  type LessonCompletion,
  type ProgressCounts,
  type ProgressState,
  type TrackCompletion,
} from '@/state/progress'

export type LessonStatus =
  | 'coming-soon'
  | 'completed'
  | 'in-progress'
  | 'recommended'
  | 'ahead-of-path'
  | 'untouched'

export type RecentActivityItem = {
  lesson: Lesson
  problem: Problem
  updatedAt: number
  hasDraft: boolean
}

export function getLessonCompletion(
  lesson: Lesson,
  progress: ProgressState,
): LessonCompletion {
  const totalProblems = lesson.problems.length
  const completedProblems = lesson.problems.filter(
    (problem) => progress.completed[getProblemKey(lesson.slug, problem.id)],
  ).length
  const percent =
    totalProblems === 0 ? 0 : Math.round((completedProblems / totalProblems) * 100)

  return {
    completedProblems,
    totalProblems,
    percent,
    isComplete: totalProblems > 0 && completedProblems === totalProblems,
    isInProgress:
      completedProblems > 0 ||
      lesson.problems.some((problem) => hasProblemActivity(lesson, problem.id, progress)),
  }
}

export function getTrackCompletion(
  track: Track,
  lessons: Lesson[],
  progress: ProgressState,
): TrackCompletion {
  const trackLessons = lessons.filter((lesson) =>
    track.lessonSlugs.includes(lesson.slug) && isLessonAvailable(lesson),
  )
  const completedLessons = trackLessons.filter(
    (lesson) => getLessonCompletion(lesson, progress).isComplete,
  ).length
  const totalLessons = trackLessons.length

  return {
    completedLessons,
    totalLessons,
    percent:
      totalLessons === 0
        ? 0
        : Math.round((completedLessons / totalLessons) * 100),
  }
}

// The lesson a self-directed learner chose to focus on, when it still exists.
export function getFocusLesson(lessons: Lesson[], progress: ProgressState) {
  const { focusLessonSlug, mode } = progress.learningPath

  if (mode !== 'self-directed' || !focusLessonSlug) {
    return undefined
  }

  const lesson = lessons.find((candidate) => candidate.slug === focusLessonSlug)

  return lesson && isLessonAvailable(lesson) ? lesson : undefined
}

export function getRecommendedLesson(
  lessons: Lesson[],
  progress: ProgressState,
) {
  const isIncomplete = (lesson: Lesson) =>
    isLessonAvailable(lesson) && !getLessonCompletion(lesson, progress).isComplete
  const focusLesson = getFocusLesson(lessons, progress)

  if (focusLesson) {
    // A focus narrows the path to one track, walking forward from the focus
    // lesson. Once that track is done the guided order takes over again.
    const nextInTrack = lessons.find(
      (lesson) =>
        lesson.track === focusLesson.track &&
        lesson.order >= focusLesson.order &&
        isIncomplete(lesson),
    )

    if (nextInTrack) {
      return nextInTrack
    }
  }

  return lessons.find(isIncomplete)
}

export function getRecommendedProblem(lesson: Lesson, progress: ProgressState) {
  return (
    lesson.problems.find(
      (problem) => !progress.completed[getProblemKey(lesson.slug, problem.id)],
    ) ?? lesson.problems[0]
  )
}

export function getLessonStatus(
  lesson: Lesson,
  lessons: Lesson[],
  progress: ProgressState,
): LessonStatus {
  if (!isLessonAvailable(lesson)) {
    return 'coming-soon'
  }

  const completion = getLessonCompletion(lesson, progress)
  const recommendedLesson = getRecommendedLesson(lessons, progress)

  if (completion.isComplete) {
    return 'completed'
  }

  if (recommendedLesson?.slug === lesson.slug) {
    return 'recommended'
  }

  if (completion.isInProgress) {
    return 'in-progress'
  }

  // Focusing a track is a deliberate step off the guided order, so nothing
  // counts as ahead of it while that choice is active.
  if (
    recommendedLesson &&
    lesson.order > recommendedLesson.order &&
    !getFocusLesson(lessons, progress)
  ) {
    return 'ahead-of-path'
  }

  return 'untouched'
}

export function getProgressCounts(
  lessons: Lesson[],
  progress: ProgressState,
): ProgressCounts {
  return lessons.reduce<ProgressCounts>(
    (counts, lesson) => {
      const status = getLessonStatus(lesson, lessons, progress)

      if (status === 'coming-soon') {
        return counts
      }

      if (status === 'completed') {
        counts.completed += 1
      } else if (status === 'in-progress' || status === 'recommended') {
        counts.inProgress += 1
      } else if (status === 'ahead-of-path') {
        counts.aheadOfPath += 1
      } else {
        counts.untouched += 1
      }

      return counts
    },
    { completed: 0, inProgress: 0, untouched: 0, aheadOfPath: 0 },
  )
}

// Unfinished problems with saved work, newest first. Every save records a
// timestamp under "<field>::<lesson>::<problem>[::<part>]", so the latest
// stamp per problem is its last activity.
export function getRecentActivity(
  lessons: Lesson[],
  progress: ProgressState,
  limit = 4,
): RecentActivityItem[] {
  const latestByProblem = new Map<string, number>()

  for (const [key, updatedAt] of Object.entries(progress.updatedAt)) {
    const [, lessonSlug, problemId] = key.split('::')

    if (!lessonSlug || !problemId) {
      continue
    }

    const problemKey = getProblemKey(lessonSlug, problemId)

    latestByProblem.set(
      problemKey,
      Math.max(latestByProblem.get(problemKey) ?? 0, updatedAt),
    )
  }

  const items: RecentActivityItem[] = []

  for (const lesson of lessons.filter(isLessonAvailable)) {
    for (const problem of lesson.problems) {
      const problemKey = getProblemKey(lesson.slug, problem.id)
      const updatedAt = latestByProblem.get(problemKey)

      if (!updatedAt || progress.completed[problemKey]) {
        continue
      }

      items.push({
        lesson,
        problem,
        updatedAt,
        hasDraft: hasEditedDraft(lesson, problem, progress),
      })
    }
  }

  return items.sort((a, b) => b.updatedAt - a.updatedAt).slice(0, limit)
}

function hasEditedDraft(lesson: Lesson, problem: Problem, progress: ProgressState) {
  const draft = progress.drafts[getDraftKey(lesson.slug, problem.id)]

  if (!draft?.trim()) {
    return false
  }

  // Reset saves the starter back as the draft, so only edits away from it
  // count as a draft worth returning to.
  const starter =
    problem.kind === 'debug'
      ? problem.brokenCode
      : 'starter' in problem
        ? problem.starter
        : undefined

  return draft !== starter
}

function hasProblemActivity(
  lesson: Lesson,
  problemId: string,
  progress: ProgressState,
) {
  const problemKey = getProblemKey(lesson.slug, problemId)

  if (
    progress.writtenAnswers[problemKey] ||
    progress.rubricReviews[problemKey] ||
    progress.revealedReferences[problemKey]
  ) {
    return true
  }

  return lesson.problems.some((problem) => {
    return progress.drafts[getDraftKey(lesson.slug, problem.id)]
  })
}
