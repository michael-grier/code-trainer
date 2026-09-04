import { isLessonAvailable, type Lesson } from '@/curriculum/types'
import { getRecommendedLesson, getRecommendedProblem } from '@/state/guidance'
import { getProblemKey, type ProgressState } from '@/state/progress'

export type LearningTarget = {
  lessonSlug: string
  problemId?: string
}

export type ProblemNavigationItem = {
  lessonSlug: string
  lessonTitle: string
  problemId: string
  problemTitle: string
}

export function getContinueTarget(
  lessons: Lesson[],
  progress: ProgressState,
): LearningTarget | undefined {
  if (progress.lastVisited) {
    const lesson = lessons.find(
      (item) => item.slug === progress.lastVisited?.lessonSlug,
    )

    if (lesson && isLessonAvailable(lesson)) {
      const problem = progress.lastVisited.problemId
        ? lesson.problems.find(
            (item) => item.id === progress.lastVisited?.problemId,
          )
        : undefined

      if (!progress.lastVisited.problemId || problem) {
        return {
          lessonSlug: lesson.slug,
          problemId: problem?.id,
        }
      }
    }
  }

  const recommendedLesson =
    getRecommendedLesson(lessons, progress) ?? lessons.find(isLessonAvailable)

  if (!recommendedLesson) {
    return undefined
  }

  return {
    lessonSlug: recommendedLesson.slug,
    problemId: getRecommendedProblem(recommendedLesson, progress).id,
  }
}

export function getProblemNavigation(
  lessons: Lesson[],
  lessonSlug: string,
  problemId: string,
) {
  const items = getProblemNavigationItems(lessons)
  const currentIndex = items.findIndex(
    (item) => item.lessonSlug === lessonSlug && item.problemId === problemId,
  )

  if (currentIndex === -1) {
    return {
      previous: undefined,
      next: undefined,
    }
  }

  return {
    previous: items[currentIndex - 1],
    next: items[currentIndex + 1],
  }
}

export function getProblemNavigationItems(
  lessons: Lesson[],
): ProblemNavigationItem[] {
  return lessons
    .filter(isLessonAvailable)
    .flatMap((lesson) =>
      lesson.problems.map((problem) => ({
        lessonSlug: lesson.slug,
        lessonTitle: lesson.title,
        problemId: problem.id,
        problemTitle: problem.title,
      })),
    )
}

export function getNextIncompleteProblem(
  lessons: Lesson[],
  progress: ProgressState,
) {
  return getProblemNavigationItems(lessons).find(
    (item) => !progress.completed[getProblemKey(item.lessonSlug, item.problemId)],
  )
}

export function learningTargetToPath(target: LearningTarget | undefined) {
  if (!target) {
    return '/progress'
  }

  if (target.problemId) {
    return `/lesson/${target.lessonSlug}/problem/${target.problemId}`
  }

  return `/lesson/${target.lessonSlug}`
}
