import type { Lesson, Track } from '@/curriculum/types'
import {
  getDraftKey,
  getProblemKey,
  type LessonCompletion,
  type ProgressCounts,
  type ProgressState,
  type TrackCompletion,
} from '@/state/progress'

export type LessonStatus =
  | 'completed'
  | 'in-progress'
  | 'recommended'
  | 'ahead-of-path'
  | 'untouched'

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
    track.lessonSlugs.includes(lesson.slug),
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

export function getRecommendedLesson(
  lessons: Lesson[],
  progress: ProgressState,
) {
  return lessons.find((lesson) => !getLessonCompletion(lesson, progress).isComplete)
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

  if (recommendedLesson && lesson.order > recommendedLesson.order) {
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
