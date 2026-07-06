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
  | 'focus'
  | 'ahead-of-path'
  | 'untouched'

export type LearningPathState = {
  mode: 'guided' | 'self-directed'
  recommendedLessonSlug?: string
  focusLessonSlug?: string
  queuedLessonSlugs: string[]
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

export function getActiveLesson(lessons: Lesson[], progress: ProgressState) {
  if (
    progress.learningPath.mode === 'self-directed' &&
    progress.learningPath.focusLessonSlug
  ) {
    const focusedLesson = lessons.find(
      (lesson) => lesson.slug === progress.learningPath.focusLessonSlug,
    )

    if (focusedLesson) {
      return focusedLesson
    }
  }

  return getRecommendedLesson(lessons, progress) ?? lessons[0]
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

  if (
    progress.learningPath.mode === 'self-directed' &&
    progress.learningPath.focusLessonSlug === lesson.slug
  ) {
    return 'focus'
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
      } else if (status === 'in-progress' || status === 'recommended' || status === 'focus') {
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

export function getLearningPathState(
  lessons: Lesson[],
  progress: ProgressState,
): LearningPathState {
  return {
    mode: progress.learningPath.mode,
    recommendedLessonSlug: getRecommendedLesson(lessons, progress)?.slug,
    focusLessonSlug: progress.learningPath.focusLessonSlug,
    queuedLessonSlugs: progress.learningPath.queuedLessonSlugs,
  }
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

  return lesson.problems.some(
    (problem) =>
      progress.languages[problemKey] ||
      progress.drafts[getDraftKey(lesson.slug, problem.id, 'ts')] ||
      progress.drafts[getDraftKey(lesson.slug, problem.id, 'py')],
  )
}

